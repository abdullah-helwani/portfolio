"use client";

import { useActionState } from "react";
import { ArrowRight, CircleNotch, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { login } from "@/app/dashboard/actions";
import { inputClass } from "@/components/dashboard/ui";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="mt-6 grid gap-4">
      <div className="grid gap-1.5">
        <label htmlFor="password" className="text-[13px] font-medium text-fg/85">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          aria-invalid={state ? !state.ok : undefined}
          aria-describedby={state && !state.ok ? "login-error" : undefined}
          className={inputClass + " h-12"}
        />
      </div>
      {state && !state.ok ? (
        <p id="login-error" role="alert" className="flex items-start gap-2 text-sm text-ember">
          <WarningCircle size={18} weight="fill" className="mt-px shrink-0" />
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="press inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent text-sm font-medium text-accent-ink disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? <CircleNotch size={16} className="animate-spin" /> : null}
        {pending ? "Signing in" : "Sign in"}
        {!pending ? <ArrowRight size={16} weight="bold" /> : null}
      </button>
    </form>
  );
}
