# QMLens — Quantum ML Visualizer (Prototype 1)

First prototype of the QMLens / vqml plan. A 2–4 qubit variational quantum
classifier is trained on the two-moons dataset and streamed to a React UI
that renders four MVP views:

1. **Circuit View** — gates colored by type, trainable rotations tinted by
   gradient magnitude, current parameter shown under each rotation.
2. **Training Timeline** — loss, train/test accuracy, gradient norm.
3. **Entanglement Graph** — qubits arranged on a ring, edges weighted by
   |Cov(Z_i, Z_j)|, node color = ⟨Z_i⟩.
4. **Parameter Heatmap** — rows = (layer, RY/RZ), cols = qubit.

A timeline slider scrubs through epochs; "follow latest" keeps the UI live
during training.

## Stack

- Backend: Python · FastAPI · PennyLane (`default.qubit`) · scikit-learn
- Frontend: React 18 · Vite · plain SVG (no heavy chart deps)
- Data: per-epoch JSON snapshots (`loss`, `parameters`, `gradients`,
  `qubit_correlations`, `measurements`, accuracies)

## Snapshot format

```json
{
  "epoch": 10,
  "loss": 0.34,
  "train_accuracy": 0.91,
  "test_accuracy": 0.88,
  "parameters": [[[/*RY*/, /*RZ*/], "..."], "..."],
  "gradients":  [[[0.02, -0.11], "..."], "..."],
  "grad_norm": 0.21,
  "qubit_correlations": [[1.0, 0.7, "..."], "..."],
  "measurements": {"q0": 0.73, "q1": 0.21}
}
```

## Run

### With Docker Compose (recommended)

```bash
docker compose up --build
# UI:      http://localhost:5173
# API:     http://localhost:8000
# Docs:    http://localhost:8000/docs
```

The `frontend` container proxies `/api` to the `backend` service over the
internal Docker network (`VITE_API_TARGET=http://backend:8000`). The backend
exposes a healthcheck on `/api/health` and the frontend waits for it before
starting.

### Local dev (no Docker)

#### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cd ..
uvicorn backend.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# open http://localhost:5173
```

Click **Train**. The UI polls `/api/runs/{id}` and animates as snapshots arrive.

## Learning journey

A 14-day beginner-friendly course that uses QMLens as the visual aid lives
in [vmql-journey/](vmql-journey/README.md). Start there if quantum or
quantum ML is new to you.

## API

- `POST /api/train` → `{run_id}`; trains async in a worker thread.
- `POST /api/train/sync` → full result; useful for scripts.
- `GET  /api/runs/{run_id}?since_epoch=N` → snapshots + layout + status.
- `GET  /api/runs` → list of runs.
- `GET  /api/health`.

## Layout

```
backend/
  circuit.py    # variational ansatz + layout description for the UI
  trainer.py    # training loop + correlation snapshot computation
  main.py       # FastAPI app
frontend/
  src/App.jsx
  src/views/{LossChart,CircuitView,EntanglementGraph,ParameterHeatmap}.jsx
```

## Next steps (per plan)

- Measurement-attribution view (parameter-shift sensitivity per gate).
- State-projection view (PCA/UMAP of pre-measurement states).
- Qiskit backend.
- WebSocket streaming instead of polling.
