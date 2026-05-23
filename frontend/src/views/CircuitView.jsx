import React, { useMemo, useRef, useEffect, useState } from 'react';

const COLORS = {
  encoding: '#5fd28a',
  trainable: '#7cc4ff',
  entangler: '#b07cff',
  measure: '#ffd166',
};

// Renders the static circuit layout, coloring trainable rotations
// by current gradient magnitude.
export default function CircuitView({ run, snapshot }) {
  const wrapRef = useRef(null);
  const [size, setSize] = useState({ w: 500, h: 280 });

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      setSize({ w: Math.max(300, cr.width), h: Math.max(160, cr.height) });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const layout = run?.layout ?? [];
  const nQubits = run?.n_qubits ?? 4;

  const gradMax = useMemo(() => {
    if (!snapshot?.gradients) return 1;
    let m = 0;
    const g = snapshot.gradients;
    for (const layer of g) for (const q of layer) for (const v of q) m = Math.max(m, Math.abs(v));
    return Math.max(m, 1e-6);
  }, [snapshot]);

  if (!layout.length) {
    return <Placeholder text="circuit appears after training starts" />;
  }

  const padding = { l: 36, r: 16, t: 16, b: 16 };
  const W = size.w;
  const H = size.h;
  const colW = (W - padding.l - padding.r) / Math.max(layout.length, 1);
  const rowH = (H - padding.t - padding.b) / Math.max(nQubits, 1);
  const yQ = (q) => padding.t + rowH * (q + 0.5);
  const xL = (l) => padding.l + colW * (l + 0.5);

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%' }}>
      <svg width={W} height={H} style={{ display: 'block' }}>
        {/* qubit wires */}
        {Array.from({ length: nQubits }).map((_, q) => (
          <g key={q}>
            <text x={6} y={yQ(q) + 4} fill="#8b94b8" fontSize="11">q{q}</text>
            <line
              x1={padding.l - 4}
              x2={W - padding.r}
              y1={yQ(q)}
              y2={yQ(q)}
              stroke="#2a3460"
            />
          </g>
        ))}

        {/* gates per layer column */}
        {layout.map((layer, li) => (
          <g key={li}>
            {layer.gates.map((g, gi) => renderGate(g, li, gi, xL, yQ, snapshot, gradMax))}
          </g>
        ))}
      </svg>
    </div>
  );
}

function renderGate(g, li, gi, xL, yQ, snapshot, gradMax) {
  const x = xL(li);
  const color = COLORS[g.kind] || '#7cc4ff';

  if (g.gate === 'CNOT' && g.wires.length === 2) {
    const [ctrl, tgt] = g.wires;
    return (
      <g key={`${li}-${gi}`} opacity="0.95">
        <line x1={x} x2={x} y1={yQ(ctrl)} y2={yQ(tgt)} stroke={color} strokeWidth="1.5" />
        <circle cx={x} cy={yQ(ctrl)} r="3" fill={color} />
        <circle cx={x} cy={yQ(tgt)} r="7" fill="none" stroke={color} strokeWidth="1.5" />
        <line x1={x - 7} x2={x + 7} y1={yQ(tgt)} y2={yQ(tgt)} stroke={color} strokeWidth="1.2" />
      </g>
    );
  }

  const wire = g.wires[0];
  const y = yQ(wire);
  let intensity = 0;
  let paramVal = null;
  if (g.kind === 'trainable' && snapshot?.parameters && g.param_index) {
    const [L, Q, R] = g.param_index;
    paramVal = snapshot.parameters?.[L]?.[Q]?.[R];
    const grad = snapshot.gradients?.[L]?.[Q]?.[R] ?? 0;
    intensity = Math.min(1, Math.abs(grad) / gradMax);
  }

  const fill = g.kind === 'trainable' ? lerpColor('#1a2240', color, 0.3 + 0.7 * intensity) : color;
  const stroke = g.kind === 'trainable' && intensity > 0.5 ? '#ffffff' : 'none';

  return (
    <g key={`${li}-${gi}`}>
      <rect x={x - 14} y={y - 11} width="28" height="22" rx="4" fill={fill} stroke={stroke} strokeWidth="1" />
      <text x={x} y={y + 4} fill="#0b1020" fontSize="10" textAnchor="middle" fontWeight="600">
        {g.gate}
      </text>
      {paramVal !== null && (
        <text x={x} y={y + 20} fill="#8b94b8" fontSize="9" textAnchor="middle">
          {paramVal.toFixed(2)}
        </text>
      )}
    </g>
  );
}

function lerpColor(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 255, ag = (pa >> 8) & 255, ab = pa & 255;
  const br = (pb >> 16) & 255, bg = (pb >> 8) & 255, bb = pb & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0')}`;
}

function Placeholder({ text }) {
  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#8b94b8' }}>
      {text}
    </div>
  );
}
