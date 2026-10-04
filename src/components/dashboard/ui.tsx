"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle, CircleNotch, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import type { ActionResult } from "@/app/dashboard/actions";
import { cn, easeOut } from "@/lib/utils";

export const inputClass =
  "w-full rounded-xl border border-line-strong bg-bg px-3.5 py-2.5 text-[14px] text-fg placeholder:text-muted/60 transition-[border-color,background-color] duration-150 hover:border-fg/25 focus:border-accent focus:outline-none";

export function Field({
  label,
  hint,
  children,
  className,
  htmlFor,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-fg/85">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function Card({ title, description, children, actions, className }: { title?: string; description?: string; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-3xl border border-line bg-surface", className)}>
      {title ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4 md:px-6">
          <div>
            <h2 className="font-semibold tracking-tight">{title}</h2>
            {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
          </div>
          {actions}
        </header>
      ) : null}
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}

export function Switch({
  name,
  defaultChecked,
  checked,
  onChange,
  label,
}: {
  name?: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (v: boolean) => void;
  label: string;
}) {
  const [inner, setInner] = useState(Boolean(defaultChecked));
  const on = checked ?? inner;
  return (
    <label className="inline-flex cursor-pointer select-none items-center gap-3 text-sm">
      <input
        type="checkbox"
        name={name}
        checked={on}
        onChange={(e) => {
          setInner(e.target.checked);
          onChange?.(e.target.checked);
        }}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors duration-200 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent",
          on ? "bg-accent" : "bg-surface-2",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 size-5 rounded-full bg-fg shadow transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
            on && "translate-x-5 bg-accent-ink",
          )}
        />
      </span>
      {label}
    </label>
  );
}

export function SubmitButton({ pending, children, className }: { pending: boolean; children: ReactNode; className?: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "press inline-flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-ink transition-opacity duration-150 disabled:cursor-wait disabled:opacity-70",
        className,
      )}
    >
      {pending ? <CircleNotch size={16} className="animate-spin" /> : null}
      {children}
    </button>
  );
}

export function ActionStatus({ state }: { state: ActionResult | null }) {
  const [visible, setVisible] = useState<ActionResult | null>(null);
  useEffect(() => {
    if (!state) return;
    // show the latest result, then fade successes out
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(state);
    if (state.ok) {
      const t = window.setTimeout(() => setVisible(null), 3200);
      return () => window.clearTimeout(t);
    }
  }, [state]);
  return (
    <span aria-live="polite" className="min-h-5">
      <AnimatePresence mode="wait">
        {visible ? (
          <motion.span
            key={visible.at}
            initial={{ opacity: 0, transform: "translateY(4px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: easeOut }}
            className={cn("inline-flex items-center gap-1.5 text-sm", visible.ok ? "text-accent" : "text-ember")}
          >
            {visible.ok ? <CheckCircle size={16} weight="fill" /> : <WarningCircle size={16} weight="fill" />}
            {visible.message}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}

/** Small icon/text button that runs a server action without a form. */
export function ActionButton({
  action,
  children,
  label,
  className,
  confirm,
}: {
  action: () => Promise<unknown>;
  children: ReactNode;
  label: string;
  className?: string;
  confirm?: string;
}) {
  const [pending, start] = useTransition();
  const [arming, setArming] = useState(false);

  useEffect(() => {
    if (!arming) return;
    const t = window.setTimeout(() => setArming(false), 3000);
    return () => window.clearTimeout(t);
  }, [arming]);

  return (
    <button
      type="button"
      aria-label={arming ? confirm : label}
      title={arming ? confirm : label}
      disabled={pending}
      onClick={() => {
        if (confirm && !arming) {
          setArming(true);
          return;
        }
        setArming(false);
        start(async () => {
          await action();
        });
      }}
      className={cn(
        "press inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-full px-2.5 text-sm text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-fg disabled:opacity-50",
        arming && "bg-ember/15 px-3 text-ember hover:bg-ember/20 hover:text-ember",
        className,
      )}
    >
      {pending ? <CircleNotch size={16} className="animate-spin" /> : arming ? <span className="text-xs font-medium">{confirm}</span> : children}
    </button>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] md:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-[60ch] text-muted">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-bg/70 p-4 backdrop-blur-sm md:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, transform: "translateY(16px) scale(0.98)" }}
            animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
            exit={{ opacity: 0, transform: "translateY(8px) scale(0.98)", transition: { duration: 0.15 } }}
            transition={{ duration: 0.3, ease: easeOut }}
            className={cn("w-full rounded-3xl border border-line-strong bg-surface shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9)]", wide ? "max-w-[860px]" : "max-w-[640px]")}
          >
            <header className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
              <button type="button" onClick={onClose} className="rounded-full px-3 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-fg">
                Close
              </button>
            </header>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-3xl border border-dashed border-line-strong px-6 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-surface-2 text-accent">{icon}</span>
      <p className="mt-4 font-semibold tracking-tight">{title}</p>
      <p className="mt-1 max-w-[42ch] text-sm text-muted">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
