"use client";

import { useActionState, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeSlash } from "@phosphor-icons/react/dist/ssr";
import { saveSections } from "@/app/dashboard/actions";
import type { SectionConfig, SectionId } from "@/lib/site";
import { cn } from "@/lib/utils";
import { ActionStatus, Field, inputClass, SubmitButton } from "./ui";

const labels: Record<SectionId, string> = {
  about: "About statement",
  resume: "Résumé",
  skills: "Skills",
  work: "Projects",
  lab: "AI Lab",
  journey: "Journey timeline",
  playground: "Arcade",
  videos: "Videos",
  log: "Build log",
  focus: "Services",
  city: "City teaser & map",
  contact: "Contact",
};

export function SectionsEditor({ initial }: { initial: SectionConfig[] }) {
  const [state, action, pending] = useActionState(saveSections, null);
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState<SectionId | null>(null);
  const set = (id: SectionId, patch: Partial<SectionConfig>) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const move = (i: number, d: -1 | 1) =>
    setItems((xs) => {
      const j = i + d;
      if (j < 0 || j >= xs.length) return xs;
      const next = [...xs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="json" value={JSON.stringify(items)} />
      <ol className="grid gap-2">
        {items.map((s, i) => (
          <li key={s.id} className={cn("rounded-2xl border border-line bg-bg/40", !s.visible && "opacity-60")}>
            <div className="flex items-center gap-1 pl-4 pr-1.5">
              <span className="w-7 font-mono text-xs tabular-nums text-muted">{String(i + 1).padStart(2, "0")}</span>
              <button type="button" onClick={() => setOpen(open === s.id ? null : s.id)} aria-expanded={open === s.id} className="min-w-0 flex-1 py-3 text-left">
                <span className="block truncate text-sm font-medium">{labels[s.id]}</span>
                <span className="block truncate text-xs text-muted">{s.title.replaceAll("*", "")}</span>
              </button>
              <button type="button" aria-label={s.visible ? "Hide section" : "Show section"} title={s.visible ? "Hide section" : "Show section"} onClick={() => set(s.id, { visible: !s.visible })} className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg">
                {s.visible ? <Eye size={15} /> : <EyeSlash size={15} />}
              </button>
              <button type="button" aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0} className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-30">
                <ArrowUp size={14} />
              </button>
              <button type="button" aria-label="Move down" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-30">
                <ArrowDown size={14} />
              </button>
            </div>
            {open === s.id ? (
              <div className="grid gap-4 border-t border-line p-4 sm:grid-cols-2">
                <Field label="Label" htmlFor={`k-${s.id}`}>
                  <input id={`k-${s.id}`} value={s.kicker} maxLength={60} onChange={(e) => set(s.id, { kicker: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Heading" hint="Wrap words in *asterisks* to colour them." htmlFor={`t-${s.id}`}>
                  <input id={`t-${s.id}`} value={s.title} maxLength={160} onChange={(e) => set(s.id, { title: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Intro paragraph" className="sm:col-span-2" htmlFor={`i-${s.id}`}>
                  <textarea id={`i-${s.id}`} rows={2} value={s.intro} maxLength={600} onChange={(e) => set(s.id, { intro: e.target.value })} className={cn(inputClass, "resize-y")} />
                </Field>
              </div>
            ) : null}
          </li>
        ))}
      </ol>
      <div className="sticky bottom-3 z-10 mt-2 flex items-center gap-3 rounded-full border border-line bg-surface/90 py-2 pl-2 pr-4 backdrop-blur">
        <SubmitButton pending={pending}>Save sections</SubmitButton>
        <ActionStatus state={state} />
      </div>
    </form>
  );
}
