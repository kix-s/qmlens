import React, { useEffect, useRef, useState, useMemo } from 'react';

// Circular layout of qubit nodes with edges weighted by |Cov(Z_i, Z_j)|.
// Node fill reflects <Z_i> (blue: -1, red: +1).
export default function EntanglementGraph({ snapshot, nQubits }) {
  const wrapRef = useRef(null);
  const [size, setSize] = useState({ w: 400, h: 300 });

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      setSize({ w: Math.max(200, cr.width), h: Math.max(160, cr.height) });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const n = nQubits ?? snapshot?.qubit_correlations?.length ?? 4;
  const W = size.w;
  const H = size.h;
  const cx = W / 2;
  const cy = H / 2;
  const R = Math.min(W, H) * 0.36;

  const positions = useMemo(() => {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      out.push({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
    }
    return out;
  }, [n, cx, cy, R]);

  const corr = snapshot?.qubit_correlations;
  const measurements = snapshot?.measurements ?? {};

  const edges = [];
  if (corr) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const c = corr[i]?.[j] ?? 0;
        edges.push({ i, j, c, mag: Math.abs(c) });
      }
    }
  }
  const maxMag = edges.reduce((m, e) => Math.max(m, e.mag), 1e-6);

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%' }}>
      <svg width={W} height={H} style={{ display: 'block' }}>
        {edges.map((e, k) => {
          const a = positions[e.i];
          const b = positions[e.j];
          const t = e.mag / maxMag;
          const stroke = e.c >= 0 ? '#7cc4ff' : '#ff7a7a';
          return (
            <line
              key={k}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={stroke}
              strokeOpacity={0.15 + 0.75 * t}
              strokeWidth={1 + 6 * t}
            />
          );
        })}
        {positions.map((p, i) => {
          const z = measurements[`q${i}`] ?? 0;
          const fill = zToColor(z);
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="18" fill={fill} stroke="#0b1020" strokeWidth="2" />
              <text x={p.x} y={p.y + 4} fontSize="12" textAnchor="middle" fill="#0b1020" fontWeight="700">
                q{i}
              </text>
              <text x={p.x} y={p.y + 32} fontSize="10" textAnchor="middle" fill="#8b94b8">
                ⟨Z⟩={z.toFixed(2)}
              </text>
            </g>
          );
        })}
        {!snapshot && (
          <text x={W / 2} y={H / 2} fill="#8b94b8" textAnchor="middle">
            entanglement appears after training starts
          </text>
        )}
      </svg>
    </div>
  );
}

function zToColor(z) {
  // z in [-1, 1] -> red ↔ blue diverging
  const t = (z + 1) / 2; // 0..1
  const r = Math.round(124 + (255 - 124) * (1 - t));
  const g = Math.round(196 * (1 - Math.abs(2 * t - 1) * 0.6));
  const b = Math.round(255 * t);
  return `rgb(${r},${g},${b})`;
}
