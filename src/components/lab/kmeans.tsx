"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowClockwise, Play, Pause, SkipForward } from "@phosphor-icons/react/dist/ssr";

type P = { x: number; y: number; c: number };
const COLORS = ["#5fd6c0", "#f0773f", "#a9b8ff", "#f6c177", "#e58fb6", "#8fd16b"];

function blobs(n = 3): P[] {
  const out: P[] = [];
  for (let b = 0; b < n; b++) {
    const cx = 15 + Math.random() * 70;
    const cy = 15 + Math.random() * 70;
    for (let i = 0; i < 26; i++) {
      const r = Math.sqrt(-2 * Math.log(Math.random() + 1e-9)) * 6;
      const a = Math.random() * Math.PI * 2;
      out.push({ x: Math.min(98, Math.max(2, cx + Math.cos(a) * r)), y: Math.min(98, Math.max(2, cy + Math.sin(a) * r)), c: -1 });
    }
  }
  return out;
}

export function KMeansDemo({ onRun }: { onRun: () => void }) {
  const [points, setPoints] = useState<P[]>([]);
  const [k, setK] = useState(3);
  const [centroids, setCentroids] = useState<{ x: number; y: number }[]>([]);
  const [iter, setIter] = useState(0);
  const [running, setRunning] = useState(false);
  const [converged, setConverged] = useState(false);
  const svg = useRef<SVGSVGElement>(null);

  // seed the canvas once on mount; Math.random can't run during render
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPoints(blobs(3));
  }, []);

  const reset = useCallback(
    (pts?: P[]) => {
      const base = (pts ?? points).map((p) => ({ ...p, c: -1 }));
      const shuffled = [...base].sort(() => Math.random() - 0.5);
      setPoints(base);
      setCentroids(shuffled.slice(0, k).map((p) => ({ x: p.x, y: p.y })));
      setIter(0);
      setConverged(false);
    },
    [points, k],
  );

  const step = useCallback(() => {
    if (!centroids.length || !points.length) return;
    const assigned = points.map((p) => {
      let best = 0;
      let bd = Infinity;
      centroids.forEach((c, i) => {
        const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      return { ...p, c: best };
    });
    const next = centroids.map((c, i) => {
      const mine = assigned.filter((p) => p.c === i);
      if (!mine.length) return c;
      return { x: mine.reduce((s, p) => s + p.x, 0) / mine.length, y: mine.reduce((s, p) => s + p.y, 0) / mine.length };
    });
    const moved = next.reduce((s, c, i) => s + Math.hypot(c.x - centroids[i].x, c.y - centroids[i].y), 0);
    setPoints(assigned);
    setCentroids(next);
    setIter((n) => n + 1);
    if (moved < 0.05) {
      setConverged(true);
      setRunning(false);
    }
  }, [centroids, points]);

  useEffect(() => {
    if (!running) return;
    const t = window.setTimeout(step, 450);
    return () => clearTimeout(t);
  }, [running, step]);

  const inertia = points.reduce((s, p) => (p.c < 0 || !centroids[p.c] ? s : s + (p.x - centroids[p.c].x) ** 2 + (p.y - centroids[p.c].y) ** 2), 0);

  const add = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = svg.current!.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setPoints((ps) => [...ps, { x, y, c: -1 }]);
    setConverged(false);
  };

  return (
    <div className="grid gap-5 md:grid-cols-[1fr_220px]">
      <svg ref={svg} viewBox="0 0 100 100" onPointerDown={add} className="aspect-square w-full cursor-crosshair touch-none rounded-2xl border border-line bg-bg/60" role="img" aria-label="K-means clustering canvas. Click to add points.">
        {[20, 40, 60, 80].map((g) => (
          <g key={g} stroke="rgba(214,232,228,0.06)" strokeWidth={0.3}>
            <line x1={g} x2={g} y1={0} y2={100} />
            <line y1={g} y2={g} x1={0} x2={100} />
          </g>
        ))}
        {points.map((p, i) => {
          const c = centroids[p.c];
          return (
            <g key={i}>
              {c ? <line x1={p.x} y1={p.y} x2={c.x} y2={c.y} stroke={COLORS[p.c % COLORS.length]} strokeOpacity={0.12} strokeWidth={0.3} /> : null}
              <circle cx={p.x} cy={p.y} r={1.1} fill={p.c < 0 ? "#8b9794" : COLORS[p.c % COLORS.length]} />
            </g>
          );
        })}
        {centroids.map((c, i) => (
          <g key={i} style={{ transform: `translate(${c.x}px, ${c.y}px)`, transition: "transform 400ms cubic-bezier(0.16,1,0.3,1)" }}>
            <circle r={3.2} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth={0.8} />
            <path d="M-1.6 0H1.6M0 -1.6V1.6" stroke={COLORS[i % COLORS.length]} strokeWidth={0.8} />
          </g>
        ))}
      </svg>
      <div className="grid content-start gap-4">
        <label className="grid gap-2">
          <span className="flex justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            Clusters (k) <span className="text-fg">{k}</span>
          </span>
          <input type="range" min={2} max={6} value={k} onChange={(e) => setK(Number(e.target.value))} className="accent-[#5fd6c0]" />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              if (!centroids.length || converged) reset();
              setRunning((r) => !r);
              onRun();
            }}
            className="press col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-accent text-sm font-medium text-accent-ink"
          >
            {running ? <Pause size={16} weight="fill" /> : <Play size={16} weight="fill" />}
            {running ? "Pause" : "Run k-means"}
          </button>
          <button type="button" onClick={() => (centroids.length ? step() : reset())} className="press inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-line-strong text-sm">
            <SkipForward size={15} /> Step
          </button>
          <button
            type="button"
            onClick={() => {
              setRunning(false);
              const pts = blobs(2 + Math.floor(Math.random() * 3));
              setCentroids([]);
              setPoints(pts);
              setIter(0);
              setConverged(false);
            }}
            className="press inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-line-strong text-sm"
          >
            <ArrowClockwise size={15} /> New data
          </button>
        </div>
        <dl className="grid grid-cols-2 gap-2 font-mono text-xs">
          <div className="rounded-xl border border-line p-3">
            <dt className="text-muted">Iteration</dt>
            <dd className="mt-1 text-lg tabular-nums">{iter}</dd>
          </div>
          <div className="rounded-xl border border-line p-3">
            <dt className="text-muted">Inertia</dt>
            <dd className="mt-1 text-lg tabular-nums">{inertia ? inertia.toFixed(0) : "—"}</dd>
          </div>
        </dl>
        <p className="text-sm leading-relaxed text-muted">{converged ? "Converged: the centroids stopped moving." : "Click the canvas to add points, then run."}</p>
      </div>
    </div>
  );
}
