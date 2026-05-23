import React, { useEffect, useMemo, useRef, useState } from 'react';
import LossChart from './views/LossChart.jsx';
import CircuitView from './views/CircuitView.jsx';
import EntanglementGraph from './views/EntanglementGraph.jsx';
import ParameterHeatmap from './views/ParameterHeatmap.jsx';

const DEFAULTS = {
  scenario: 'two_moons',
  n_qubits: 4,
  n_layers: 3,
  epochs: 30,
  lr: 0.1,
  n_samples: 120,
  noise: 0.15,
  seed: 42,
};

export default function App() {
  const [cfg, setCfg] = useState(DEFAULTS);
  const [scenarios, setScenarios] = useState([]);
  const [runId, setRunId] = useState(null);
  const [run, setRun] = useState(null); // {status, snapshots, layout, n_qubits, n_layers}
  const [epochIdx, setEpochIdx] = useState(0);
  const [followLatest, setFollowLatest] = useState(true);
  const pollRef = useRef(null);

  const status = run?.status ?? 'idle';
  const snapshots = run?.snapshots ?? [];
  const current = snapshots[epochIdx] ?? null;

  // Load scenario catalog once on mount.
  useEffect(() => {
    fetch('/api/scenarios')
      .then((r) => r.json())
      .then((data) => {
        const list = data?.scenarios ?? [];
        setScenarios(list);
        // Apply defaults from the initially-selected scenario, so the
        // form reflects what the backend recommends.
        const sel = list.find((s) => s.id === DEFAULTS.scenario) ?? list[0];
        if (sel) {
          setCfg((prev) => ({ ...prev, scenario: sel.id, ...sel.defaults }));
        }
      })
      .catch(() => {});
  }, []);

  const onScenarioChange = (id) => {
    const sc = scenarios.find((s) => s.id === id);
    if (!sc) {
      setCfg((prev) => ({ ...prev, scenario: id }));
      return;
    }
    setCfg((prev) => ({ ...prev, scenario: id, ...sc.defaults }));
  };

  // Poll active run.
  useEffect(() => {
    if (!runId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const r = await fetch(`/api/runs/${runId}`).then((r) => r.json());
        if (cancelled) return;
        setRun(r);
        if (followLatest && r.snapshots?.length) {
          setEpochIdx(r.snapshots.length - 1);
        }
        if (r.status === 'running') {
          pollRef.current = setTimeout(tick, 600);
        }
      } catch (e) {
        if (!cancelled) pollRef.current = setTimeout(tick, 1500);
      }
    };
    tick();
    return () => {
      cancelled = true;
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [runId, followLatest]);

  const startTraining = async () => {
    setRun(null);
    setEpochIdx(0);
    setFollowLatest(true);
    const resp = await fetch('/api/train', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg),
    }).then((r) => r.json());
    setRunId(resp.run_id);
  };

  const numField = (key, label, step = 1) => (
    <label>
      {label}
      <input
        type="number"
        step={step}
        value={cfg[key]}
        onChange={(e) =>
          setCfg({ ...cfg, [key]: step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value, 10) })
        }
      />
    </label>
  );

  const latestEpoch = snapshots.length ? snapshots[snapshots.length - 1].epoch : 0;

  return (
    <div className="app">
      <header className="topbar">
        <h1>
          <span>QMLens</span> · Quantum ML Visualizer
        </h1>
        <div className="controls">
          <label className="scenario-select">
            scenario
            <select
              value={cfg.scenario}
              onChange={(e) => onScenarioChange(e.target.value)}
              disabled={status === 'running' || scenarios.length === 0}
              title={
                scenarios.find((s) => s.id === cfg.scenario)?.description ?? ''
              }
            >
              {scenarios.length === 0 && (
                <option value={cfg.scenario}>{cfg.scenario}</option>
              )}
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          {numField('n_qubits', 'qubits')}
          {numField('n_layers', 'layers')}
          {numField('epochs', 'epochs')}
          {numField('lr', 'lr', 0.01)}
          {numField('n_samples', 'samples')}
          {numField('noise', 'noise', 0.01)}
          <button className="primary" disabled={status === 'running'} onClick={startTraining}>
            {status === 'running' ? 'Training…' : 'Train'}
          </button>
          <span className={`status-pill ${status}`}>{status}</span>
          {run && (
            <span className="kpi">
              <span>
                epoch <b>{current?.epoch ?? 0}</b>/{cfg.epochs}
              </span>
              <span>
                loss <b>{current?.loss?.toFixed(4) ?? '—'}</b>
              </span>
              <span>
                train acc <b>{current ? (current.train_accuracy * 100).toFixed(1) + '%' : '—'}</b>
              </span>
              <span>
                test acc <b>{current ? (current.test_accuracy * 100).toFixed(1) + '%' : '—'}</b>
              </span>
              {current?.output_scale !== undefined && (
                <span>
                  scale <b>{current.output_scale.toFixed(2)}</b>
                </span>
              )}
            </span>
          )}
        </div>
      </header>

      <main className="grid">
        <Panel
          title="Circuit View"
          subtitle="encoding · trainable · entangler · measure"
          legend={
            <div className="legend">
              <span><span className="swatch" style={{ background: '#5fd28a' }} />enc</span>
              <span><span className="swatch" style={{ background: '#7cc4ff' }} />RY/RZ</span>
              <span><span className="swatch" style={{ background: '#b07cff' }} />CNOT</span>
              <span><span className="swatch" style={{ background: '#ffd166' }} />M</span>
            </div>
          }
        >
          <CircuitView run={run} snapshot={current} />
        </Panel>

        <Panel title="Training Timeline" subtitle="loss · gradient norm · accuracy">
          <LossChart snapshots={snapshots} epochIdx={epochIdx} />
        </Panel>

        <Panel title="Entanglement Graph" subtitle="nodes = qubits · edge width = |Cov(Z_i, Z_j)|">
          <EntanglementGraph snapshot={current} nQubits={run?.n_qubits ?? cfg.n_qubits} />
        </Panel>

        <Panel title="Parameter Heatmap" subtitle="rows = layer · cols = qubit (RY,RZ)">
          <ParameterHeatmap snapshot={current} />
        </Panel>
      </main>

      {snapshots.length > 0 && (
        <div style={{ padding: '0 14px 12px' }}>
          <div className="timeline">
            <span>epoch</span>
            <input
              type="range"
              min={0}
              max={snapshots.length - 1}
              value={epochIdx}
              onChange={(e) => {
                setFollowLatest(false);
                setEpochIdx(parseInt(e.target.value, 10));
              }}
            />
            <span>
              {current?.epoch ?? 0} / {latestEpoch}
            </span>
            <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={followLatest}
                onChange={(e) => setFollowLatest(e.target.checked)}
              />
              follow latest
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

function Panel({ title, subtitle, legend, children }) {
  return (
    <section className="panel">
      <h2>
        <span>{title}{subtitle && <span style={{ color: '#5b6691', marginLeft: 8, textTransform: 'none', letterSpacing: 0 }}>· {subtitle}</span>}</span>
        {legend}
      </h2>
      <div className="body">{children}</div>
    </section>
  );
}
