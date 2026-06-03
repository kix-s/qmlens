import React, { useEffect, useRef, useState, useMemo } from 'react';

// Circular layout of qubit nodes. Edges encode one of three pairwise metrics
// (selectable via dropdown); node fill reflects <Z_i> (blue: -1, red: +1).
//
// Metrics:
//   - z_covariance:        Cov(Z_i, Z_j). Cheap; correlation only, NOT
//                          proof of entanglement (can come from classical
//                          correlation too).
//   - mutual_information:  I(i;j) = S(rho_i) + S(rho_j) - S(rho_ij), in bits.
//                          Captures total (quantum + classical) correlation.
//   - concurrence:         Wootters concurrence of the reduced 2-qubit state.
//                          A genuine entanglement measure: > 0 implies the
//                          pair is entangled.
const Z_TOOLTIP =
  '\u27E8Z_i\u27E9 = P(0) \u2212 P(1)\n+1 \u2192 mostly |0\u27E9\n\u22121 \u2192 mostly |1\u27E9\n0 \u2192 balanced measurements';

const METRICS = {
  z_covariance: {
    label: 'Z covariance',
    field: 'qubit_correlations',
    signed: true,
    description:
      'Edges show Z-basis correlation \u2014 may arise from entanglement or classical correlation.',
    edgeTitle: (v) => `Cov(Z) = ${v.toFixed(3)}`,
  },
  mutual_information: {
    label: 'Mutual information',
    field: 'qubit_mutual_information',
    signed: false,
    description:
      'Edges show I(i;j) in bits \u2014 total correlation (quantum + classical) between qubit pairs.',
    edgeTitle: (v) => `I = ${v.toFixed(3)} bits`,
  },
  concurrence: {
    label: 'Concurrence',
    field: 'qubit_concurrence',
    signed: false,
    description:
      'Edges show Wootters concurrence \u2014 a genuine two-qubit entanglement measure (0 \u2192 separable, 1 \u2192 maximally entangled).',
    edgeTitle: (v) => `C = ${v.toFixed(3)}`,
  },
};

export default function EntanglementGraph({ snapshot, nQubits }) {
  const wrapRef = useRef(null);
  const [size, setSize] = useState({ w: 400, h: 300 });
  const [metricKey, setMetricKey] = useState('z_covariance');

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      setSize({ w: Math.max(200, cr.width), h: Math.max(160, cr.height) });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const metric = METRICS[metricKey] ?? METRICS.z_covariance;
  // Fall back to z_covariance if the snapshot predates the newer metrics.
  const activeMetric =
    snapshot && snapshot[metric.field] != null ? metric : METRICS.z_covariance;
  const matrix = snapshot?.[activeMetric.field];

  const n = nQubits ?? matrix?.length ?? snapshot?.qubit_correlations?.length ?? 4;
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

  const measurements = snapshot?.measurements ?? {};

  const edges = [];
  if (matrix) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const v = matrix[i]?.[j] ?? 0;
        edges.push({ i, j, v, mag: Math.abs(v) });
      }
    }
  }
  const maxMag = edges.reduce((m, e) => Math.max(m, e.mag), 1e-6);

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          top: 4,
          right: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          color: '#8b94b8',
          zIndex: 1,
        }}
      >
        <label htmlFor="graph-metric">metric:</label>
        <select
          id="graph-metric"
          value={metricKey}
          onChange={(e) => setMetricKey(e.target.value)}
          style={{
            background: '#0b1020',
            color: '#dbe2ff',
            border: '1px solid #2a335a',
            borderRadius: 4,
            padding: '2px 4px',
            fontSize: 11,
          }}
        >
          {Object.entries(METRICS).map(([k, m]) => (
            <option key={k} value={k}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <svg width={W} height={H} style={{ display: 'block' }}>
        <defs>
          <marker
            id="qmlens-arrowhead"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="4.5"
            markerHeight="4.5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="#0b1020" />
          </marker>
        </defs>
        {edges.map((e, k) => {
          const a = positions[e.i];
          const b = positions[e.j];
          const t = e.mag / maxMag;
          const stroke = activeMetric.signed
            ? e.v >= 0
              ? '#7cc4ff'
              : '#ff7a7a'
            : '#b48cff';
          return (
            <line
              key={k}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={stroke}
              strokeOpacity={0.15 + 0.75 * t}
              strokeWidth={1 + 6 * t}
            >
              <title>{`q${e.i} \u2194 q${e.j}: ${activeMetric.edgeTitle(e.v)}`}</title>
            </line>
          );
        })}
        {positions.map((p, i) => {
          const z = measurements[`q${i}`] ?? 0;
          const fill = zToColor(z);
          // Bloch-vector z-projection: rotate a fixed-length arrow from
          // straight up (<Z>=+1, |0>) through horizontal (<Z>=0) to straight
          // down (<Z>=-1, |1>). Angle from +z axis = arccos(z).
          const R_NODE = 20;
          const ARROW_LEN = R_NODE - 4;
          const theta = Math.acos(Math.max(-1, Math.min(1, z))); // 0..pi
          // SVG y grows downward; +z (|0>) should point up => negate sin(0)=0,
          // positive z gives small theta, tip y = center - cos(theta)*len.
          const dx = ARROW_LEN * Math.sin(theta);
          const dy = ARROW_LEN * Math.cos(theta);
          const tipX = p.x + dx;
          const tipY = p.y - dy;
          // Tail extends through the center in the opposite direction so the
          // arrow spans (most of) the node diameter and is easy to read.
          const tailX = p.x - dx;
          const tailY = p.y + dy;
          return (
            <g key={i}>
              <title>{`q${i} \u2014 \u27E8Z_${i}\u27E9 = ${z.toFixed(3)}\n\n${Z_TOOLTIP}`}</title>
              <circle
                cx={p.x}
                cy={p.y}
                r={R_NODE}
                fill={fill}
                stroke="#0b1020"
                strokeWidth="2"
              />
              {/* equator reference line (the <Z>=0 axis) */}
              <line
                x1={p.x - R_NODE + 3}
                y1={p.y}
                x2={p.x + R_NODE - 3}
                y2={p.y}
                stroke="#0b1020"
                strokeOpacity="0.25"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              {/* Bloch arrow: body spans the node diameter, head on the +z side */}
              <line
                x1={tailX}
                y1={tailY}
                x2={tipX}
                y2={tipY}
                stroke="#0b1020"
                strokeWidth="3"
                strokeLinecap="round"
                markerEnd="url(#qmlens-arrowhead)"
              />
              <text
                x={p.x}
                y={p.y + R_NODE + 14}
                fontSize="11"
                textAnchor="middle"
                fill="#dbe2ff"
                fontWeight="600"
              >
                q{i}
              </text>
            </g>
          );
        })}
        {!snapshot && (
          <text x={W / 2} y={H / 2} fill="#8b94b8" textAnchor="middle">
            correlations appear after training starts
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
