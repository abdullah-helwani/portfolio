"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { easeOut } from "@/lib/utils";

type Point = { date: string; views: number };

const BAR = "#2f9e8b"; // validated for the dark surface (OKLCH L inside 0.48–0.67, ≥3:1)
const BAR_HOVER = "#5fd6c0";

function niceMax(n: number) {
  if (n <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(n));
  const steps = [1, 2, 2.5, 5, 10];
  for (const s of steps) if (s * pow >= n) return s * pow;
  return 10 * pow;
}

function label(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

export function ViewsChart({ data }: { data: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const W = 720;
  const H = 220;
  const pad = { l: 36, r: 8, t: 12, b: 28 };
  const max = niceMax(Math.max(...data.map((d) => d.views), 0));
  const ticks = [0, max / 2, max];
  const band = (W - pad.l - pad.r) / data.length;
  const barW = Math.min(18, band - 2);
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const total = data.reduce((s, d) => s + d.views, 0);
  const h = hover !== null ? data[hover] : null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-muted" aria-live="polite">
          {h ? (
            <>
              <span className="font-medium text-fg">{label(h.date)}</span> · {h.views.toLocaleString()} view{h.views === 1 ? "" : "s"}
            </>
          ) : (
            <>
              Daily page views, last {data.length} days · <span className="text-fg">{total.toLocaleString()}</span> total
            </>
          )}
        </p>
        <button type="button" onClick={() => setTable((t) => !t)} className="text-xs text-muted underline-offset-4 hover:text-fg hover:underline">
          {table ? "Show chart" : "Show table"}
        </button>
      </div>

      {table ? (
        <div className="max-h-[240px] overflow-y-auto rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface text-left text-xs text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 text-right font-medium">Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[...data].reverse().map((d) => (
                <tr key={d.date}>
                  <td className="px-4 py-2">{label(d.date)}</td>
                  <td className="px-4 py-2 text-right font-mono tabular-nums">{d.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Daily page views for the last ${data.length} days, ${total} in total`} onMouseLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth="1" />
              <text x={pad.l - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-[var(--muted)] font-mono text-[10px]">
                {t.toLocaleString()}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const x = pad.l + i * band + (band - barW) / 2;
            const top = y(d.views);
            const height = H - pad.b - top;
            const r = Math.min(4, height);
            return (
              <g key={d.date}>
                {height > 0 ? (
                  <motion.path
                    d={`M${x},${H - pad.b} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${H - pad.b} Z`}
                    fill={hover === i ? BAR_HOVER : BAR}
                    style={{ transformOrigin: `0px ${H - pad.b}px` }}
                    initial={{ transform: "scaleY(0)" }}
                    animate={{ transform: "scaleY(1)" }}
                    transition={{ duration: 0.7, ease: easeOut, delay: i * 0.015 }}
                  />
                ) : null}
                {/* hit target wider than the bar */}
                <rect
                  x={pad.l + i * band}
                  y={pad.t}
                  width={band}
                  height={H - pad.t - pad.b}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  tabIndex={0}
                  aria-label={`${label(d.date)}: ${d.views} views`}
                />
                {i % 7 === 0 && i < data.length - 4 ? (
                  <text x={pad.l + i * band + band / 2} y={H - 8} textAnchor="middle" className="fill-[var(--muted)] font-mono text-[10px]">
                    {label(d.date)}
                  </text>
                ) : null}
              </g>
            );
          })}
          <text x={pad.l + (data.length - 1) * band + band / 2} y={H - 8} textAnchor="end" className="fill-[var(--muted)] font-mono text-[10px]">
            Today
          </text>
          <line x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} stroke="var(--line-strong)" strokeWidth="1" />
        </svg>
      )}
    </div>
  );
}
