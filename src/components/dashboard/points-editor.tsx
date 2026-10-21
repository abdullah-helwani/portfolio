"use client";

import { useActionState, useState } from "react";
import { saveAchievements } from "@/app/dashboard/actions";
import { baseAchievements, baseActivities } from "@/components/game/achievements";
import type { AchievementOverride } from "@/lib/site";
import { cn } from "@/lib/utils";
import { ActionStatus, inputClass, SubmitButton, Switch } from "./ui";

type Row = { title: string; hint: string; xp: number; enabled: boolean };

export function PointsEditor({ initial }: { initial: Record<string, AchievementOverride> }) {
  const [state, action, pending] = useActionState(saveAchievements, null);
  const [rows, setRows] = useState<Record<string, Row>>(() => {
    const out: Record<string, Row> = {};
    for (const a of baseAchievements) {
      const o = initial[a.id] ?? {};
      out[a.id] = { title: o.title || a.title, hint: o.hint || a.hint, xp: o.xp ?? a.xp, enabled: o.enabled !== false };
    }
    for (const a of baseActivities) {
      const o = initial[a.id] ?? {};
      out[a.id] = { title: a.title, hint: "", xp: o.xp ?? a.xp, enabled: o.enabled !== false };
    }
    return out;
  });
  const set = (id: string, patch: Partial<Row>) => setRows((r) => ({ ...r, [id]: { ...r[id], ...patch } }));
  const total = baseAchievements.filter((a) => rows[a.id].enabled).reduce((n, a) => n + rows[a.id].xp, 0);

  return (
    <form action={action} className="grid gap-8">
      <input type="hidden" name="json" value={JSON.stringify(rows)} />
      <div>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-semibold tracking-tight">Achievements</h3>
          <p className="font-mono text-xs text-muted">
            Unlocking everything gives <span className="text-accent">{total} XP</span>
          </p>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-bg/60 text-left font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
              <tr>
                <th className="px-4 py-3 font-normal">On</th>
                <th className="px-2 py-3 font-normal">Title</th>
                <th className="px-2 py-3 font-normal">How to earn it</th>
                <th className="w-24 px-4 py-3 font-normal">XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {baseAchievements.map((a) => {
                const r = rows[a.id];
                return (
                  <tr key={a.id} className={cn(!r.enabled && "opacity-50")}>
                    <td className="px-4 py-2">
                      <Switch label="" checked={r.enabled} onChange={(v) => set(a.id, { enabled: v })} />
                    </td>
                    <td className="px-2 py-2">
                      <input aria-label={`${a.id} title`} value={r.title} maxLength={60} onChange={(e) => set(a.id, { title: e.target.value })} className={cn(inputClass, "py-2")} />
                      {a.secret ? <span className="mt-1 block text-[11px] text-ember">secret</span> : null}
                    </td>
                    <td className="px-2 py-2">
                      <input aria-label={`${a.id} hint`} value={r.hint} maxLength={160} onChange={(e) => set(a.id, { hint: e.target.value })} className={cn(inputClass, "py-2")} />
                    </td>
                    <td className="px-4 py-2">
                      <input aria-label={`${a.id} xp`} type="number" min={0} max={1000} value={r.xp} onChange={(e) => set(a.id, { xp: e.target.valueAsNumber || 0 })} className={cn(inputClass, "py-2 tabular-nums")} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-semibold tracking-tight">Repeatable activities</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {baseActivities.map((a) => {
            const r = rows[a.id];
            return (
              <li key={a.id} className={cn("flex items-center gap-3 rounded-2xl border border-line bg-bg/40 px-4 py-2.5", !r.enabled && "opacity-50")}>
                <Switch label="" checked={r.enabled} onChange={(v) => set(a.id, { enabled: v })} />
                <span className="min-w-0 flex-1 text-sm">{a.title}</span>
                <input aria-label={`${a.title} xp`} type="number" min={0} max={1000} value={r.xp} onChange={(e) => set(a.id, { xp: e.target.valueAsNumber || 0 })} className={cn(inputClass, "w-20 py-2 tabular-nums")} />
                <span className="font-mono text-xs text-muted">XP</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="sticky bottom-3 z-10 flex items-center gap-3 rounded-full border border-line bg-surface/90 py-2 pl-2 pr-4 backdrop-blur">
        <SubmitButton pending={pending}>Save points</SubmitButton>
        <ActionStatus state={state} />
      </div>
    </form>
  );
}
