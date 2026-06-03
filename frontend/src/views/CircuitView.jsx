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
  // 'compact' draws all entangling CNOTs of a layer in one column
  // (visually dense, common in QML papers). 'full' gives each CNOT its
  // own sub-slot so the sequencing is explicit, matching the standard
  // circuit-diagram convention of one 2-qubit gate per column.
  const [viewMode, setViewMode] = useState('compact');

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

  // For each layer, decide which sub-slot every gate occupies and how
  // many slots wide the layer needs to be. Two cases:
  //   - Trainable rotation columns: multiple gates on the SAME wire
  //     (Ry then Rz) -> stack horizontally by per-wire index.
  //   - Entangler columns: in 'full' mode, give every CNOT its own slot
  //     so they sequence left-to-right instead of stacking.
  const slotInfo = useMemo(() => {
    return layout.map((layer) => {
      const isEntangler =
        layer.gates.length > 1 &&
        layer.gates.every((g) => g.kind === 'entangler');
      if (viewMode === 'full' && isEntangler) {
        const slots = layer.gates.map((_, i) => i);
        return { slots, maxSlots: layer.gates.length };
      }
      const perWire = new Map();
      const slots = layer.gates.map((g) => {
        const key = g.wires.join(',');
        const idx = perWire.get(key) ?? 0;
        perWire.set(key, idx + 1);
        return idx;
      });
      const maxSlots = Array.from(perWire.values()).reduce(
        (m, c) => Math.max(m, c),
        1,
      );
      return { slots, maxSlots };
    });
  }, [layout, viewMode]);

  if (!layout.length) {
    return <Placeholder text="circuit appears after training starts" />;
  }

  const SLOT_W_MIN = 32; // minimum stride between sub-slots (= box width)
  const padding = { l: 36, r: 16, t: 16, b: 16 };
  const W = size.w;
  const H = size.h;
  // Adaptive slot width: expand to fill the panel when the circuit is
  // narrower than W, otherwise fall back to the minimum and let the
  // container scroll. This keeps gate boxes from overlapping while still
  // using the full width when possible.
  const totalSlotUnits = slotInfo.reduce((s, c) => s + c.maxSlots, 0);
  const availInner = Math.max(W - padding.l - padding.r, 1);
  const SLOT_W = Math.max(SLOT_W_MIN, availInner / Math.max(totalSlotUnits, 1));
  const innerW = totalSlotUnits * SLOT_W;
  const svgW = padding.l + innerW + padding.r;
  const colCenters = [];
  {
    let cursor = padding.l;
    for (const c of slotInfo) {
      const w = c.maxSlots * SLOT_W;
      colCenters.push(cursor + w / 2);
      cursor += w;
    }
  }
  const rowH = (H - padding.t - padding.b) / Math.max(nQubits, 1);
  const yQ = (q) => padding.t + rowH * (q + 0.5);
  const xL = (l) => colCenters[l] ?? padding.l;

  return (
    <div
      ref={wrapRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflowX: 'auto',
        overflowY: 'hidden',
      }}
    >
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
        <label htmlFor="circuit-view-mode">view:</label>
        <select
          id="circuit-view-mode"
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
          style={{
            background: '#0b1020',
            color: '#dbe2ff',
            border: '1px solid #2a335a',
            borderRadius: 4,
            padding: '2px 4px',
            fontSize: 11,
          }}
        >
          <option value="compact">Compact</option>
          <option value="full">Full</option>
        </select>
      </div>
      <svg
        width={svgW}
        height={H}
        style={{ display: 'block' }}
      >
        {/* qubit wires */}
        {Array.from({ length: nQubits }).map((_, q) => (
          <g key={q}>
            <text x={6} y={yQ(q) + 4} fill="#8b94b8" fontSize="11">q{q}</text>
            <line
              x1={padding.l - 4}
              x2={svgW - padding.r}
              y1={yQ(q)}
              y2={yQ(q)}
              stroke="#2a3460"
            />
          </g>
        ))}

        {/* gates per layer column */}
        {layout.map((layer, li) => (
          <g key={li}>
            {layer.gates.map((g, gi) => {
              const slot = slotInfo[li].slots[gi];
              const maxSlots = slotInfo[li].maxSlots;
              const subOffset = (slot - (maxSlots - 1) / 2) * SLOT_W;
              return renderGate(g, li, gi, xL, yQ, snapshot, gradMax, subOffset);
            })}
          </g>
        ))}
      </svg>
    </div>
  );
}

function renderGate(g, li, gi, xL, yQ, snapshot, gradMax, subOffset = 0) {
  const x = xL(li) + subOffset;
  const color = COLORS[g.kind] || '#7cc4ff';

  if (g.gate === 'CNOT' && g.wires.length === 2) {
    const [ctrl, tgt] = g.wires;
    const yCtrl = yQ(ctrl);
    const yTgt = yQ(tgt);
    const R = 8;
    return (
      <g key={`${li}-${gi}`} opacity="0.95">
        {/* Connector runs all the way from control to target center; the
            target circle is drawn with an opaque fill so the line still
            looks continuous (and we then re-draw the + strokes on top). */}
        <line x1={x} x2={x} y1={yCtrl} y2={yTgt} stroke={color} strokeWidth="1.5" />
        <circle cx={x} cy={yCtrl} r="3" fill={color} />
        <circle cx={x} cy={yTgt} r={R} fill="#0b1020" stroke={color} strokeWidth="1.5" />
        {/* + inside the target circle: both horizontal and vertical strokes */}
        <line x1={x - R} x2={x + R} y1={yTgt} y2={yTgt} stroke={color} strokeWidth="1.5" />
        <line x1={x} x2={x} y1={yTgt - R} y2={yTgt + R} stroke={color} strokeWidth="1.5" />
      </g>
    );
  }

  if (g.kind === 'measure' || g.gate === 'M') {
    // Standard quantum-circuit measurement glyph: a box with a gauge
    // (semicircular arc + needle) inside it, à la Qiskit.
    const y = yQ(g.wires[0]);
    const boxW = 28;
    const boxH = 22;
    const left = x - boxW / 2;
    const top = y - boxH / 2;
    const arcR = 7;
    const arcCx = x;
    const arcCy = y + 3; // arc sits near the bottom of the box
    // Semicircle (top half) from left to right of the dial.
    const arcPath = `M ${arcCx - arcR} ${arcCy} A ${arcR} ${arcR} 0 0 1 ${arcCx + arcR} ${arcCy}`;
    // Needle pointing up-right (canonical orientation in Qiskit).
    const needleAngle = -Math.PI / 4;
    const needleLen = arcR + 1;
    const needleX = arcCx + needleLen * Math.cos(needleAngle);
    const needleY = arcCy + needleLen * Math.sin(needleAngle);
    return (
      <g key={`${li}-${gi}`}>
        <rect
          x={left}
          y={top}
          width={boxW}
          height={boxH}
          rx="4"
          fill={color}
          stroke="none"
        />
        <path d={arcPath} stroke="#0b1020" strokeWidth="1.4" fill="none" />
        <line
          x1={arcCx}
          y1={arcCy}
          x2={needleX}
          y2={needleY}
          stroke="#0b1020"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
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
        {formatGateName(g.gate)}
      </text>
      {paramVal !== null && (
        <text x={x} y={y + 20} fill="#8b94b8" fontSize="9" textAnchor="middle">
          {paramVal.toFixed(2)}
        </text>
      )}
    </g>
  );
}

// Display Rx/Ry/Rz instead of RX/RY/RZ — matches the standard physics
// convention. Other gate names (CNOT, M, ...) are left untouched.
function formatGateName(name) {
  if (/^R[XYZ]$/.test(name)) {
    return 'R' + name[1].toLowerCase();
  }
  return name;
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
