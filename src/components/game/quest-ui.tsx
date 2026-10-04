"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  ChatCircleText,
  Copy,
  GameController,
  GithubLogo,
  House,
  Lightning,
  Lock,
  MagnifyingGlass,
  Path,
  Trophy,
  User,
  X,
} from "@phosphor-icons/react/dist/ssr";
import type { IconProps } from "@phosphor-icons/react";
import { achievements, levelFor } from "./achievements";
import { useGame } from "./game-provider";
import { cn, easeOut } from "@/lib/utils";

export function XpBadge() {
  const { progress, openPanel, ready } = useGame();
  const { level, progress: p } = levelFor(progress.xp);
  const r = 13;
  const c = 2 * Math.PI * r;
  return (
    <button
      type="button"
      onClick={openPanel}
      aria-label={`Level ${level}, ${progress.xp} XP. Open achievements`}
      className="press group relative flex h-9 items-center gap-2 rounded-full bg-surface-2 pl-1 pr-3 text-[12px] font-medium transition-colors duration-200 hover:bg-[#1d2427]"
    >
      <span className="relative grid size-7 place-items-center">
        <svg viewBox="0 0 32 32" className="absolute inset-0 -rotate-90">
          <circle cx="16" cy="16" r={r} fill="none" stroke="var(--line-strong)" strokeWidth="3" />
          <motion.circle
            cx="16"
            cy="16"
            r={r}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={false}
            animate={{ strokeDashoffset: c * (1 - (ready ? p : 0)) }}
            transition={{ duration: 0.8, ease: easeOut }}
          />
        </svg>
        <span className="font-mono text-[11px] tabular-nums">{level}</span>
      </span>
      <span className="hidden tabular-nums text-muted sm:inline">
        <motion.span key={progress.xp} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="text-fg">
          {progress.xp}
        </motion.span>{" "}
        XP
      </span>
    </button>
  );
}

function Sheet({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
        >
          <div className="absolute inset-0 bg-bg/70 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={{ opacity: 0, transform: "translateY(16px) scale(0.97)" }}
            animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
            exit={{ opacity: 0, transform: "translateY(8px) scale(0.98)", transition: { duration: 0.15 } }}
            transition={{ duration: 0.3, ease: easeOut }}
            className="relative w-full max-w-[640px] overflow-hidden rounded-3xl border border-line-strong bg-surface shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9)]"
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function AchievementsPanel() {
  const { progress, panelOpen, closePanel, reset } = useGame();
  const { level, progress: p, ceil, max } = levelFor(progress.xp);
  const unlockedCount = Object.keys(progress.unlocked).length;

  return (
    <Sheet open={panelOpen} onClose={closePanel} label="Achievements">
      <div className="relative border-b border-line p-6">
        <button
          type="button"
          onClick={closePanel}
          aria-label="Close"
          className="press absolute right-4 top-4 grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <X size={18} />
        </button>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Visitor profile</p>
        <div className="mt-3 flex items-end gap-4">
          <p className="text-5xl font-semibold tracking-[-0.04em]">Lv {level}</p>
          <p className="pb-1.5 text-sm text-muted">
            {progress.xp} XP{max ? " · max level" : ` · ${ceil - progress.xp} to next`}
          </p>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2">
          <motion.div
            className="h-full origin-left rounded-full bg-gradient-to-r from-accent to-[#a5f0e1]"
            initial={{ transform: "scaleX(0)" }}
            animate={{ transform: `scaleX(${p})` }}
            transition={{ duration: 0.9, ease: easeOut }}
          />
        </div>
        <p className="mt-3 text-sm text-muted">
          {unlockedCount} of {achievements.length} achievements unlocked. Progress is saved in this browser.
        </p>
      </div>
      <ul className="grid max-h-[50vh] gap-px overflow-y-auto bg-line sm:grid-cols-2">
        {achievements.map((a, i) => {
          const done = Boolean(progress.unlocked[a.id]);
          return (
            <motion.li
              key={a.id}
              initial={{ opacity: 0, transform: "translateY(8px)" }}
              animate={{ opacity: 1, transform: "translateY(0px)" }}
              transition={{ delay: 0.05 + i * 0.03, duration: 0.35, ease: easeOut }}
              className="flex items-start gap-3 bg-surface p-4"
            >
              <span
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-xl",
                  done ? "bg-accent/15 text-accent" : "bg-surface-2 text-muted/60",
                )}
              >
                {done ? <Trophy size={18} weight="fill" /> : <Lock size={18} />}
              </span>
              <div className="min-w-0">
                <p className={cn("font-medium tracking-tight", !done && "text-fg/60")}>
                  {done || !a.secret ? a.title : "Secret achievement"}
                </p>
                <p className="text-sm text-muted">{done || !a.secret ? a.hint : "Keep poking around."}</p>
              </div>
              <span className="ml-auto font-mono text-xs text-muted">+{a.xp}</span>
            </motion.li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between border-t border-line px-6 py-3 text-xs text-muted">
        <span>Tip: press Ctrl/⌘ + K anywhere.</span>
        <button type="button" onClick={reset} className="underline-offset-4 hover:text-fg hover:underline">
          Reset progress
        </button>
      </div>
    </Sheet>
  );
}

type Command = {
  id: string;
  label: string;
  group: string;
  icon: ComponentType<IconProps>;
  run: () => void;
  keywords?: string;
};

export function CommandPalette({ github, email }: { github: string; email: string }) {
  const { paletteOpen, closePalette, openPanel } = useGame();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const go = (hash: string) => () => {
    closePalette();
    const el = document.getElementById(hash);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    else router.push(`/#${hash}`);
  };

  const commands: Command[] = useMemo(() => {
    const list: Command[] = [
      { id: "top", label: "Home", group: "Navigate", icon: House, run: go("top") },
      { id: "about", label: "About me", group: "Navigate", icon: User, run: go("about") },
      { id: "skills", label: "Skills & classes", group: "Navigate", icon: Lightning, run: go("skills"), keywords: "python sql react ai ml" },
      { id: "journey", label: "Journey", group: "Navigate", icon: Path, run: go("journey") },
      { id: "work", label: "Projects", group: "Navigate", icon: Briefcase, run: go("work") },
      { id: "log", label: "Build log", group: "Navigate", icon: BookOpen, run: go("log"), keywords: "posts updates blog" },
      { id: "contact", label: "Contact", group: "Navigate", icon: ChatCircleText, run: go("contact"), keywords: "email message hire" },
      {
        id: "world",
        label: "Enter the World (walkable portfolio)",
        group: "Fun",
        icon: GameController,
        run: () => {
          closePalette();
          router.push("/world");
        },
        keywords: "game character walk explore",
      },
      { id: "play", label: "Play Snake", group: "Fun", icon: GameController, run: go("play"), keywords: "game" },
      {
        id: "achievements",
        label: "View achievements",
        group: "Fun",
        icon: Trophy,
        run: () => {
          closePalette();
          openPanel();
        },
        keywords: "xp level",
      },
      {
        id: "github",
        label: "Open GitHub",
        group: "Links",
        icon: GithubLogo,
        run: () => {
          closePalette();
          window.open(github, "_blank", "noopener");
        },
      },
    ];
    if (email) {
      list.push({
        id: "copy-email",
        label: copied ? "Email copied" : "Copy email address",
        group: "Links",
        icon: Copy,
        run: () => {
          navigator.clipboard?.writeText(email).then(() => setCopied(true));
        },
      });
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [github, email, copied, router]);

  const filtered = commands.filter((c) =>
    `${c.label} ${c.group} ${c.keywords ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  useEffect(() => {
    if (paletteOpen) {
      // reset each time the palette opens
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
      setActive(0);
      setCopied(false);
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [paletteOpen]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[active]?.run();
    }
  };

  let lastGroup = "";
  return (
    <Sheet open={paletteOpen} onClose={closePalette} label="Command palette">
      <div className="flex items-center gap-3 border-b border-line px-5">
        <MagnifyingGlass size={18} className="text-muted" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Where to? Try 'skills', 'snake' or 'contact'"
          aria-label="Search commands"
          className="h-14 flex-1 bg-transparent text-[15px] text-fg placeholder:text-muted focus:outline-none"
        />
        <kbd className="rounded-md border border-line-strong px-1.5 py-0.5 font-mono text-[10px] text-muted">esc</kbd>
      </div>
      <ul className="max-h-[50vh] overflow-y-auto p-2" role="listbox" aria-label="Commands">
        {filtered.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-muted">Nothing matches &ldquo;{query}&rdquo;. Try a section name.</li>
        ) : null}
        {filtered.map((c, i) => {
          const header = c.group !== lastGroup ? c.group : null;
          lastGroup = c.group;
          const Icon = c.icon;
          return (
            <li key={c.id}>
              {header ? (
                <p className="px-3 pb-1 pt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">{header}</p>
              ) : null}
              <button
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseMove={() => setActive(i)}
                onClick={c.run}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] transition-colors duration-100",
                  i === active ? "bg-surface-2 text-fg" : "text-fg/75",
                )}
              >
                <Icon size={18} className={i === active ? "text-accent" : "text-muted"} />
                {c.label}
                {i === active ? <ArrowRight size={14} className="ml-auto text-muted" /> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
