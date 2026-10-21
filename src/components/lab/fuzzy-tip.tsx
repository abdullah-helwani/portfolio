"use client";

import { useMemo, useState } from "react";

// Mamdani fuzzy inference: triangular membership functions, min for AND, max for OR and
// aggregation, centroid defuzzification. The classic tipping problem.

const tri = (x: number, a: number, b: number, c: number) => Math.max(0, Math.min((x - a) / (b - a || 1e-9), (c - x) / (c - b || 1e-9), 1));

const serviceSets = { poor: [-5, 0, 5], good: [0, 5, 10], excellent: [5, 10, 15] } as const;
const foodSets = { rancid: [-5, 0, 5], okay: [0, 5, 10], delicious: [5, 10, 15] } as const;
const tipSets = { cheap: [0, 5, 13], average: [8, 15, 22], generous: [17, 25, 30] } as const;

export function inferTip(service: number, food: number) {
  const s = Object.fromEntries(Object.entries(serviceSets).map(([k, v]) => [k, tri(service, v[0], v[1], v[2])])) as Record<keyof typeof serviceSets, number>;
  const f = Object.fromEntries(Object.entries(foodSets).map(([k, v]) => [k, tri(food, v[0], v[1], v[2])])) as Record<keyof typeof foodSets, number>;
  const rules = [
    { text: "service is poor OR food is rancid → tip is cheap", out: "cheap" as const, w: Math.max(s.poor, f.rancid) },
    { text: "service is good → tip is average", out: "average" as const, w: s.good },
    { text: "food is okay AND service is good → tip is average", out: "average" as const, w: Math.min(f.okay, s.good) },
    { text: "service is excellent OR food is delicious → tip is generous", out: "generous" as const, w: Math.max(s.excellent, f.delicious) },
  ];
  const strength = { cheap: 0, average: 0, generous: 0 };
  for (const r of rules) strength[r.out] = Math.max(strength[r.out], r.w);
  const curve: [number, number][] = [];
  let num = 0;
  let den = 0;
  for (let x = 0; x <= 30; x += 0.25) {
    const mu = Math.max(...(Object.keys(tipSets) as (keyof typeof tipSets)[]).map((k) => Math.min(strength[k], tri(x, tipSets[k][0], tipSets[k][1], tipSets[k][2]))));
    curve.push([x, mu]);
    num += x * mu;
    den += mu;
  }
  return { tip: den ? num / den : 0, rules, curve };
}

function Slider({ label, value, set, onRun }: { label: string; value: number; set: (v: number) => void; onRun: () => void }) {
  return (
    <label className="grid gap-2">
      <span className="flex justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
        {label} <span className="tabular-nums text-fg">{value.toFixed(1)} / 10</span>
      </span>
      <input type="range" min={0} max={10} step={0.1} value={value} onChange={(e) => set(Number(e.target.value))} onPointerUp={onRun} className="accent-[#5fd6c0]" />
    </label>
  );
}

export function FuzzyTipDemo({ onRun }: { onRun: () => void }) {
  const [service, setService] = useState(7);
  const [food, setFood] = useState(4);
  const r = useMemo(() => inferTip(service, food), [service, food]);
  const W = 300;
  const H = 110;
  const path = r.curve.map(([x, mu], i) => `${i ? "L" : "M"}${((x / 30) * W).toFixed(1)},${(H - mu * (H - 10)).toFixed(1)}`).join(" ");

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="grid content-start gap-5">
        <Slider label="Service quality" value={service} set={setService} onRun={onRun} />
        <Slider label="Food quality" value={food} set={setFood} onRun={onRun} />
        <ul className="grid gap-2">
          {r.rules.map((rule) => (
            <li key={rule.text} className="rounded-xl border border-line bg-bg/50 p-3 text-[13px]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-fg/80">{rule.text}</span>
                <span className="font-mono tabular-nums text-accent">{rule.w.toFixed(2)}</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full origin-left bg-accent transition-transform duration-200" style={{ transform: `scaleX(${rule.w})` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-line bg-bg/50 p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Defuzzified tip</p>
        <p className="mt-1 text-5xl font-semibold tabular-nums tracking-tight text-accent">{r.tip.toFixed(1)}%</p>
        <svg viewBox={`0 0 ${W} ${H + 18}`} className="mt-5 w-full" role="img" aria-label="Aggregated output membership">
          {(Object.keys(tipSets) as (keyof typeof tipSets)[]).map((k) => {
            const [a, b, c] = tipSets[k];
            return <polyline key={k} points={`${(a / 30) * W},${H} ${(b / 30) * W},10 ${(c / 30) * W},${H}`} fill="none" stroke="rgba(214,232,228,0.18)" strokeDasharray="3 3" />;
          })}
          <path d={`${path} L${W},${H} L0,${H} Z`} fill="rgba(95,214,192,0.22)" />
          <path d={path} fill="none" stroke="#5fd6c0" strokeWidth={1.5} />
          <line x1={(r.tip / 30) * W} x2={(r.tip / 30) * W} y1={4} y2={H} stroke="#f0773f" strokeWidth={1.5} />
          {[0, 10, 20, 30].map((t) => (
            <text key={t} x={(t / 30) * W} y={H + 14} fontSize={9} textAnchor={t === 0 ? "start" : t === 30 ? "end" : "middle"} fill="#8b9794" fontFamily="var(--font-geist-mono)">
              {t}%
            </text>
          ))}
        </svg>
        <p className="mt-3 text-sm leading-relaxed text-muted">The shaded area is every rule&apos;s conclusion combined. Its centre of mass, the orange line, becomes the answer.</p>
      </div>
    </div>
  );
}
