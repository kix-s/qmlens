import React, { useEffect, useRef, useState, useMemo } from 'react';

// Heatmap of trainable parameters. Rows = (layer, rotation_axis), cols = qubit.
export default function ParameterHeatmap({ snapshot }) {
  const wrapRef = useRef(null);
  const [size, setSize] = useState({ w: 400, h: 280 });

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      setSize({ w: Math.max(200, cr.width), h: Math.max(160, cr.height) });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const params = snapshot?.parameters; // shape [L][Q][2]

  const { rows, cols, maxAbs } = useMemo(() => {
    if (!params) return { rows: [], cols: 0, maxAbs: 1 };
    const L = params.length;
    const Q = params[0].length;
    const rows = [];
    let maxAbs = 1e-6;
    for (let l = 0; l < L; l++) {
      for (let r = 0; r < 2; r++) {
        const row = [];
        for (let q = 0; q < Q; q++) {
          const v = params[l][q][r];
          row.push(v);
          maxAbs = Math.max(maxAbs, Math.abs(v));
        }
        rows.push({ label: `L${l + 1}·${r === 0 ? 'RY' : 'RZ'}`, values: row });
      }
    }
    return { rows, cols: Q, maxAbs };
  }, [params]);

  if (!params) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#8b94b8' }}>
        parameters appear after training starts
      </div>
    );
  }

  const padding = { l: 50, r: 16, t: 18, b: 22 };
  const W = size.w;
  const H = size.h;
  const cellW = (W - padding.l - padding.r) / cols;
  const cellH = (H - padding.t - padding.b) / rows.length;

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%' }}>
      <svg width={W} height={H} style={{ display: 'block' }}>
        {/* column headers */}
        {Array.from({ length: cols }).map((_, q) => (
          <text
            key={q}
            x={padding.l + cellW * (q + 0.5)}
            y={padding.t - 4}
            fontSize="10"
            fill="#8b94b8"
            textAnchor="middle"
          >
            q{q}
          </text>
        ))}
        {rows.map((row, ri) => (
          <g key={ri}>
            <text
              x={padding.l - 6}
              y={padding.t + cellH * (ri + 0.5) + 3}
              fontSize="10"
              fill="#8b94b8"
              textAnchor="end"
            >
              {row.label}
            </text>
            {row.values.map((v, q) => {
              const t = v / maxAbs; // -1..1
              const fill = divergingColor(t);
              return (
                <g key={q}>
                  <rect
                    x={padding.l + cellW * q + 1}
                    y={padding.t + cellH * ri + 1}
                    width={cellW - 2}
                    height={cellH - 2}
                    fill={fill}
                    rx={2}
                  />
                  <text
                    x={padding.l + cellW * (q + 0.5)}
                    y={padding.t + cellH * (ri + 0.5) + 3}
                    fontSize="9"
                    fill="#0b1020"
                    textAnchor="middle"
                  >
                    {v.toFixed(2)}
                  </text>
                </g>
              );
            })}
          </g>
        ))}
        <text x={padding.l} y={H - 6} fontSize="10" fill="#8b94b8">
          color: blue = negative · red = positive · normalized to max |θ| = {maxAbs.toFixed(2)}
        </text>
      </svg>
    </div>
  );
}

function divergingColor(t) {
  // t in [-1, 1]
  const clamp = Math.max(-1, Math.min(1, t));
  if (clamp >= 0) {
    const a = clamp;
    const r = Math.round(255 * (0.4 + 0.6 * a));
    const g = Math.round(180 * (1 - a) + 60);
    const b = Math.round(180 * (1 - a) + 60);
    return `rgb(${r},${g},${b})`;
  } else {
    const a = -clamp;
    const r = Math.round(180 * (1 - a) + 60);
    const g = Math.round(180 * (1 - a) + 80);
    const b = Math.round(255 * (0.4 + 0.6 * a));
    return `rgb(${r},${g},${b})`;
  }
}
