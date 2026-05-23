import React, { useMemo, useRef, useEffect, useState } from 'react';

// Simple responsive line chart for loss + accuracy + grad-norm.
export default function LossChart({ snapshots, epochIdx }) {
  const wrapRef = useRef(null);
  const [size, setSize] = useState({ w: 400, h: 200 });

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      setSize({ w: Math.max(200, cr.width), h: Math.max(120, cr.height) });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const padding = { l: 38, r: 12, t: 10, b: 24 };
  const W = size.w;
  const H = size.h;
  const iw = W - padding.l - padding.r;
  const ih = H - padding.t - padding.b;

  const data = snapshots || [];

  const { lossPath, trainPath, testPath, gradPath, xs, lossMax, gradMax } = useMemo(() => {
    if (!data.length) return { lossPath: '', trainPath: '', testPath: '', gradPath: '', xs: [], lossMax: 1, gradMax: 1 };
    const epochs = data.map((d) => d.epoch);
    const losses = data.map((d) => d.loss);
    const trainA = data.map((d) => d.train_accuracy);
    const testA = data.map((d) => d.test_accuracy);
    const grads = data.map((d) => d.grad_norm);
    const xMin = epochs[0];
    const xMax = epochs[epochs.length - 1] || 1;
    const lossMax = Math.max(...losses, 1e-3);
    const gradMax = Math.max(...grads, 1e-3);
    const sx = (x) => padding.l + ((x - xMin) / Math.max(xMax - xMin, 1)) * iw;
    const syLoss = (y) => padding.t + (1 - y / lossMax) * ih;
    const syAcc = (y) => padding.t + (1 - y) * ih; // 0..1
    const syGrad = (y) => padding.t + (1 - y / gradMax) * ih;
    const mk = (vals, sy) =>
      vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(epochs[i]).toFixed(1)},${sy(v).toFixed(1)}`).join(' ');
    return {
      lossPath: mk(losses, syLoss),
      trainPath: mk(trainA, syAcc),
      testPath: mk(testA, syAcc),
      gradPath: mk(grads, syGrad),
      xs: epochs,
      lossMax,
      gradMax,
    };
  }, [data, W, H]);

  const currentEpoch = data[epochIdx]?.epoch;
  const sx = (x) => {
    const xMin = xs[0] ?? 0;
    const xMax = xs[xs.length - 1] || 1;
    return padding.l + ((x - xMin) / Math.max(xMax - xMin, 1)) * iw;
  };

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%' }}>
      <svg width={W} height={H} style={{ display: 'block' }}>
        {/* axes */}
        <line x1={padding.l} y1={H - padding.b} x2={W - padding.r} y2={H - padding.b} stroke="#2a3460" />
        <line x1={padding.l} y1={padding.t} x2={padding.l} y2={H - padding.b} stroke="#2a3460" />

        {/* gridlines */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={padding.l} x2={W - padding.r}
                y1={padding.t + (1 - f) * ih} y2={padding.t + (1 - f) * ih}
                stroke="#1a2348" />
        ))}

        {data.length > 0 && (
          <>
            <path d={lossPath} stroke="#ff7a7a" strokeWidth="2" fill="none" />
            <path d={gradPath} stroke="#ffd166" strokeWidth="1.4" fill="none" opacity="0.8" />
            <path d={trainPath} stroke="#7cc4ff" strokeWidth="1.6" fill="none" />
            <path d={testPath} stroke="#5fd28a" strokeWidth="1.6" fill="none" />

            {currentEpoch !== undefined && (
              <line
                x1={sx(currentEpoch)} x2={sx(currentEpoch)}
                y1={padding.t} y2={H - padding.b}
                stroke="#e6e9f5" strokeDasharray="3 3" opacity="0.6"
              />
            )}
          </>
        )}

        {/* labels */}
        <text x={padding.l} y={padding.t - 2} fill="#8b94b8" fontSize="10">loss / acc / |∇|</text>
        <text x={W - padding.r} y={H - 6} fill="#8b94b8" fontSize="10" textAnchor="end">epoch</text>

        {/* legend */}
        <g transform={`translate(${padding.l + 6}, ${padding.t + 6})`} fontSize="11">
          <g><rect width="10" height="10" fill="#ff7a7a" /><text x="14" y="9" fill="#e6e9f5">loss</text></g>
          <g transform="translate(60,0)"><rect width="10" height="10" fill="#7cc4ff" /><text x="14" y="9" fill="#e6e9f5">train acc</text></g>
          <g transform="translate(150,0)"><rect width="10" height="10" fill="#5fd28a" /><text x="14" y="9" fill="#e6e9f5">test acc</text></g>
          <g transform="translate(240,0)"><rect width="10" height="10" fill="#ffd166" /><text x="14" y="9" fill="#e6e9f5">|∇|</text></g>
        </g>

        {data.length === 0 && (
          <text x={W / 2} y={H / 2} fill="#8b94b8" textAnchor="middle">no data — click Train</text>
        )}
      </svg>
    </div>
  );
}
