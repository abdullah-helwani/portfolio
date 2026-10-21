"use client";

import { useActionState } from "react";
import { saveStack } from "@/app/dashboard/actions";
import { ActionStatus, Card, Field, inputClass, SubmitButton } from "./ui";

export function StackEditor({ stack }: { stack: string[] }) {
  const [state, action, pending] = useActionState(saveStack, null);
  return (
    <Card title="Toolbox" description="Tools and technologies listed in the Résumé section and on the City billboards.">
      <form action={action} className="grid gap-4">
        <Field label="Tools" hint="Comma or line separated." htmlFor="stack">
          <textarea id="stack" name="stack" rows={3} defaultValue={stack.join(", ")} className={inputClass + " resize-y"} />
        </Field>
        <div className="flex items-center gap-3">
          <SubmitButton pending={pending}>Save toolbox</SubmitButton>
          <ActionStatus state={state} />
        </div>
      </form>
    </Card>
  );
}
