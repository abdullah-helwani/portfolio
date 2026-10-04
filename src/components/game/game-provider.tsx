"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { Trophy, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { achievements, levelFor, questSections, type AchievementId } from "./achievements";
import { easeOut } from "@/lib/utils";

const STORAGE_KEY = "ah-quest-v1";

type Progress = {
  xp: number;
  unlocked: Partial<Record<AchievementId, number>>;
  visited: string[];
  inspected: string[];
};

type Toast = { id: number; title: string; body: string; xp: number; kind: "achievement" | "level" };

type GameContextValue = {
  progress: Progress;
  ready: boolean;
  unlock: (id: AchievementId) => void;
  addXp: (amount: number) => void;
  inspect: (key: string, total: number) => void;
  openPanel: () => void;
  closePanel: () => void;
  panelOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
  paletteOpen: boolean;
  reset: () => void;
};

const empty: Progress = { xp: 0, unlocked: {}, visited: [], inspected: [] };
const GameContext = createContext<GameContextValue | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside <GameProvider>");
  return ctx;
}

/** Safe variant for components that may render outside the provider (e.g. the dashboard). */
export function useGameOptional() {
  return useContext(GameContext);
}

const konami = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "KeyB", "KeyA"];

export function GameProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(empty);
  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const progressRef = useRef(progress);
  const toastId = useRef(0);

  // load
  useEffect(() => {
    let loaded = empty;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) loaded = { ...empty, ...(JSON.parse(raw) as Progress) };
    } catch {}
    progressRef.current = loaded;
    // localStorage is only readable after mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(loaded);
    setReady(true);
  }, []);

  const pushToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { ...toast, id }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const commit = useCallback((next: Progress) => {
    progressRef.current = next;
    setProgress(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const unlock = useCallback(
    (id: AchievementId) => {
      const current = progressRef.current;
      if (current.unlocked[id]) return;
      const achievement = achievements.find((a) => a.id === id);
      if (!achievement) return;
      const before = levelFor(current.xp).level;
      const next = { ...current, xp: current.xp + achievement.xp, unlocked: { ...current.unlocked, [id]: Date.now() } };
      commit(next);
      pushToast({ title: achievement.title, body: achievement.hint, xp: achievement.xp, kind: "achievement" });
      const after = levelFor(next.xp).level;
      if (after > before) {
        window.setTimeout(
          () => pushToast({ title: `Level ${after}`, body: "You levelled up. Keep exploring.", xp: 0, kind: "level" }),
          600,
        );
      }
    },
    [commit, pushToast],
  );

  const addXp = useCallback(
    (amount: number) => {
      const current = progressRef.current;
      const before = levelFor(current.xp).level;
      const next = { ...current, xp: current.xp + amount };
      commit(next);
      const after = levelFor(next.xp).level;
      if (after > before) pushToast({ title: `Level ${after}`, body: "You levelled up. Keep exploring.", xp: 0, kind: "level" });
    },
    [commit, pushToast],
  );

  const inspect = useCallback(
    (key: string, total: number) => {
      const current = progressRef.current;
      if (current.inspected.includes(key)) return;
      const inspected = [...current.inspected, key];
      commit({ ...current, inspected });
      if (inspected.length >= 3) unlock("inspector");
      if (inspected.length >= total) unlock("skill-master");
    },
    [commit, unlock],
  );

  // landing + section tracking
  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => unlock("hello"), 1200);
    const nodes = questSections
      .map((id) => document.getElementById(id))
      .filter((n): n is HTMLElement => Boolean(n));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.id;
          const current = progressRef.current;
          if (current.visited.includes(id)) continue;
          const visited = [...current.visited, id];
          commit({ ...current, visited });
          if (nodes.every((n) => visited.includes(n.id))) unlock("explorer");
        }
      },
      { threshold: 0.25 },
    );
    nodes.forEach((n) => observer.observe(n));

    const footer = document.querySelector("footer");
    const bottomObserver = new IntersectionObserver(([e]) => e?.isIntersecting && unlock("bottom"), { threshold: 0.5 });
    if (footer) bottomObserver.observe(footer);

    return () => {
      window.clearTimeout(t);
      observer.disconnect();
      bottomObserver.disconnect();
    };
  }, [ready, commit, unlock]);

  // global keys: konami + command palette
  useEffect(() => {
    let seq: string[] = [];
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((o) => !o);
        unlock("palette");
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      seq = [...seq, event.code].slice(-konami.length);
      if (seq.join() === konami.join()) unlock("konami");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [unlock]);

  // external github clicks anywhere on the page
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const a = (event.target as HTMLElement | null)?.closest("a");
      if (a?.href.includes("github.com")) unlock("github");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [unlock]);

  const value = useMemo<GameContextValue>(
    () => ({
      progress,
      ready,
      unlock,
      addXp,
      inspect,
      panelOpen,
      openPanel: () => setPanelOpen(true),
      closePanel: () => setPanelOpen(false),
      paletteOpen,
      openPalette: () => {
        setPaletteOpen(true);
        unlock("palette");
      },
      closePalette: () => setPaletteOpen(false),
      reset: () => commit(empty),
    }),
    [progress, ready, unlock, addXp, inspect, panelOpen, paletteOpen, commit],
  );

  return (
    <GameContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, transform: "translateY(24px) scale(0.96)" }}
              animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
              exit={{ opacity: 0, transform: "translateX(40px) scale(0.98)", transition: { duration: 0.2 } }}
              transition={{ duration: 0.45, ease: easeOut }}
              className="pointer-events-auto relative overflow-hidden rounded-2xl border border-line-strong bg-surface/95 p-4 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.9)] backdrop-blur-xl"
            >
              <motion.div
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-accent/15 to-transparent"
                initial={{ transform: "translateX(-100%)" }}
                animate={{ transform: "translateX(0%)" }}
                transition={{ duration: 0.9, ease: easeOut }}
              />
              <div className="relative flex items-start gap-3">
                <span
                  className={
                    toast.kind === "level"
                      ? "grid size-10 shrink-0 place-items-center rounded-xl bg-ember/20 text-ember"
                      : "grid size-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent"
                  }
                >
                  {toast.kind === "level" ? <Sparkle size={20} weight="fill" /> : <Trophy size={20} weight="fill" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                    {toast.kind === "level" ? "Level up" : "Achievement unlocked"}
                  </p>
                  <p className="mt-0.5 font-semibold tracking-tight">{toast.title}</p>
                  <p className="text-sm text-muted">{toast.body}</p>
                </div>
                {toast.xp ? (
                  <span className="rounded-full bg-accent px-2 py-0.5 font-mono text-xs font-semibold text-accent-ink">
                    +{toast.xp}
                  </span>
                ) : null}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </GameContext.Provider>
  );
}
