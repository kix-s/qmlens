"""Training loop that produces per-epoch snapshots for the QMLens visualizer."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable, Dict, List, Optional

import numpy as np
import pennylane as qml
from pennylane import numpy as pnp

from .circuit import (
    CircuitSpec,
    circuit_layout,
    make_all_z_qnode,
    make_qnode,
    make_state_qnode,
    make_zz_qnode,
)
from .scenarios import Scenario, get_scenario


@dataclass
class TrainConfig:
    scenario: str = "two_moons"
    n_qubits: int = 4
    n_layers: int = 3
    epochs: int = 30
    lr: float = 0.1
    n_samples: int = 120
    noise: float = 0.15
    seed: int = 42
    snapshot_sample_size: int = 24  # subset for ZZ correlation snapshot


@dataclass
class TrainState:
    config: TrainConfig
    spec: CircuitSpec
    scenario: Optional[Scenario] = None
    status: str = "idle"  # idle | running | done | error
    epoch: int = 0
    snapshots: List[Dict] = field(default_factory=list)
    layout: List[Dict] = field(default_factory=list)
    final_accuracy: Optional[float] = None
    error: Optional[str] = None


def _load_dataset(cfg: TrainConfig, scenario: Scenario):
    return scenario.loader(cfg.n_samples, cfg.noise, cfg.seed)


def _accuracy(predict_fn, X, y) -> float:
    preds = np.array([np.sign(predict_fn(x)) for x in X])
    preds[preds == 0] = 1
    return float(np.mean(preds == y))


def _qubit_correlation_matrix(zz_fn, z_fn, weights, X_sub, spec, pairs):
    """Connected correlation Cov(Z_i, Z_j) averaged over a small batch.

    C_ij = <Z_i Z_j> - <Z_i><Z_j>, averaged over samples. Diagonal set to 1.
    Returns (corr_matrix, mean_Z_per_qubit) so callers don't have to re-run
    the Z qnode separately.
    """
    n = spec.n_qubits
    mat = np.zeros((n, n), dtype=float)
    diag = np.zeros(n, dtype=float)
    z_sum = np.zeros(n, dtype=float)
    count = 0
    for x in X_sub:
        zs = np.array(z_fn(weights, x), dtype=float)
        zz = np.array(zz_fn(weights, x), dtype=float)
        for k, (i, j) in enumerate(pairs):
            mat[i, j] += zz[k] - zs[i] * zs[j]
            mat[j, i] = mat[i, j]
        diag += 1.0 - zs * zs  # variance of Z_i (since Z^2=I)
        z_sum += zs
        count += 1
    mat /= max(count, 1)
    diag /= max(count, 1)
    z_avg = z_sum / max(count, 1)
    # Normalize off-diagonals by sqrt(var_i * var_j) so |C| <= 1 roughly
    norm = np.sqrt(np.outer(diag, diag) + 1e-12)
    out = mat / norm
    np.fill_diagonal(out, 1.0)
    out = np.clip(out, -1.0, 1.0)
    return out, z_avg


# --- Information-theoretic correlation metrics ---------------------------------------
# These are computed from the simulator's full state vector. They are
# meaningful only for the (small) `default.qubit` simulator we use here.

_SIGMA_Y = np.array([[0, -1j], [1j, 0]], dtype=complex)
_YY = np.kron(_SIGMA_Y, _SIGMA_Y)


def _reduced_dm(psi: np.ndarray, keep: List[int], n: int) -> np.ndarray:
    """Partial trace of |psi><psi| over wires NOT in `keep`.

    PennyLane's default.qubit returns the state with wire 0 as the most
    significant index, matching ``reshape([2]*n)``.
    """
    psi_t = np.asarray(psi, dtype=complex).reshape([2] * n)
    # Build einsum: psi over indices a0..a_{n-1}, conj(psi) shares the
    # traced indices and gets fresh labels on kept ones.
    in1 = list(range(n))
    in2 = list(range(n))
    next_label = n
    keep_set = set(keep)
    for i in range(n):
        if i in keep_set:
            in2[i] = next_label
            next_label += 1
    out_axes = [in1[i] for i in keep] + [in2[i] for i in keep]
    rho = np.einsum(psi_t, in1, np.conj(psi_t), in2, out_axes)
    d = 2 ** len(keep)
    return rho.reshape(d, d)


def _von_neumann_entropy(rho: np.ndarray) -> float:
    """S(rho) in bits. Clamps tiny / negative eigenvalues from numerical noise."""
    evals = np.linalg.eigvalsh(rho)
    evals = np.clip(np.real(evals), 1e-12, 1.0)
    return float(-np.sum(evals * np.log2(evals)))


def _concurrence(rho_ij: np.ndarray) -> float:
    """Wootters concurrence of a two-qubit density matrix."""
    rho_tilde = _YY @ np.conj(rho_ij) @ _YY
    # Eigenvalues of rho * rho_tilde are non-negative real (in theory).
    evals = np.linalg.eigvals(rho_ij @ rho_tilde)
    evals = np.sort(np.clip(np.real(evals), 0.0, None))[::-1]
    sqrts = np.sqrt(evals)
    return float(max(0.0, sqrts[0] - sqrts[1] - sqrts[2] - sqrts[3]))


def _info_metrics(state_fn, weights, X_sub, n_qubits: int):
    """Average per-pair mutual information (bits) and concurrence.

    Computed per sample then averaged, which is more meaningful than
    averaging the density matrices first.
    """
    pairs = [(i, j) for i in range(n_qubits) for j in range(i + 1, n_qubits)]
    mi = np.zeros((n_qubits, n_qubits), dtype=float)
    conc = np.zeros((n_qubits, n_qubits), dtype=float)
    count = 0
    for x in X_sub:
        psi = np.asarray(state_fn(weights, x), dtype=complex)
        single_rhos = [_reduced_dm(psi, [i], n_qubits) for i in range(n_qubits)]
        single_S = [_von_neumann_entropy(r) for r in single_rhos]
        for i, j in pairs:
            rho_ij = _reduced_dm(psi, [i, j], n_qubits)
            s_ij = _von_neumann_entropy(rho_ij)
            mi_val = max(0.0, single_S[i] + single_S[j] - s_ij)
            c_val = _concurrence(rho_ij)
            mi[i, j] += mi_val
            mi[j, i] = mi[i, j]
            conc[i, j] += c_val
            conc[j, i] = conc[i, j]
        count += 1
    c = max(count, 1)
    return mi / c, conc / c


def run_training(
    cfg: TrainConfig,
    on_snapshot: Optional[Callable[[Dict], None]] = None,
) -> TrainState:
    np.random.seed(cfg.seed)
    scenario = get_scenario(cfg.scenario)
    spec = CircuitSpec(
        n_qubits=cfg.n_qubits,
        n_layers=cfg.n_layers,
        n_features=scenario.n_features,
    )
    state = TrainState(
        config=cfg,
        spec=spec,
        scenario=scenario,
        status="running",
        layout=circuit_layout(spec),
    )

    Xtr, Xte, ytr, yte = _load_dataset(cfg, scenario)

    qnode = make_qnode(spec)
    z_qnode = make_all_z_qnode(spec)
    zz_qnode, pairs = make_zz_qnode(spec)
    state_qnode = make_state_qnode(spec)

    shape = spec.param_shape()
    weights = pnp.array(
        0.1 * np.random.randn(*shape), requires_grad=True
    )
    # Trainable output scale. The raw circuit output <Z_0> lives in [-1, 1]
    # but is usually further restricted by the ansatz; scaling lets the
    # model stretch its prediction toward the +-1 targets without changing
    # the sign (so the classifier decision rule is preserved).
    scale = pnp.array(1.0, requires_grad=True)

    def predict(x, w=None, s=None):
        w = weights if w is None else w
        s = scale if s is None else s
        return float(s * qnode(w, x))

    def loss_fn(w, s, X, y):
        preds = s * pnp.stack([qnode(w, x) for x in X])
        # MSE on +-1 targets
        return pnp.mean((preds - y) ** 2)

    opt = qml.AdamOptimizer(stepsize=cfg.lr)
    grad_fn = qml.grad(loss_fn, argnum=[0, 1])

    rng = np.random.default_rng(cfg.seed)

    def snapshot(epoch: int, loss_val: float, grads_w: np.ndarray, grad_s: float) -> Dict:
        idx = rng.choice(len(Xtr), size=min(cfg.snapshot_sample_size, len(Xtr)), replace=False)
        X_sub = Xtr[idx]
        corr, z_avg = _qubit_correlation_matrix(
            zz_qnode, z_qnode, weights, X_sub, spec, pairs
        )
        mi, conc = _info_metrics(state_qnode, weights, X_sub, spec.n_qubits)
        train_acc = _accuracy(predict, Xtr, ytr)
        test_acc = _accuracy(predict, Xte, yte)
        snap = {
            "epoch": int(epoch),
            "loss": float(loss_val),
            "train_accuracy": train_acc,
            "test_accuracy": test_acc,
            "parameters": np.asarray(weights).tolist(),  # shape (L, Q, 2)
            "gradients": np.asarray(grads_w).tolist(),
            "grad_norm": float(np.linalg.norm(np.asarray(grads_w))),
            "qubit_correlations": corr.tolist(),
            "qubit_mutual_information": mi.tolist(),
            "qubit_concurrence": conc.tolist(),
            "measurements": {f"q{i}": float(z_avg[i]) for i in range(spec.n_qubits)},
            "output_scale": float(scale),
            "output_scale_grad": float(grad_s),
        }
        return snap

    # Initial snapshot (epoch 0). qml.grad caches the forward value on
    # ``.forward`` so we don't need a separate loss_fn call.
    grads_w, grads_s = grad_fn(weights, scale, Xtr, ytr)
    initial_loss = float(grad_fn.forward)
    snap0 = snapshot(0, initial_loss, np.asarray(grads_w), float(grads_s))
    state.snapshots.append(snap0)
    if on_snapshot:
        on_snapshot(snap0)

    try:
        for epoch in range(1, cfg.epochs + 1):
            # One forward+backward, then a manual Adam update for both the
            # circuit weights and the output scale.
            grads_w, grads_s = grad_fn(weights, scale, Xtr, ytr)
            loss_val = float(grad_fn.forward)
            weights, scale = opt.apply_grad(
                (grads_w, grads_s), (weights, scale)
            )
            snap = snapshot(epoch, loss_val, np.asarray(grads_w), float(grads_s))
            state.snapshots.append(snap)
            state.epoch = epoch
            if on_snapshot:
                on_snapshot(snap)
        state.final_accuracy = state.snapshots[-1]["test_accuracy"]
        state.status = "done"
    except Exception as e:  # pragma: no cover
        state.status = "error"
        state.error = str(e)
    return state
