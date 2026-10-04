"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "@phosphor-icons/react/dist/ssr";
import { saveContent } from "@/app/dashboard/actions";
import type { FocusItem, Milestone } from "@/lib/site";
import { ActionStatus, Card, Field, PageHeader, SubmitButton, inputClass } from "./ui";

export function ContentEditor({ journey: j0, focus: f0, stack: s0 }: { journey: Milestone[]; focus: FocusItem[]; stack: string[] }) {
  const [journey, setJourney] = useState(j0);
  const [focus, setFocus] = useState(f0);
  const [state, action, pending] = useActionState(saveContent, null);

  return (
    <form action={action}>
      <input type="hidden" name="journey" value={JSON.stringify(journey)} />
      <input type="hidden" name="focus" value={JSON.stringify(focus)} />
      <PageHeader
        title="Content"
        description="The journey timeline, the services you offer and the scrolling tool marquee."
        actions={
          <div className="flex items-center gap-3">
            <ActionStatus state={state} />
            <SubmitButton pending={pending}>Save content</SubmitButton>
          </div>
        }
      />
      <div className="grid gap-4">
        <Card title="Journey" description="Milestones on the scroll-drawn timeline and the signposts in the World.">
          <ol className="grid gap-3">
            {journey.map((m, i) => (
              <li key={i} className="grid gap-3 rounded-2xl border border-line p-4 sm:grid-cols-[140px_1fr_auto]">
                <input aria-label="Date" placeholder="May 2026" value={m.date} onChange={(e) => setJourney((js) => js.map((x, k) => (k === i ? { ...x, date: e.target.value } : x)))} className={inputClass} />
                <div className="grid gap-2">
                  <input aria-label="Title" placeholder="Title" value={m.title} onChange={(e) => setJourney((js) => js.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)))} className={inputClass} />
                  <textarea aria-label="Description" rows={2} placeholder="What happened" value={m.body} onChange={(e) => setJourney((js) => js.map((x, k) => (k === i ? { ...x, body: e.target.value } : x)))} className={inputClass + " resize-y"} />
                </div>
                <button type="button" aria-label="Remove milestone" onClick={() => setJourney((js) => js.filter((_, k) => k !== i))} className="grid size-9 place-items-center self-start rounded-full text-muted hover:bg-ember/10 hover:text-ember">
                  <X size={16} />
                </button>
              </li>
            ))}
          </ol>
          <button type="button" onClick={() => setJourney((js) => [...js, { date: "", title: "", body: "" }])} className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-line-strong px-3 py-1.5 text-sm hover:border-fg/30">
            <Plus size={14} /> Add milestone
          </button>
        </Card>

        <Card title="Services" description="The stacking cards in the “What I can do for you” section.">
          <ol className="grid gap-3 md:grid-cols-2">
            {focus.map((f, i) => (
              <li key={i} className="grid gap-2 rounded-2xl border border-line p-4">
                <div className="flex gap-2">
                  <input aria-label="Service title" value={f.title} onChange={(e) => setFocus((fs) => fs.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)))} className={inputClass} />
                  <button type="button" aria-label="Remove service" onClick={() => setFocus((fs) => fs.filter((_, k) => k !== i))} className="grid size-10 shrink-0 place-items-center rounded-full text-muted hover:bg-ember/10 hover:text-ember">
                    <X size={16} />
                  </button>
                </div>
                <textarea aria-label="Service description" rows={3} value={f.body} onChange={(e) => setFocus((fs) => fs.map((x, k) => (k === i ? { ...x, body: e.target.value } : x)))} className={inputClass + " resize-y"} />
              </li>
            ))}
          </ol>
          <button type="button" onClick={() => setFocus((fs) => [...fs, { title: "", body: "" }])} className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-line-strong px-3 py-1.5 text-sm hover:border-fg/30">
            <Plus size={14} /> Add service
          </button>
        </Card>

        <Card title="Tool marquee" description="The two scrolling rows under the hero.">
          <Field label="Tools" hint="One per line or comma separated. The list is split across the two rows." htmlFor="stack">
            <textarea id="stack" name="stack" rows={5} defaultValue={s0.join(", ")} className={inputClass + " resize-y"} />
          </Field>
        </Card>
      </div>
    </form>
  );
}
