"use client";

import { useMemo, useRef, useState } from "react";

type Pt = { x: number; y: number };

/** Least-squares polynomial fit via the normal equations (Gaussian elimination). */
function fit(points: Pt[], degree: number) {
  const n = degree + 1;
  if (points.length < n) return null;
  const A = Array.from({ length: n }, () => new Array(n + 1).fill(0));
  for (const p of points) {
    const x = p.x / 100;
    const y = p.y / 100;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) A[i][j] += x ** (i + j);
      A[i][n] += y * x ** i;
    }
  }
  for (let c = 0; c < n; c++) {
    let pivot = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[pivot][c])) pivot = r;
    [A[c], A[pivot]] = [A[pivot], A[c]];
    if (Math.abs(A[c][c]) < 1e-12) return null;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = A[r][c] / A[c][c];
      for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k];
    }
  }
  const coef = A.map((row, i) => row[n] / row[i]);
  const predict = (x: number) => coef.reduce((s, c, i) => s + c * (x / 100) ** i, 0) * 100;
  const mean = points.reduce((s, p) => s + p.y, 0) / points.length;
  const ssTot = points.reduce((s, p) => s + (p.y - mean) ** 2, 0);
  const ssRes = points.reduce((s, p) => s + (p.y - predict(p.x)) ** 2, 0);
  return { coef, predict, r2: ssTot ? 1 - ssRes / ssTot : 1 };
}

const start: Pt[] = [
  { x: 10, y: 78 },
  { x: 22, y: 70 },
  { x: 35, y: 58 },
  { x: 48, y: 52 },
  { x: 60, y: 40 },
  { x: 72, y: 36 },
  { x: 86, y: 22 },
];

export function RegressionDemo({ onRun }: { onRun: () => void }) {
  const [points, setPoints] = useState<Pt[]>(start);
  const [degree, setDegree] = useState(1);
  const svg = useRef<SVGSVGElement>(null);
  const model = useMemo(() => fit(points, degree), [points, degree]);
  const curve = model
    ? Array.from({ length: 101 }, (_, i) => `${i ? "L" : "M"}${i},${Math.min(140, Math.max(-40, model.predict(i))).toFixed(2)}`).join(" ")
    : "";

  return (
    <div className="grid gap-5 md:grid-cols-[1fr_220px]">
      <svg
        ref={svg}
        viewBox="0 0 100 100"
        onPointerDown={(e) => {
          const r = svg.current!.getBoundingClientRect();
          setPoints((ps) => [...ps, { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }]);
          onRun();
        }}
        className="aspect-square w-full cursor-crosshair touch-none overflow-hidden rounded-2xl border border-line bg-bg/60"
        role="img"
        aria-label="Regression canvas. Click to add points."
      >
        {points.map((p, i) => (
          <line key={`r${i}`} x1={p.x} x2={p.x} y1={p.y} y2={model ? model.predict(p.x) : p.y} stroke="#f0773f" strokeOpacity={0.35} strokeWidth={0.4} />
        ))}
        {curve ? <path d={curve} fill="none" stroke="#5fd6c0" strokeWidth={0.9} /> : null}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={1.3} fill="#e8eeec" />
        ))}
      </svg>
      <div className="grid content-start gap-4">
        <label className="grid gap-2">
          <span className="flex justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            Polynomial degree <span className="text-fg">{degree}</span>
          </span>
          <input type="range" min={1} max={5} value={degree} onChange={(e) => setDegree(Number(e.target.value))} className="accent-[#5fd6c0]" />
        </label>
        <div className="rounded-xl border border-line p-3 font-mono text-xs">
          <p className="text-muted">R²</p>
          <p className="mt-1 text-2xl tabular-nums text-accent">{model ? model.r2.toFixed(3) : "—"}</p>
        </div>
        <p className="text-sm leading-relaxed text-muted">Click to add points. Push the degree up and watch it overfit: the curve chases every point while the error lines shrink.</p>
        <button type="button" onClick={() => setPoints([])} className="press h-10 rounded-full border border-line-strong text-sm">
          Clear points
        </button>
      </div>
    </div>
  );
}
