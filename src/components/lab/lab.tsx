"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowSquareOut, Brain, ChartLineUp, CircleNotch, Cpu, Graph, HandPointing, Lightning, PaperPlaneRight, Scribble, Smiley } from "@phosphor-icons/react/dist/ssr";
import { useGameOptional } from "@/components/game/game-provider";
import type { AiDemo } from "@/lib/site";
import { cn, easeOut } from "@/lib/utils";
import { DigitsDemo } from "./digits";
import { FuzzyTipDemo } from "./fuzzy-tip";
import { KMeansDemo } from "./kmeans";
import { RegressionDemo } from "./regression";
import { SentimentDemo } from "./sentiment";

const icons = { sentiment: Smiley, "fuzzy-tip": Graph, kmeans: Cpu, regression: ChartLineUp, digits: Scribble } as const;

function ApiDemo({ demo, onRun }: { demo: AiDemo; onRun: () => void }) {
  const [input, setInput] = useState(demo.placeholder);
  const [state, setState] = useState<{ loading: boolean; output?: unknown; error?: string }>({ loading: false });
  const run = async () => {
    let payload: unknown = input;
    if (demo.inputType === "number") payload = Number(input);
    if (demo.inputType === "json") {
      try {
        payload = JSON.parse(input);
      } catch {
        setState({ loading: false, error: "That isn't valid JSON." });
        return;
      }
    }
    setState({ loading: true });
    try {
      const res = await fetch(`/api/lab/${demo.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: payload }) });
      const body = (await res.json()) as { output?: unknown; error?: string };
      setState(res.ok ? { loading: false, output: body.output } : { loading: false, error: body.error ?? "Something went wrong." });
      if (res.ok) onRun();
    } catch {
      setState({ loading: false, error: "Couldn't reach the server." });
    }
  };
  const out = state.output;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void run();
      }}
      className="grid gap-4"
    >
      <label className="grid gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">{demo.inputLabel || "Input"}</span>
        {demo.inputType === "text" || demo.inputType === "json" ? (
          <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={demo.inputType === "json" ? 5 : 3} className={cn("w-full resize-y rounded-2xl border border-line-strong bg-bg/70 px-4 py-3 text-[15px] focus:border-accent focus:outline-none", demo.inputType === "json" && "font-mono text-[13px]")} />
        ) : (
          <input type="number" value={input} onChange={(e) => setInput(e.target.value)} className="h-12 rounded-2xl border border-line-strong bg-bg/70 px-4 focus:border-accent focus:outline-none" />
        )}
      </label>
      <div>
        <button type="submit" disabled={state.loading} className="press inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-ink disabled:opacity-70">
          {state.loading ? <CircleNotch size={16} className="animate-spin" /> : <PaperPlaneRight size={16} weight="fill" />}
          {state.loading ? "Running the model" : "Run"}
        </button>
      </div>
      {state.error ? <p className="rounded-2xl border border-ember/30 bg-ember/10 p-4 text-sm">{state.error}</p> : null}
      {out !== undefined ? (
        <div className="rounded-2xl border border-line bg-bg/60 p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Output</p>
          {typeof out === "string" || typeof out === "number" || typeof out === "boolean" ? (
            <p className="mt-2 text-2xl font-semibold tracking-tight text-accent">{String(out)}</p>
          ) : (
            <pre className="mt-2 max-h-72 overflow-auto font-mono text-[12.5px] leading-relaxed text-fg/85">{JSON.stringify(out, null, 2)}</pre>
          )}
        </div>
      ) : null}
    </form>
  );
}

function EmbedDemo({ demo, onRun }: { demo: AiDemo; onRun: () => void }) {
  const [load, setLoad] = useState(false);
  if (!demo.embedUrl) return <p className="text-sm text-muted">This demo isn&apos;t connected yet.</p>;
  return (
    <div className="grid gap-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-bg md:aspect-[16/10]">
        {load ? (
          <iframe src={demo.embedUrl} title={demo.title} className="size-full" loading="lazy" allow="clipboard-write; microphone; camera" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
        ) : (
          <button
            type="button"
            onClick={() => {
              setLoad(true);
              onRun();
            }}
            className="group absolute inset-0 grid place-items-center"
          >
            <span className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-accent-ink transition-transform duration-200 group-hover:scale-[1.03]">
              <Lightning size={16} weight="fill" /> Launch the live model
            </span>
          </button>
        )}
      </div>
      <a href={demo.embedUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        Open in a new tab <ArrowSquareOut size={14} />
      </a>
    </div>
  );
}

export function DemoRunner({ demo }: { demo: AiDemo }) {
  const game = useGameOptional();
  const ran = useRef(false);
  const onRun = useCallback(() => {
    game?.unlock("scientist");
    if (!ran.current) {
      ran.current = true;
      game?.activity("xp-demo");
    }
  }, [game]);
  if (demo.kind === "api") return <ApiDemo demo={demo} onRun={onRun} />;
  if (demo.kind === "embed") return <EmbedDemo demo={demo} onRun={onRun} />;
  switch (demo.builtin) {
    case "sentiment":
      return <SentimentDemo placeholder={demo.placeholder} onRun={onRun} />;
    case "fuzzy-tip":
      return <FuzzyTipDemo onRun={onRun} />;
    case "kmeans":
      return <KMeansDemo onRun={onRun} />;
    case "regression":
      return <RegressionDemo onRun={onRun} />;
    case "digits":
      return <DigitsDemo onRun={onRun} />;
  }
}

export function LabStage({ demos }: { demos: AiDemo[] }) {
  const [activeId, setActiveId] = useState(demos[0]?.id);
  const active = demos.find((d) => d.id === activeId) ?? demos[0];
  if (!active) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <ul className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:col-span-4 lg:mx-0 lg:grid lg:content-start lg:overflow-visible lg:px-0" role="tablist" aria-label="AI demos">
        {demos.map((d) => {
          const Icon = d.kind === "builtin" ? icons[d.builtin] : d.kind === "api" ? Brain : HandPointing;
          const on = d.id === active.id;
          return (
            <li key={d.id} className="shrink-0 lg:shrink">
              <button
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setActiveId(d.id)}
                className={cn(
                  "relative flex w-[240px] items-start gap-3 rounded-2xl border p-4 text-left transition-colors duration-200 lg:w-full",
                  on ? "border-accent/50 bg-accent/[0.07]" : "border-line bg-surface/50 hover:border-line-strong",
                )}
              >
                <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", on ? "bg-accent text-accent-ink" : "bg-surface-2 text-muted")}>
                  <Icon size={19} weight={on ? "fill" : "regular"} />
                </span>
                <span className="min-w-0">
                  <span className="block font-medium tracking-tight">{d.title}</span>
                  <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-muted">{d.description}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="rounded-[2rem] border border-line-strong bg-surface/70 p-2 backdrop-blur lg:col-span-8">
        <div className="rounded-[1.6rem] border border-line bg-bg/70 p-5 md:p-7">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">{active.kind === "builtin" ? "Runs in your browser" : active.kind === "api" ? "Live model" : "Hosted app"}</p>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight">{active.title}</h3>
            </div>
            <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              <span className="size-1.5 animate-pulse rounded-full bg-accent" /> ready
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={active.id} initial={{ opacity: 0, transform: "translateY(8px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.3, ease: easeOut }}>
              <DemoRunner demo={active} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
