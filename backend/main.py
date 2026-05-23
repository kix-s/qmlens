"""FastAPI server exposing training runs and snapshots for the QMLens UI."""
from __future__ import annotations

import threading
import uuid
from typing import Dict, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .trainer import TrainConfig, TrainState, run_training
from .circuit import CircuitSpec, circuit_layout
from .scenarios import get_scenario, list_scenarios, SCENARIOS

app = FastAPI(title="QMLens API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# in-memory run registry; fine for the single-user prototype
_runs: Dict[str, TrainState] = {}
_locks: Dict[str, threading.Lock] = {}


class TrainRequest(BaseModel):
    scenario: str = Field("two_moons", description="Scenario id; see /api/scenarios.")
    n_qubits: int = Field(4, ge=2, le=6)
    n_layers: int = Field(3, ge=1, le=5)
    epochs: int = Field(30, ge=1, le=200)
    lr: float = Field(0.1, gt=0, le=1.0)
    n_samples: int = Field(120, ge=40, le=600)
    noise: float = Field(0.15, ge=0.0, le=0.5)
    seed: int = 42


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/scenarios")
def get_scenarios():
    """Catalog of available training scenarios (used by the UI dropdown)."""
    return {"scenarios": list_scenarios()}


@app.post("/api/train")
def start_training(req: TrainRequest):
    if req.scenario not in SCENARIOS:
        raise HTTPException(400, f"unknown scenario '{req.scenario}'")
    run_id = uuid.uuid4().hex[:8]
    cfg = TrainConfig(**req.model_dump())
    scenario = get_scenario(cfg.scenario)
    # Build the spec + layout up front so polling clients see something useful
    # immediately, before the first epoch finishes.
    spec = CircuitSpec(
        n_qubits=cfg.n_qubits, n_layers=cfg.n_layers, n_features=scenario.n_features
    )
    placeholder = TrainState(
        config=cfg,
        spec=spec,
        scenario=scenario,
        status="running",
        layout=circuit_layout(spec),
    )
    _runs[run_id] = placeholder
    _locks[run_id] = threading.Lock()

    def _worker():
        # Stream each snapshot into the placeholder so the UI sees progress
        # while training runs, instead of waiting for the whole run to finish.
        def on_snap(snap):
            with _locks[run_id]:
                placeholder.snapshots.append(snap)
                placeholder.epoch = snap["epoch"]

        try:
            result = run_training(cfg, on_snapshot=on_snap)
            with _locks[run_id]:
                # Preserve the streamed snapshots; just copy over final status.
                placeholder.status = result.status
                placeholder.error = result.error
                placeholder.final_accuracy = result.final_accuracy
        except Exception as e:  # pragma: no cover
            with _locks[run_id]:
                placeholder.status = "error"
                placeholder.error = str(e)

    t = threading.Thread(target=_worker, daemon=True)
    t.start()
    return {"run_id": run_id, "status": "running"}


@app.post("/api/train/sync")
def train_sync(req: TrainRequest):
    """Run training synchronously and return the full result. Easier for demos."""
    cfg = TrainConfig(**req.model_dump())
    result = run_training(cfg)
    run_id = uuid.uuid4().hex[:8]
    _runs[run_id] = result
    return _state_to_dict(run_id, result)


@app.get("/api/runs")
def list_runs():
    return [
        {"run_id": rid, "status": st.status, "epochs": len(st.snapshots)}
        for rid, st in _runs.items()
    ]


@app.get("/api/runs/{run_id}")
def get_run(run_id: str, since_epoch: int = -1):
    st = _runs.get(run_id)
    if st is None:
        raise HTTPException(404, "run not found")
    return _state_to_dict(run_id, st, since_epoch=since_epoch)


def _state_to_dict(run_id: str, st: TrainState, since_epoch: int = -1) -> dict:
    snaps = [s for s in st.snapshots if s["epoch"] > since_epoch]
    scenario_id = st.scenario.id if st.scenario else (st.config.scenario if st.config else None)
    scenario_name = st.scenario.name if st.scenario else None
    return {
        "run_id": run_id,
        "status": st.status,
        "error": st.error,
        "config": st.config.__dict__ if st.config else None,
        "scenario": scenario_id,
        "scenario_name": scenario_name,
        "n_qubits": st.spec.n_qubits if st.spec else (st.config.n_qubits if st.config else None),
        "n_layers": st.spec.n_layers if st.spec else (st.config.n_layers if st.config else None),
        "layout": st.layout,
        "snapshots": snaps,
        "total_snapshots": len(st.snapshots),
        "final_accuracy": st.final_accuracy,
    }


if __name__ == "__main__":  # pragma: no cover
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=False)
