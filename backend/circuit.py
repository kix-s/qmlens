"""Variational quantum circuit definition for the QMLens prototype.

Architecture:
    - Angle encoding of classical features (RY on each qubit).
    - L layers of: per-qubit (RY, RZ) rotations + ring of CNOT entanglers.
    - Measurement: <Z> on qubit 0 used as the classifier output (mapped to [0,1]).

Also exposes helpers to compute pairwise qubit correlations (a proxy for
entanglement strength) and per-qubit <Z> expectations for the visualizer.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Tuple

import numpy as np
import pennylane as qml


@dataclass
class CircuitSpec:
    n_qubits: int = 4
    n_layers: int = 2
    n_features: int = 2  # two-moons -> 2D

    @property
    def n_params(self) -> int:
        # 2 rotations (RY, RZ) per qubit per layer
        return self.n_layers * self.n_qubits * 2

    def param_shape(self) -> Tuple[int, int, int]:
        return (self.n_layers, self.n_qubits, 2)


def make_device(spec: CircuitSpec):
    return qml.device("default.qubit", wires=spec.n_qubits)


def _feature_map(x, spec: CircuitSpec) -> None:
    """Encode classical features into rotation angles.

    Pads / tiles features if n_qubits > n_features.
    """
    for q in range(spec.n_qubits):
        feat = x[q % spec.n_features]
        qml.RY(np.pi * feat, wires=q)


def _variational_layer(weights_layer, spec: CircuitSpec) -> None:
    """One rotation + entangler block. weights_layer shape: (n_qubits, 2)."""
    for q in range(spec.n_qubits):
        qml.RY(weights_layer[q, 0], wires=q)
        qml.RZ(weights_layer[q, 1], wires=q)
    for q in range(spec.n_qubits):
        qml.CNOT(wires=[q, (q + 1) % spec.n_qubits])


def _ansatz(weights, x, spec: CircuitSpec) -> None:
    """Data re-uploading ansatz: re-encode features before EACH variational
    layer. Classical features get a chance to influence every block, which
    significantly increases the expressive power for the same parameter
    count (cf. PĂ©rez-Salinas et al. 2020, "Data re-uploading classifier").
    """
    for l in range(spec.n_layers):
        _feature_map(x, spec)
        _variational_layer(weights[l], spec)


def make_qnode(spec: CircuitSpec):
    dev = make_device(spec)

    @qml.qnode(dev, interface="autograd", diff_method="backprop")
    def circuit(weights, x):
        _ansatz(weights, x, spec)
        return qml.expval(qml.PauliZ(0))

    return circuit


def make_all_z_qnode(spec: CircuitSpec):
    """QNode returning <Z_i> for every qubit (used for the snapshot)."""
    dev = make_device(spec)

    @qml.qnode(dev, interface="autograd")
    def circuit(weights, x):
        _ansatz(weights, x, spec)
        return [qml.expval(qml.PauliZ(i)) for i in range(spec.n_qubits)]

    return circuit


def make_zz_qnode(spec: CircuitSpec):
    """QNode returning <Z_i Z_j> for every pair (i<j)."""
    dev = make_device(spec)
    pairs = [(i, j) for i in range(spec.n_qubits) for j in range(i + 1, spec.n_qubits)]

    @qml.qnode(dev, interface="autograd")
    def circuit(weights, x):
        _ansatz(weights, x, spec)
        return [qml.expval(qml.PauliZ(i) @ qml.PauliZ(j)) for i, j in pairs]

    return circuit, pairs


def circuit_layout(spec: CircuitSpec) -> List[dict]:
    """Static description of the circuit for the frontend Circuit View.

    Returns a list of layer descriptors, each layer is a list of gate ops.
    With data re-uploading, an Encoding column precedes EVERY variational
    layer.
    """
    layers: List[dict] = []

    # Variational layers, each preceded by its own encoding column.
    for l in range(spec.n_layers):
        enc_gates = []
        for q in range(spec.n_qubits):
            enc_gates.append({
                "gate": "RY",
                "wires": [q],
                "kind": "encoding",
                "label": f"RY(π·x{q % spec.n_features})",
            })
        layers.append({"name": f"Encode L{l + 1}", "gates": enc_gates})

        rot_gates = []
        for q in range(spec.n_qubits):
            rot_gates.append({
                "gate": "RY",
                "wires": [q],
                "kind": "trainable",
                "param_index": [l, q, 0],
            })
            rot_gates.append({
                "gate": "RZ",
                "wires": [q],
                "kind": "trainable",
                "param_index": [l, q, 1],
            })
        layers.append({"name": f"Rotations L{l + 1}", "gates": rot_gates})

        ent_gates = []
        for q in range(spec.n_qubits):
            ent_gates.append({
                "gate": "CNOT",
                "wires": [q, (q + 1) % spec.n_qubits],
                "kind": "entangler",
            })
        layers.append({"name": f"Entangle L{l + 1}", "gates": ent_gates})

    # Measurement
    layers.append({
        "name": "Measure",
        "gates": [{"gate": "M", "wires": [0], "kind": "measure"}],
    })
    return layers
