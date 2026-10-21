"use client";

import { AvatarSvg } from "@/components/city/avatar-svg";
import type { Accessory } from "@/lib/site";
import { ObjectEditor } from "./schema-editor";

export function GuideEditor({ initial, portraitUrl }: { initial: Record<string, unknown>; portraitUrl: string }) {
  return (
    <ObjectEditor target="guide" initial={initial} submitLabel="Save guide">
      {(v) => (
        <div className="flex flex-wrap items-center gap-6 rounded-3xl border border-line bg-bg p-5">
          <div className="grid size-36 place-items-center rounded-2xl bg-[radial-gradient(circle_at_50%_30%,#1d3b37,#0b0f11)]">
            <AvatarSvg
              shirt={String(v.shirt)}
              pants={String(v.pants)}
              hair={String(v.hair)}
              skin={String(v.skin)}
              accessory={v.accessory as Accessory}
              className="h-28"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">First line visitors hear</p>
            <div className="mt-2 flex items-start gap-3 rounded-2xl border border-line-strong bg-surface p-4">
              {portraitUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={portraitUrl} alt="" className="size-10 shrink-0 rounded-full object-cover" />
              ) : null}
              <div>
                <p className="text-sm font-semibold">{String(v.name)}</p>
                <p className="mt-1 text-sm leading-relaxed text-fg/80">{(v.intro as string[])?.[0] ?? ""}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </ObjectEditor>
  );
}
