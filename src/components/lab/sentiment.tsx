"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

// A small lexicon model (AFINN-style weights, -3…3) with negation, intensifiers and "but" handling.
const LEX: Record<string, number> = {
  good: 2, great: 3, excellent: 3, amazing: 3, awesome: 3, love: 3, loved: 3, like: 2, liked: 2, nice: 2, happy: 3, glad: 2,
  fast: 2, quick: 1, easy: 2, simple: 1, clean: 2, helpful: 2, useful: 2, smooth: 2, beautiful: 3, brilliant: 3, perfect: 3,
  fantastic: 3, wonderful: 3, enjoy: 2, enjoyed: 2, fun: 2, cool: 1, impressive: 3, reliable: 2, friendly: 2, clear: 1,
  best: 3, better: 2, recommend: 2, worth: 2, solid: 2, polished: 2, intuitive: 2, elegant: 2, accurate: 2, stable: 1,
  thanks: 2, thank: 2, win: 2, works: 1, working: 1, fixed: 1, improved: 2, delightful: 3, satisfied: 2, pleased: 2,
  bad: -2, terrible: -3, awful: -3, horrible: -3, hate: -3, hated: -3, dislike: -2, slow: -2, hard: -1, difficult: -2,
  broken: -3, bug: -2, bugs: -2, buggy: -2, crash: -3, crashes: -3, crashed: -3, error: -2, errors: -2, confusing: -2,
  ugly: -2, annoying: -2, poor: -2, worse: -2, worst: -3, useless: -3, waste: -2, expensive: -1, laggy: -2, lag: -2,
  sad: -2, angry: -3, disappointed: -2, disappointing: -2, fail: -2, failed: -2, fails: -2, problem: -2, problems: -2,
  issue: -1, issues: -1, wrong: -2, messy: -2, unclear: -1, frustrating: -3, painful: -2, boring: -2, meh: -1, unstable: -2,
};
const NEGATORS = new Set(["not", "no", "never", "none", "nobody", "nothing", "hardly", "barely", "isnt", "wasnt", "dont", "doesnt", "didnt", "cant", "cannot", "wont", "aint"]);
const BOOST: Record<string, number> = { very: 1.5, really: 1.4, so: 1.3, extremely: 1.8, super: 1.5, incredibly: 1.7, quite: 1.2, totally: 1.4, slightly: 0.6, somewhat: 0.7, kinda: 0.7 };

type Token = { raw: string; score: number };

export function analyse(text: string) {
  const parts = text.split(/(\s+)/);
  const tokens: Token[] = [];
  let negate = 0;
  let boost = 1;
  let afterBut = false;
  let pos = 0;
  let neg = 0;
  for (const raw of parts) {
    const w = raw.toLowerCase().replace(/[’']/g, "").replace(/[^a-z]/g, "");
    let score = 0;
    if (!w) {
      tokens.push({ raw, score: 0 });
      continue;
    }
    if (w === "but" || w === "however" || w === "although") {
      afterBut = true;
      pos *= 0.5;
      neg *= 0.5;
    } else if (NEGATORS.has(w) || w.endsWith("nt")) {
      negate = 3;
    } else if (BOOST[w]) {
      boost = BOOST[w];
    } else if (LEX[w] !== undefined) {
      score = LEX[w] * boost * (negate > 0 ? -0.75 : 1) * (afterBut ? 1.5 : 1);
      if (score > 0) pos += score;
      else neg -= score;
      boost = 1;
    }
    if (/[.!?;]$/.test(raw)) negate = 0;
    else if (negate > 0 && !NEGATORS.has(w)) negate--;
    if (/!$/.test(raw)) {
      pos *= 1.1;
      neg *= 1.1;
    }
    tokens.push({ raw, score });
  }
  const total = pos - neg;
  const norm = total / Math.sqrt(total * total + 15); // squash to (-1, 1)
  const label = norm > 0.25 ? "Positive" : norm < -0.25 ? "Negative" : pos > 1 && neg > 1 ? "Mixed" : "Neutral";
  const confidence = Math.min(0.99, 0.5 + Math.abs(norm) / 2);
  return { tokens, score: norm, label, confidence, pos, neg };
}

export function SentimentDemo({ placeholder, onRun }: { placeholder: string; onRun: () => void }) {
  const [text, setText] = useState(placeholder);
  const result = useMemo(() => analyse(text), [text]);
  const tone = result.label === "Positive" ? "text-accent" : result.label === "Negative" ? "text-ember" : result.label === "Mixed" ? "text-[#f6c177]" : "text-fg";

  return (
    <div className="grid gap-5">
      <label className="grid gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Input</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={onRun}
          rows={3}
          maxLength={600}
          className="w-full resize-y rounded-2xl border border-line-strong bg-bg/70 px-4 py-3 text-[15px] leading-relaxed focus:border-accent focus:outline-none"
        />
      </label>
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">What the model sees</span>
          <p className="mt-2 rounded-2xl border border-line bg-bg/50 p-4 leading-[2] text-fg/80">
            {result.tokens.map((t, i) => (
              <span
                key={i}
                className={cn(t.score > 0 && "rounded bg-accent/20 px-0.5 text-accent", t.score < 0 && "rounded bg-ember/20 px-0.5 text-ember")}
                title={t.score ? `${t.score > 0 ? "+" : ""}${t.score.toFixed(1)}` : undefined}
              >
                {t.raw}
              </span>
            ))}
          </p>
        </div>
        <div className="min-w-[200px] rounded-2xl border border-line bg-bg/50 p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Prediction</p>
          <p className={cn("mt-1 text-3xl font-semibold tracking-tight", tone)}>{result.label}</p>
          <div className="relative mt-3 h-2 rounded-full bg-[linear-gradient(90deg,#f0773f,#3a4246_50%,#5fd6c0)]">
            <span className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg bg-fg transition-[left] duration-300" style={{ left: `${(result.score + 1) * 50}%` }} />
          </div>
          <p className="mt-2 font-mono text-xs tabular-nums text-muted">
            score {result.score.toFixed(2)} · confidence {(result.confidence * 100).toFixed(0)}%
          </p>
        </div>
      </div>
    </div>
  );
}
