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
  Flask,
  FilmSlate,
  GameController,
  Gift,
  GithubLogo,
  House,
  Lightning,
  Lock,
  MagnifyingGlass,
  Path,
  Scroll,
  Trophy,
  User,
  X,
} from "@phosphor-icons/react/dist/ssr";
import type { IconProps } from "@phosphor-icons/react";
import { levelFor } from "./achievements";
import { useGame, type RewardState } from "./game-provider";
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

function drawCertificate(name: string, owner: string, xp: number, level: number) {
  const c = document.createElement("canvas");
  c.width = 1600;
  c.height = 1100;
  const g = c.getContext("2d")!;
  const font = getComputedStyle(document.body).fontFamily;
  const mono = getComputedStyle(document.body).getPropertyValue("--font-geist-mono") || "monospace";
  g.fillStyle = "#0b0f10";
  g.fillRect(0, 0, 1600, 1100);
  const glow = g.createRadialGradient(800, 380, 40, 800, 380, 900);
  glow.addColorStop(0, "rgba(95,214,192,0.25)");
  glow.addColorStop(1, "rgba(95,214,192,0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, 1600, 1100);
  g.strokeStyle = "rgba(95,214,192,0.55)";
  g.lineWidth = 3;
  g.strokeRect(50, 50, 1500, 1000);
  g.strokeStyle = "rgba(214,232,228,0.12)";
  g.lineWidth = 1;
  g.strokeRect(70, 70, 1460, 960);
  g.textAlign = "center";
  g.fillStyle = "#5fd6c0";
  g.font = `500 28px ${mono}`;
  g.fillText("CERTIFICATE OF EXPLORATION", 800, 230);
  g.fillStyle = "#8b9794";
  g.font = `400 34px ${font}`;
  g.fillText("This certifies that", 800, 360);
  g.fillStyle = "#e8eeec";
  g.font = `600 112px ${font}`;
  g.fillText(name || "A curious visitor", 800, 500);
  g.fillStyle = "#c9d2d0";
  g.font = `400 36px ${font}`;
  g.fillText(`explored the portfolio of ${owner} and reached level ${level}`, 800, 600);
  g.fillText(`with ${xp} XP.`, 800, 650);
  g.fillStyle = "#8b9794";
  g.font = `500 24px ${mono}`;
  g.fillText(new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }).toUpperCase(), 800, 880);
  g.fillText(location.host.toUpperCase(), 800, 920);
  return c.toDataURL("image/png");
}

function RewardBody({ reward }: { reward: RewardState }) {
  const { progress, setName, setCosmetic } = useGame();
  const [copied, setCopied] = useState(false);
  const [name, setLocalName] = useState(progress.name);
  if (!reward.unlocked) {
    return (
      <div className="mt-3">
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full origin-left rounded-full bg-[#f6c177]" style={{ transform: `scaleX(${reward.progress})` }} />
        </div>
        <p className="mt-1.5 font-mono text-[11px] text-muted">
          {reward.xp > 0 ? `${progress.xp} / ${reward.xp} XP` : `${Math.round(reward.progress * 100)}% of achievements`}
        </p>
      </div>
    );
  }
  switch (reward.kind) {
    case "message":
      return <p className="mt-3 rounded-xl border border-line bg-bg/60 p-3 text-sm leading-relaxed text-fg/85">{reward.payload}</p>;
    case "link":
      return (
        <a href={reward.payload} target="_blank" rel="noreferrer" className="press mt-3 inline-flex h-9 items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-accent-ink">
          Open <ArrowRight size={14} />
        </a>
      );
    case "code":
      return (
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(reward.payload).then(() => setCopied(true))}
          className="mt-3 inline-flex items-center gap-3 rounded-xl border border-dashed border-[#f6c177]/60 bg-[#f6c177]/10 px-4 py-2 font-mono text-sm text-[#f6c177]"
        >
          {reward.payload}
          <span className="text-xs text-muted">{copied ? "copied" : "copy"}</span>
        </button>
      );
    case "cosmetic": {
      const on = progress.cosmetic === reward.payload;
      return (
        <button type="button" onClick={() => setCosmetic(on ? "" : reward.payload)} className={cn("press mt-3 inline-flex h-9 items-center rounded-full px-4 text-sm font-medium", on ? "bg-surface-2 text-fg" : "bg-accent text-accent-ink")}>
          {on ? "Equipped in the City" : "Equip"}
        </button>
      );
    }
    case "certificate":
      return (
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setName(name);
            const owner = document.querySelector("meta[property='og:title']")?.getAttribute("content") ?? "the owner";
            const a = document.createElement("a");
            a.href = drawCertificate(name.trim(), owner, progress.xp, levelFor(progress.xp).level);
            a.download = "certificate-of-exploration.png";
            a.click();
          }}
        >
          <input value={name} onChange={(e) => setLocalName(e.target.value)} maxLength={24} placeholder="Your name" aria-label="Name on the certificate" className="h-9 min-w-0 flex-1 rounded-full border border-line-strong bg-bg px-4 text-sm focus:border-accent focus:outline-none" />
          <button type="submit" className="press h-9 rounded-full bg-accent px-4 text-sm font-medium text-accent-ink">
            Download
          </button>
        </form>
      );
  }
}

export function AchievementsPanel() {
  const { progress, panelOpen, closePanel, reset, achievements, rewards } = useGame();
  const { level, progress: p, ceil, max } = levelFor(progress.xp);
  const list = achievements.filter((a) => a.enabled);
  const unlockedCount = list.filter((a) => progress.unlocked[a.id]).length;
  const [tab, setTab] = useState<"rewards" | "achievements">("rewards");

  return (
    <Sheet open={panelOpen} onClose={closePanel} label="Your progress">
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
          {unlockedCount} of {list.length} achievements. Saved automatically on this device with a cookie, no account needed.
        </p>
        <div className="mt-4 inline-flex rounded-full border border-line bg-bg p-1" role="tablist">
          {(["rewards", "achievements"] as const).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("rounded-full px-4 py-1.5 text-sm capitalize transition-colors", tab === t ? "bg-surface-2 text-fg" : "text-muted hover:text-fg")}>
              {t}
            </button>
          ))}
        </div>
      </div>
      {tab === "rewards" ? (
        <ul className="grid max-h-[50vh] gap-px overflow-y-auto bg-line">
          {rewards.length === 0 ? <li className="bg-surface p-6 text-sm text-muted">No rewards yet. Check back soon.</li> : null}
          {rewards.map((r) => (
            <li key={r.id} className="flex items-start gap-3 bg-surface p-4">
              <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", r.unlocked ? "bg-[#f6c177]/15 text-[#f6c177]" : "bg-surface-2 text-muted/60")}>
                {r.unlocked ? <Gift size={18} weight="fill" /> : <Lock size={18} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className={cn("font-medium tracking-tight", !r.unlocked && "text-fg/70")}>{r.title}</p>
                  <span className="shrink-0 font-mono text-xs text-muted">{r.xp > 0 ? `${r.xp} XP` : "all achievements"}</span>
                </div>
                <p className="text-sm text-muted">{r.description}</p>
                <RewardBody reward={r} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="grid max-h-[50vh] gap-px overflow-y-auto bg-line sm:grid-cols-2">
          {list.map((a) => {
            const done = Boolean(progress.unlocked[a.id]);
            return (
              <li key={a.id} className="flex items-start gap-3 bg-surface p-4">
                <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", done ? "bg-accent/15 text-accent" : "bg-surface-2 text-muted/60")}>
                  {done ? <Trophy size={18} weight="fill" /> : <Lock size={18} />}
                </span>
                <div className="min-w-0">
                  <p className={cn("font-medium tracking-tight", !done && "text-fg/60")}>{done || !a.secret ? a.title : "Secret achievement"}</p>
                  <p className="text-sm text-muted">{done || !a.secret ? a.hint : "Keep poking around."}</p>
                </div>
                <span className="ml-auto font-mono text-xs text-muted">+{a.xp}</span>
              </li>
            );
          })}
        </ul>
      )}
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
      { id: "resume", label: "Résumé & certifications", group: "Navigate", icon: Scroll, run: go("resume"), keywords: "cv experience education courses" },
      { id: "lab", label: "AI Lab: try my models", group: "Navigate", icon: Flask, run: go("lab"), keywords: "ai ml demo model" },
      { id: "videos", label: "Videos", group: "Navigate", icon: FilmSlate, run: go("videos"), keywords: "watch youtube" },
      { id: "skills", label: "Skills & classes", group: "Navigate", icon: Lightning, run: go("skills"), keywords: "python sql react ai ml" },
      { id: "journey", label: "Journey", group: "Navigate", icon: Path, run: go("journey") },
      { id: "work", label: "Projects", group: "Navigate", icon: Briefcase, run: go("work") },
      { id: "log", label: "Build log", group: "Navigate", icon: BookOpen, run: go("log"), keywords: "posts updates blog" },
      { id: "contact", label: "Contact", group: "Navigate", icon: ChatCircleText, run: go("contact"), keywords: "email message hire" },
      {
        id: "world",
        label: "Explore the City (open world)",
        group: "Fun",
        icon: GameController,
        run: () => {
          closePalette();
          router.push("/world");
        },
        keywords: "game character walk explore world 3d",
      },
      { id: "play", label: "Arcade: Snake, Breakout and more", group: "Fun", icon: GameController, run: go("play"), keywords: "game snake breakout flappy memory typing leaderboard" },
      {
        id: "achievements",
        label: "Rewards & achievements",
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
