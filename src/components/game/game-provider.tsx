"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Gift, Sparkle, Trophy } from "@phosphor-icons/react/dist/ssr";
import type { GameConfig, Reward } from "@/lib/site";
import { easeOut } from "@/lib/utils";
import { levelFor, questSections, resolveAchievements, resolveActivities, type AchievementId, type ActivityId, type ResolvedAchievement } from "./achievements";

const STORAGE_KEY = "ah-quest-v1";
/** Other local saves that travel with the visitor's progress (City save, character, arcade bests). */
const SYNC_KEYS = ["ah-city-v1", "ah-world-char", "ah-arcade-best"];

export type Progress = {
  xp: number;
  unlocked: Partial<Record<AchievementId, number>>;
  visited: string[];
  inspected: string[];
  played: string[];
  claimed: string[];
  name: string;
  cosmetic: string;
};

type Toast = { id: number; title: string; body: string; xp: number; kind: "achievement" | "level" | "reward" };

export type RewardState = Reward & { unlocked: boolean; progress: number };

type GameContextValue = {
  progress: Progress;
  ready: boolean;
  achievements: ResolvedAchievement[];
  rewards: RewardState[];
  unlock: (id: AchievementId) => void;
  addXp: (amount: number) => void;
  activity: (id: ActivityId) => number;
  inspect: (key: string, total: number) => void;
  played: (game: string) => void;
  setName: (name: string) => void;
  setCosmetic: (id: string) => void;
  openPanel: () => void;
  closePanel: () => void;
  panelOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
  paletteOpen: boolean;
  reset: () => void;
};

const empty: Progress = { xp: 0, unlocked: {}, visited: [], inspected: [], played: [], claimed: [], name: "", cosmetic: "" };
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

const union = (a: string[] = [], b: string[] = []) => Array.from(new Set([...a, ...b]));

function merge(a: Progress, b: Partial<Progress>): Progress {
  return {
    xp: Math.max(a.xp, Number(b.xp) || 0),
    unlocked: { ...b.unlocked, ...a.unlocked },
    visited: union(a.visited, b.visited),
    inspected: union(a.inspected, b.inspected),
    played: union(a.played, b.played),
    claimed: union(a.claimed, b.claimed),
    name: a.name || b.name || "",
    cosmetic: a.cosmetic || b.cosmetic || "",
  };
}

function rewardStates(rewards: Reward[], progress: Progress, achievements: ResolvedAchievement[]): RewardState[] {
  const enabled = achievements.filter((a) => a.enabled);
  const done = enabled.filter((a) => progress.unlocked[a.id]).length;
  return rewards
    .filter((r) => r.enabled)
    .map((r) => {
      const p = r.xp > 0 ? Math.min(1, progress.xp / r.xp) : enabled.length ? done / enabled.length : 1;
      return { ...r, unlocked: p >= 1, progress: p };
    })
    .sort((a, b) => (a.xp || 1e9) - (b.xp || 1e9));
}

export function GameProvider({ children, config }: { children: ReactNode; config?: GameConfig }) {
  const [progress, setProgress] = useState<Progress>(empty);
  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const progressRef = useRef(progress);
  const toastId = useRef(0);
  const syncTimer = useRef(0);

  const achievementList = useMemo(() => resolveAchievements(config?.achievements), [config?.achievements]);
  const activityXp = useMemo(() => resolveActivities(config?.achievements), [config?.achievements]);
  const rewardList = useMemo(() => config?.rewards ?? [], [config?.rewards]);

  const pushToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { ...toast, id }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const pushToServer = useCallback(() => {
    window.clearTimeout(syncTimer.current);
    syncTimer.current = window.setTimeout(() => {
      const keys: Record<string, string> = {};
      for (const k of SYNC_KEYS) {
        try {
          const v = window.localStorage.getItem(k);
          if (v && v.length < 12_000) keys[k] = v;
        } catch {}
      }
      void fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: progressRef.current, keys }),
        keepalive: true,
      }).catch(() => undefined);
    }, 1500);
  }, []);

  const commit = useCallback(
    (next: Progress) => {
      // rewards that just became available
      const states = rewardStates(rewardList, next, achievementList);
      const fresh = states.filter((r) => r.unlocked && !next.claimed.includes(r.id));
      if (fresh.length) {
        next = { ...next, claimed: [...next.claimed, ...fresh.map((r) => r.id)] };
        fresh.forEach((r, i) => window.setTimeout(() => pushToast({ title: r.title, body: "Open your progress panel to claim it.", xp: 0, kind: "reward" }), 900 + i * 500));
      }
      progressRef.current = next;
      setProgress(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      pushToServer();
    },
    [rewardList, achievementList, pushToast, pushToServer],
  );

  // load: local first, then merge whatever the server kept for this visitor's cookie
  useEffect(() => {
    let loaded = empty;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) loaded = merge(empty, JSON.parse(raw) as Progress);
    } catch {}
    progressRef.current = loaded;
    // localStorage is only readable after mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(loaded);
    setReady(true);

    let cancelled = false;
    fetch("/api/progress")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { progress?: Partial<Progress>; keys?: Record<string, string> } | null) => {
        if (cancelled || !data?.progress) return;
        const merged = merge(progressRef.current, data.progress);
        for (const [k, v] of Object.entries(data.keys ?? {})) {
          if (!SYNC_KEYS.includes(k)) continue;
          try {
            if (!window.localStorage.getItem(k)) window.localStorage.setItem(k, v);
          } catch {}
        }
        progressRef.current = merged;
        setProgress(merged);
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        } catch {}
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const addXp = useCallback(
    (amount: number) => {
      if (!amount) return;
      const current = progressRef.current;
      const before = levelFor(current.xp).level;
      const next = { ...current, xp: current.xp + amount };
      commit(next);
      const after = levelFor(next.xp).level;
      if (after > before) pushToast({ title: `Level ${after}`, body: "You levelled up. Keep exploring.", xp: 0, kind: "level" });
    },
    [commit, pushToast],
  );

  const unlock = useCallback(
    (id: AchievementId) => {
      const current = progressRef.current;
      if (current.unlocked[id]) return;
      const achievement = achievementList.find((a) => a.id === id);
      if (!achievement || !achievement.enabled) return;
      const before = levelFor(current.xp).level;
      const next = { ...current, xp: current.xp + achievement.xp, unlocked: { ...current.unlocked, [id]: Date.now() } };
      commit(next);
      pushToast({ title: achievement.title, body: achievement.hint, xp: achievement.xp, kind: "achievement" });
      const after = levelFor(next.xp).level;
      if (after > before) {
        window.setTimeout(() => pushToast({ title: `Level ${after}`, body: "You levelled up. Keep exploring.", xp: 0, kind: "level" }), 600);
      }
    },
    [achievementList, commit, pushToast],
  );

  const activity = useCallback(
    (id: ActivityId) => {
      const xp = activityXp[id] ?? 0;
      addXp(xp);
      return xp;
    },
    [activityXp, addXp],
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

  const played = useCallback(
    (game: string) => {
      const current = progressRef.current;
      if (!current.played.includes(game)) {
        const list = [...current.played, game];
        commit({ ...current, played: list });
        if (list.length >= 3) unlock("gamer");
      }
      activity("xp-game");
    },
    [commit, unlock, activity],
  );

  const setName = useCallback((name: string) => commit({ ...progressRef.current, name: name.slice(0, 24) }), [commit]);
  const setCosmetic = useCallback((id: string) => commit({ ...progressRef.current, cosmetic: id }), [commit]);

  // landing + section tracking
  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => unlock("hello"), 1200);
    const nodes = questSections.map((id) => document.getElementById(id)).filter((n): n is HTMLElement => Boolean(n));
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
      { threshold: 0.2 },
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

  const rewards = useMemo(() => rewardStates(rewardList, progress, achievementList), [rewardList, progress, achievementList]);

  const value = useMemo<GameContextValue>(
    () => ({
      progress,
      ready,
      achievements: achievementList,
      rewards,
      unlock,
      addXp,
      activity,
      inspect,
      played,
      setName,
      setCosmetic,
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
    [progress, ready, achievementList, rewards, unlock, addXp, activity, inspect, played, setName, setCosmetic, panelOpen, paletteOpen, commit],
  );

  return (
    <GameContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
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
              onClick={toast.kind === "reward" ? () => setPanelOpen(true) : undefined}
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
                      : toast.kind === "reward"
                        ? "grid size-10 shrink-0 place-items-center rounded-xl bg-[#f6c177]/20 text-[#f6c177]"
                        : "grid size-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent"
                  }
                >
                  {toast.kind === "level" ? <Sparkle size={20} weight="fill" /> : toast.kind === "reward" ? <Gift size={20} weight="fill" /> : <Trophy size={20} weight="fill" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">{toast.kind === "level" ? "Level up" : toast.kind === "reward" ? "Reward unlocked" : "Achievement unlocked"}</p>
                  <p className="mt-0.5 font-semibold tracking-tight">{toast.title}</p>
                  <p className="text-sm text-muted">{toast.body}</p>
                </div>
                {toast.xp ? <span className="rounded-full bg-accent px-2 py-0.5 font-mono text-xs font-semibold text-accent-ink">+{toast.xp}</span> : null}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </GameContext.Provider>
  );
}
