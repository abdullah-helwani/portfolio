"use client";

import { useActionState, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash, X } from "@phosphor-icons/react/dist/ssr";
import { saveSkills } from "@/app/dashboard/actions";
import { skillIcons, type SkillClass } from "@/lib/site";
import { cn } from "@/lib/utils";
import { ActionStatus, Field, PageHeader, SubmitButton, inputClass } from "./ui";

function Pips({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} of 5`}
          onClick={() => onChange(n)}
          className={cn("h-3 w-5 rounded-sm transition-colors", n <= value ? "bg-accent" : "bg-surface-2 hover:bg-line-strong")}
        />
      ))}
    </div>
  );
}

export function SkillsEditor({ initial }: { initial: SkillClass[] }) {
  const [classes, setClasses] = useState<SkillClass[]>(initial);
  const [state, action, pending] = useActionState(saveSkills, null);

  const update = (i: number, patch: Partial<SkillClass>) => setClasses((cs) => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const move = (i: number, dir: -1 | 1) =>
    setClasses((cs) => {
      const j = i + dir;
      if (j < 0 || j >= cs.length) return cs;
      const next = [...cs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <form action={action}>
      <input type="hidden" name="skills" value={JSON.stringify(classes)} />
      <PageHeader
        title="Skills"
        description="Your classes power the character sheet on the homepage and the skill orbs in the World."
        actions={
          <div className="flex items-center gap-3">
            <ActionStatus state={state} />
            <SubmitButton pending={pending}>Save skills</SubmitButton>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {classes.map((c, i) => (
          <section key={i} className="rounded-3xl border border-line bg-surface p-5 md:p-6">
            <div className="flex items-start gap-3">
              <div className="grid flex-1 gap-3 sm:grid-cols-[1fr_140px]">
                <Field label="Class name" htmlFor={`c-name-${i}`}>
                  <input id={`c-name-${i}`} value={c.name} onChange={(e) => update(i, { name: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Icon" htmlFor={`c-icon-${i}`}>
                  <select id={`c-icon-${i}`} value={c.icon} onChange={(e) => update(i, { icon: e.target.value as SkillClass["icon"] })} className={inputClass}>
                    {skillIcons.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="flex flex-col pt-6">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-30">
                  <ArrowUp size={14} />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === classes.length - 1} aria-label="Move down" className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-30">
                  <ArrowDown size={14} />
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label={`Level · ${c.level} / 10`} htmlFor={`c-level-${i}`}>
                <input id={`c-level-${i}`} type="range" min={1} max={10} value={c.level} onChange={(e) => update(i, { level: Number(e.target.value) })} className="accent-[var(--accent)]" />
              </Field>
              <Field label={`Progress to next level · ${c.xp}%`} htmlFor={`c-xp-${i}`}>
                <input id={`c-xp-${i}`} type="range" min={0} max={100} value={c.xp} onChange={(e) => update(i, { xp: Number(e.target.value) })} className="accent-[var(--accent)]" />
              </Field>
            </div>

            <Field label="Description" className="mt-4" htmlFor={`c-blurb-${i}`}>
              <textarea id={`c-blurb-${i}`} rows={2} value={c.blurb} onChange={(e) => update(i, { blurb: e.target.value })} className={inputClass + " resize-y"} />
            </Field>

            <p className="mt-5 text-[13px] font-medium text-fg/85">Skills</p>
            <ul className="mt-2 grid gap-2">
              {c.skills.map((s, k) => (
                <li key={k} className="flex items-center gap-3">
                  <input
                    aria-label="Skill name"
                    value={s.name}
                    onChange={(e) => update(i, { skills: c.skills.map((x, y) => (y === k ? { ...x, name: e.target.value } : x)) })}
                    className={inputClass + " py-2"}
                  />
                  <Pips label={`${s.name || "Skill"} level`} value={s.level} onChange={(v) => update(i, { skills: c.skills.map((x, y) => (y === k ? { ...x, level: v } : x)) })} />
                  <button
                    type="button"
                    aria-label={`Remove ${s.name || "skill"}`}
                    onClick={() => update(i, { skills: c.skills.filter((_, y) => y !== k) })}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ember"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => update(i, { skills: [...c.skills, { name: "", level: 3 }] })}
                className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-3 py-1.5 text-sm hover:border-fg/30"
              >
                <Plus size={14} /> Add skill
              </button>
              <button
                type="button"
                onClick={() => setClasses((cs) => cs.filter((_, j) => j !== i))}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted hover:bg-ember/10 hover:text-ember"
              >
                <Trash size={14} /> Remove class
              </button>
            </div>
          </section>
        ))}

        <button
          type="button"
          onClick={() =>
            setClasses((cs) => [...cs, { id: "", name: "New class", level: 5, xp: 0, blurb: "", icon: "code", skills: [{ name: "", level: 3 }] }])
          }
          className="grid min-h-[200px] place-items-center rounded-3xl border border-dashed border-line-strong text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <span className="inline-flex items-center gap-2">
            <Plus size={18} /> Add a class
          </span>
        </button>
      </div>
    </form>
  );
}
