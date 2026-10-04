"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useGameOptional } from "@/components/game/game-provider";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, CheckCircle, CircleNotch, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { sendMessage, type ContactState } from "@/app/actions";
import { cn, easeOut } from "@/lib/utils";

const initial: ContactState = { status: "idle" };

const fieldClass =
  "peer w-full rounded-2xl border border-line-strong bg-bg/55 px-4 pb-3 pt-7 text-[15px] text-fg backdrop-blur-md transition-[border-color,background-color] duration-200 placeholder:text-transparent hover:border-fg/30 focus:border-accent focus:bg-bg/75 focus:outline-none aria-[invalid=true]:border-ember";
const labelClass =
  "pointer-events-none absolute left-4 top-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted transition-colors duration-200 peer-focus:text-accent";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 flex items-center gap-1.5 text-xs text-ember">
      <WarningCircle size={14} weight="fill" />
      {message}
    </p>
  );
}

export function ContactForm() {
  const [attempt, setAttempt] = useState(0);
  return <ContactFormInner key={attempt} onReset={() => setAttempt((n) => n + 1)} />;
}

function ContactFormInner({ onReset }: { onReset: () => void }) {
  const [state, action, pending] = useActionState(sendMessage, initial);
  const game = useGameOptional();
  const unlock = game?.unlock;
  useEffect(() => {
    if (state.status === "success") unlock?.("networker");
  }, [state.status, unlock]);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <div className="relative">
      <AnimatePresence mode="wait" initial={false}>
        {state.status === "success" ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, transform: "translateY(12px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="rounded-3xl border border-accent/40 bg-bg/60 p-8 backdrop-blur-md"
            role="status"
          >
            <CheckCircle size={36} weight="duotone" className="text-accent" />
            <p className="mt-4 text-2xl font-semibold tracking-tight">Message sent</p>
            <p className="mt-2 max-w-[40ch] text-fg/75">{state.message}</p>
            <button
              type="button"
              onClick={onReset}
              className="press mt-6 inline-flex h-11 items-center rounded-full border border-line-strong px-5 text-sm transition-colors duration-200 hover:border-fg/40"
            >
              Send another message
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            ref={formRef}
            action={action}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transform: "translateY(-8px)" }}
            transition={{ duration: 0.3, ease: easeOut }}
            className="grid gap-3"
            noValidate
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="relative">
                <input
                  id="cf-name"
                  name="name"
                  autoComplete="name"
                  placeholder="Your name"
                  maxLength={80}
                  required
                  aria-invalid={Boolean(errors?.name)}
                  aria-describedby={errors?.name ? "cf-name-error" : undefined}
                  className={fieldClass}
                />
                <label htmlFor="cf-name" className={labelClass}>
                  Name
                </label>
                <FieldError id="cf-name-error" message={errors?.name} />
              </div>
              <div className="relative">
                <input
                  id="cf-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  aria-invalid={Boolean(errors?.email)}
                  aria-describedby={errors?.email ? "cf-email-error" : undefined}
                  className={fieldClass}
                />
                <label htmlFor="cf-email" className={labelClass}>
                  Email
                </label>
                <FieldError id="cf-email-error" message={errors?.email} />
              </div>
            </div>
            <div className="relative">
              <textarea
                id="cf-body"
                name="body"
                rows={5}
                placeholder="What are you working on?"
                maxLength={4000}
                required
                aria-invalid={Boolean(errors?.body)}
                aria-describedby={errors?.body ? "cf-body-error" : undefined}
                className={cn(fieldClass, "resize-none")}
              />
              <label htmlFor="cf-body" className={labelClass}>
                Message
              </label>
              <FieldError id="cf-body-error" message={errors?.body} />
            </div>
            {/* honeypot */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label>
                Company
                <input name="company" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
              <p aria-live="polite" className={cn("text-sm", state.status === "error" ? "text-ember" : "text-fg/60")}>
                {state.status === "error" ? state.message : "I usually reply within two days."}
              </p>
              <button
                type="submit"
                disabled={pending}
                className="press group inline-flex h-14 items-center gap-3 rounded-full bg-fg pl-7 pr-2 text-[15px] font-medium text-bg transition-[background-color,opacity] duration-200 hover:bg-accent disabled:cursor-wait disabled:opacity-70"
              >
                {pending ? "Sending" : "Send message"}
                <span className="grid size-10 place-items-center rounded-full bg-bg text-fg">
                  {pending ? (
                    <CircleNotch size={18} weight="bold" className="animate-spin" />
                  ) : (
                    <ArrowRight
                      size={18}
                      weight="bold"
                      className="transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5"
                    />
                  )}
                </span>
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
