"use client";

import { useOptimistic, useTransition } from "react";
import { setAvailability } from "@/app/dashboard/actions";
import { Switch } from "./ui";

export function AvailabilityToggle({ available, status }: { available: boolean; status: string }) {
  const [optimistic, setOptimistic] = useOptimistic(available);
  const [, start] = useTransition();
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="relative flex size-3">
          {optimistic ? <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" /> : null}
          <span className={optimistic ? "relative size-3 rounded-full bg-accent" : "relative size-3 rounded-full bg-muted"} />
        </span>
        <p className="text-lg font-semibold tracking-tight">{optimistic ? "Available for work" : "Not taking work"}</p>
      </div>
      <p className="mt-1 text-sm text-muted">Status line: &ldquo;{status}&rdquo;</p>
      <div className="mt-5">
        <Switch
          label={optimistic ? "Visitors see you as available" : "Visitors see you as heads down"}
          checked={optimistic}
          onChange={(v) =>
            start(async () => {
              setOptimistic(v);
              await setAvailability(v);
            })
          }
        />
      </div>
    </div>
  );
}
