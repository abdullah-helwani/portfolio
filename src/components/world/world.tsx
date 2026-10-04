"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowFatLeft,
  ArrowFatRight,
  ArrowFatUp,
  CheckCircle,
  Circle,
  HandPointing,
  ListChecks,
  PencilSimple,
} from "@phosphor-icons/react/dist/ssr";
import { useGameOptional } from "@/components/game/game-provider";
import { levelFor } from "@/components/game/achievements";
import type { Content } from "@/lib/site";
import { cn, easeOut } from "@/lib/utils";
import { CharacterCreator, loadCharacter } from "./character-creator";
import {
  drawBackground,
  drawBit,
  drawDrone,
  drawGround,
  drawLamp,
  drawPlayer,
  drawPrompt,
  drawStation,
  makeBackground,
  type Character,
} from "./draw";
import { buildWorld, interactive, stationWidth, type Station } from "./layout";
import { WorldPanel } from "./world-panel";

const SPEED = 270;
const GRAVITY = 1900;
const JUMP = 740;
const PROGRESS_KEY = "ah-world-v1";

type Progress = { seen: string[]; bits: number[]; finished: boolean };
type Card = { id: number; title: string; kicker: string; body: string; color: string; chips?: string[] };
type Floater = { x: number; y: number; text: string; t: number; color: string };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string };

const promptLabel: Record<string, string> = {
  house: "Read about me",
  kiosk: "Inspect project",
  board: "Open the build log",
  arcade: "Play",
  mailbox: "Send a message",
};

function loadProgress(): Progress {
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (raw) return { seen: [], bits: [], finished: false, ...(JSON.parse(raw) as Partial<Progress>) };
  } catch {}
  return { seen: [], bits: [], finished: false };
}

export function World({ content }: { content: Content }) {
  const game = useGameOptional();
  const layout = useMemo(() => buildWorld(content), [content]);
  const bg = useMemo(() => makeBackground(layout.width), [layout.width]);

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [char, setChar] = useState<Character | null>(null);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [booted, setBooted] = useState(false);
  const [panel, setPanel] = useState<Station | "end" | null>(null);
  const [card, setCard] = useState<Card | null>(null);
  const [progress, setProgress] = useState<Progress>({ seen: [], bits: [], finished: false });
  const [playerPct, setPlayerPct] = useState(0);
  const [near, setNear] = useState<Station | null>(null);
  const [questsOpen, setQuestsOpen] = useState(true);

  const keys = useRef(new Set<string>());
  const jumpQueued = useRef(false);
  const player = useRef({ x: 90, h: 0, vx: 0, vy: 0, facing: 1 as 1 | -1, walk: 0 });
  const cam = useRef(0);
  const drone = useRef({ x: 40, y: 0 });
  const floaters = useRef<Floater[]>([]);
  const particles = useRef<Particle[]>([]);
  const progressRef = useRef(progress);
  const nearRef = useRef<Station | null>(null);
  const pausedRef = useRef(true);
  const charRef = useRef<Character | null>(null);
  const cardId = useRef(0);
  const fontRef = useRef("monospace");

  // ---- boot: restore character and progress ----
  useEffect(() => {
    const c = loadCharacter();
    const p = loadProgress();
    progressRef.current = p;
    charRef.current = c;
    // localStorage is only readable after mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(p);
    setChar(c);
    setCreatorOpen(!c);
    setBooted(true);
    const mono = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-mono").trim();
    if (mono) fontRef.current = mono;
  }, []);

  useEffect(() => {
    pausedRef.current = creatorOpen || panel !== null || !booted;
  }, [creatorOpen, panel, booted]);

  const saveProgress = useCallback((next: Progress) => {
    progressRef.current = next;
    setProgress(next);
    try {
      window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const float = useCallback((text: string, color = "#9ff0e0") => {
    const p = player.current;
    floaters.current.push({ x: p.x, y: p.h + 90, text, t: performance.now(), color });
  }, []);

  const burst = useCallback((x: number, h: number, color: string, count = 14) => {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 80 + Math.random() * 220;
      particles.current.push({ x, y: h, vx: Math.cos(a) * v, vy: Math.sin(a) * v + 120, life: 1, color });
    }
  }, []);

  const showCard = useCallback((c: Omit<Card, "id">) => {
    const id = ++cardId.current;
    setCard({ ...c, id });
    window.setTimeout(() => setCard((cur) => (cur?.id === id ? null : cur)), 5200);
  }, []);

  const markSeen = useCallback(
    (id: string, xp: number, label?: string) => {
      const cur = progressRef.current;
      if (cur.seen.includes(id)) return false;
      const next = { ...cur, seen: [...cur.seen, id] };
      saveProgress(next);
      game?.addXp(xp);
      float(`+${xp} XP${label ? ` · ${label}` : ""}`);
      // quest-level achievements
      const kiosks = layout.stations.filter((s) => s.kind === "kiosk").map((s) => s.id);
      if (kiosks.length && kiosks.every((k) => next.seen.includes(k))) game?.unlock("curator");
      return true;
    },
    [float, game, layout.stations, saveProgress],
  );

  const openStation = useCallback(
    (s: Station) => {
      setPanel(s);
      const xp = s.kind === "kiosk" ? 20 : s.kind === "house" ? 15 : 10;
      markSeen(s.id, xp);
    },
    [markSeen],
  );

  // ---- input ----
  useEffect(() => {
    const map: Record<string, string> = {
      ArrowLeft: "left",
      KeyA: "left",
      ArrowRight: "right",
      KeyD: "right",
      ArrowUp: "jump",
      KeyW: "jump",
      Space: "jump",
    };
    const down = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (pausedRef.current || typing) return;
      const action = map[e.code];
      if (action) {
        e.preventDefault();
        if (action === "jump") {
          if (!e.repeat) jumpQueued.current = true;
        } else keys.current.add(action);
      } else if (e.code === "KeyE" || e.code === "Enter") {
        const s = nearRef.current;
        if (s) {
          e.preventDefault();
          openStation(s);
        }
      }
    };
    const up = (e: KeyboardEvent) => {
      const action = map[e.code];
      if (action && action !== "jump") keys.current.delete(action);
    };
    const blur = () => keys.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [openStation]);

  // ---- game loop ----
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    const resize = () => {
      const r = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width;
      H = r.height;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let raf = 0;
    let last = performance.now();
    let hudTick = 0;
    const orbTotal = layout.stations.filter((s) => s.kind === "orb").length;

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const p = player.current;
      const ground = H - Math.max(84, H * 0.16);
      const paused = pausedRef.current;

      if (!paused) {
        const dir = (keys.current.has("right") ? 1 : 0) - (keys.current.has("left") ? 1 : 0);
        p.vx += (dir * SPEED - p.vx) * Math.min(1, dt * 12);
        p.x = Math.max(30, Math.min(layout.width - 30, p.x + p.vx * dt));
        if (jumpQueued.current && p.h === 0) p.vy = JUMP;
        jumpQueued.current = false;
        p.vy -= GRAVITY * dt;
        p.h = Math.max(0, p.h + p.vy * dt);
        if (p.h === 0) p.vy = 0;
        if (dir) p.facing = dir as 1 | -1;
        p.walk += Math.abs(p.vx) * dt;
      } else {
        p.vx = 0;
        jumpQueued.current = false;
      }

      const camTarget = Math.max(0, Math.min(layout.width - W, p.x - W * 0.38));
      cam.current += (camTarget - cam.current) * Math.min(1, dt * 6);
      const c = cam.current;

      // drone follows
      const d = drone.current;
      d.x += (p.x - p.facing * 46 - d.x) * Math.min(1, dt * 3);
      d.y += (p.h + 96 + Math.sin(now * 0.003) * 6 - d.y) * Math.min(1, dt * 4);

      // ---- collisions ----
      const pc = p.h + 32;
      const prog = progressRef.current;
      if (!paused) {
        for (const b of layout.bits) {
          if (prog.bits.includes(b.id)) continue;
          if (Math.abs(b.x - p.x) < 22 && Math.abs(b.lift - pc) < 36) {
            const next = { ...progressRef.current, bits: [...progressRef.current.bits, b.id] };
            saveProgress(next);
            game?.addXp(2);
            floaters.current.push({ x: b.x, y: b.lift + 20, text: "+2", t: now, color: "#9ff0e0" });
            burst(b.x, b.lift, "#9ff0e0", 8);
            if (next.bits.length >= 25) game?.unlock("collector");
          }
        }
        let nearest: Station | null = null;
        for (const s of layout.stations) {
          const dx = Math.abs(s.x - p.x);
          if (s.kind === "orb" && !prog.seen.includes(s.id) && dx < 28 && Math.abs(s.lift - pc) < 42) {
            markSeen(s.id, 10, "class");
            game?.inspect(s.skill.id, orbTotal);
            burst(s.x, s.lift, s.color, 22);
            showCard({
              title: s.skill.name,
              kicker: `Skill orb · Lv ${s.skill.level}`,
              body: s.skill.blurb,
              color: s.color,
              chips: s.skill.skills.map((k) => k.name),
            });
          } else if (s.kind === "post" && dx < 60 && !prog.seen.includes(s.id)) {
            markSeen(s.id, 5);
            showCard({ title: s.milestone.title, kicker: s.milestone.date, body: s.milestone.body, color: "#5fd6c0" });
          } else if (s.kind === "flag" && p.x > s.x - 24 && !prog.finished) {
            saveProgress({ ...progressRef.current, finished: true });
            game?.addXp(50);
            game?.unlock("world-walker");
            float("+50 XP · you made it!", "#f6c177");
            for (let i = 0; i < 4; i++) {
              window.setTimeout(() => burst(s.x + 40 + Math.random() * 80, 200 + Math.random() * 120, ["#5fd6c0", "#f0773f", "#a9b8ff", "#f6c177"][i], 30), i * 220);
            }
            window.setTimeout(() => setPanel("end"), 1400);
          }
          if (interactive.has(s.kind) && dx < stationWidth(s) / 2 + 30) nearest = s;
        }
        if (nearest !== nearRef.current) {
          nearRef.current = nearest;
          setNear(nearest);
        }
      }

      // ---- draw ----
      drawBackground(ctx, bg, c, W, H, ground, now);
      for (const lx of layout.lamps) {
        const sx = lx - c;
        if (sx > -150 && sx < W + 150) drawLamp(ctx, sx, ground);
      }
      drawGround(ctx, c, W, H, ground);
      for (const s of layout.stations) {
        const sx = s.x - c;
        if (sx < -320 || sx > W + 320) continue;
        drawStation(ctx, s, sx, ground, now, {
          near: nearRef.current === s,
          done: s.kind === "flag" ? prog.finished : prog.seen.includes(s.id),
          font: fontRef.current,
          serif: "serif",
        });
      }
      for (const b of layout.bits) {
        if (prog.bits.includes(b.id)) continue;
        const sx = b.x - c;
        if (sx < -20 || sx > W + 20) continue;
        drawBit(ctx, sx, ground - b.lift, now);
      }

      const moving = Math.abs(p.vx) > 20;
      const frames = ["strideA", "pass", "strideB", "pass"];
      const frameName = p.h > 0 ? "jump" : moving ? frames[Math.floor(p.walk / 26) % 4] : "stand";
      const ch = charRef.current ?? { name: "Visitor", color: "#5fd6c0", accessory: "none" as const };
      drawPlayer(
        ctx,
        p.x - c,
        ground - p.h,
        ch,
        { facing: p.facing, frame: frameName, bob: !moving && p.h === 0 ? Math.round(Math.sin(now * 0.004)) * 2 : 0, airborne: p.h > 0 },
        fontRef.current,
      );
      drawDrone(ctx, d.x - c, ground - d.y, now, p.facing);

      const ns = nearRef.current;
      if (ns && !paused) {
        drawPrompt(ctx, ns.x - c, ground - (ns.kind === "house" ? 250 : ns.kind === "mailbox" ? 150 : 218), promptLabel[ns.kind] ?? "Open", fontRef.current, now);
      }

      // particles
      particles.current = particles.current.filter((pt) => pt.life > 0);
      for (const pt of particles.current) {
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.vy -= 500 * dt;
        pt.life -= dt * 1.4;
        ctx.globalAlpha = Math.max(0, pt.life);
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x - c - 2, ground - pt.y - 2, 4, 4);
      }
      ctx.globalAlpha = 1;

      // floating text
      floaters.current = floaters.current.filter((f) => now - f.t < 1300);
      ctx.font = `700 13px ${fontRef.current}`;
      ctx.textAlign = "center";
      for (const f of floaters.current) {
        const k = (now - f.t) / 1300;
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, f.x - c, ground - f.y - k * 50);
      }
      ctx.globalAlpha = 1;

      hudTick += dt;
      if (hudTick > 0.12) {
        hudTick = 0;
        setPlayerPct(p.x / layout.width);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [bg, burst, float, game, layout, markSeen, saveProgress, showCard]);

  // ---- quests ----
  const orbs = layout.stations.filter((s) => s.kind === "orb");
  const kiosks = layout.stations.filter((s) => s.kind === "kiosk");
  const count = (ids: { id: string }[]) => ids.filter((s) => progress.seen.includes(s.id)).length;
  const quests = [
    { label: "Visit the About house", done: progress.seen.includes("about") },
    { label: `Collect the skill orbs`, done: count(orbs) === orbs.length, n: `${count(orbs)}/${orbs.length}` },
    { label: `Inspect every project`, done: count(kiosks) === kiosks.length, n: `${count(kiosks)}/${kiosks.length}` },
    { label: "Read the build log", done: progress.seen.includes("log") },
    { label: "Find the mailbox", done: progress.seen.includes("contact") },
    { label: "Collect 25 bits", done: progress.bits.length >= 25, n: `${Math.min(progress.bits.length, 25)}/25` },
    { label: "Reach the end of the world", done: progress.finished },
  ];
  const questsDone = quests.filter((q) => q.done).length;
  const lvl = levelFor(game?.progress.xp ?? 0);

  const setHeld = useCallback((action: string, down: boolean) => {
    if (action === "jump") {
      if (down) jumpQueued.current = true;
    } else if (down) keys.current.add(action);
    else keys.current.delete(action);
  }, []);
  const interact = useCallback(() => {
    if (nearRef.current) openStation(nearRef.current);
  }, [openStation]);

  const markerColor: Record<string, string> = {
    house: "#f0773f",
    orb: "#a9b8ff",
    kiosk: "#5fd6c0",
    board: "#f6c177",
    mailbox: "#e58fb6",
    flag: "#e8eeec",
  };

  return (
    <div ref={wrapRef} className="relative h-[100dvh] min-h-[560px] w-full select-none overflow-hidden bg-bg">
      <canvas ref={canvasRef} className="absolute inset-0 block" aria-label="A side-scrolling world you can walk through" role="img" />

      {/* HUD: player */}
      <div className="pointer-events-none absolute left-4 top-24 z-10 md:left-6">
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-line-strong bg-bg/70 p-2.5 pr-4 backdrop-blur-md">
          <span className="grid size-10 place-items-center rounded-xl font-mono text-sm font-semibold text-accent-ink" style={{ background: char?.color ?? "#5fd6c0" }}>
            {lvl.level}
          </span>
          <div className="min-w-[140px]">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold tracking-tight">{char?.name || "Visitor"}</p>
              <button
                type="button"
                onClick={() => setCreatorOpen(true)}
                aria-label="Edit character"
                className="grid size-6 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-fg"
              >
                <PencilSimple size={13} />
              </button>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <motion.div
                className="h-full origin-left rounded-full bg-accent"
                animate={{ transform: `scaleX(${lvl.progress})` }}
                transition={{ duration: 0.6, ease: easeOut }}
              />
            </div>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
              {game?.progress.xp ?? 0} xp · {progress.bits.length} bits
            </p>
          </div>
        </div>
      </div>

      {/* HUD: quests */}
      <div className="absolute right-4 top-24 z-10 w-[min(280px,calc(100vw-2rem))] md:right-6">
        <button
          type="button"
          onClick={() => setQuestsOpen((o) => !o)}
          aria-expanded={questsOpen}
          className="flex w-full items-center justify-between rounded-2xl border border-line-strong bg-bg/70 px-4 py-3 text-sm font-medium backdrop-blur-md"
        >
          <span className="flex items-center gap-2">
            <ListChecks size={16} className="text-accent" /> Quests
          </span>
          <span className="font-mono text-xs text-muted">
            {questsDone}/{quests.length}
          </span>
        </button>
        <AnimatePresence initial={false}>
          {questsOpen ? (
            <motion.ul
              initial={{ opacity: 0, transform: "translateY(-6px)" }}
              animate={{ opacity: 1, transform: "translateY(0px)" }}
              exit={{ opacity: 0, transform: "translateY(-6px)", transition: { duration: 0.15 } }}
              className="mt-2 hidden space-y-1 rounded-2xl border border-line bg-bg/70 p-3 backdrop-blur-md sm:block"
            >
              {quests.map((q) => (
                <li key={q.label} className={cn("flex items-center gap-2 text-[13px]", q.done ? "text-fg/50 line-through" : "text-fg/85")}>
                  {q.done ? <CheckCircle size={15} weight="fill" className="shrink-0 text-accent" /> : <Circle size={15} className="shrink-0 text-muted" />}
                  <span className="flex-1">{q.label}</span>
                  {q.n && !q.done ? <span className="font-mono text-[11px] text-muted">{q.n}</span> : null}
                </li>
              ))}
            </motion.ul>
          ) : null}
        </AnimatePresence>
      </div>

      {/* auto card (orbs, journey) */}
      <AnimatePresence>
        {card ? (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, transform: "translateY(16px) scale(0.97)" }}
            animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
            exit={{ opacity: 0, transform: "translateY(10px)", transition: { duration: 0.2 } }}
            transition={{ duration: 0.4, ease: easeOut }}
            className="absolute left-4 top-48 z-10 w-[min(340px,calc(100vw-2rem))] rounded-2xl border border-line-strong bg-surface/90 p-5 backdrop-blur-xl md:left-6"
          >
            <span className="absolute inset-y-4 left-0 w-1 rounded-r-full" style={{ background: card.color }} />
            <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: card.color }}>
              {card.kicker}
            </p>
            <p className="mt-1 text-lg font-semibold tracking-tight">{card.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{card.body}</p>
            {card.chips?.length ? (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {card.chips.map((c) => (
                  <li key={c} className="rounded-full border border-line px-2 py-0.5 text-[11px] text-fg/75">
                    {c}
                  </li>
                ))}
              </ul>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* minimap */}
      <div className="absolute inset-x-0 bottom-5 z-10 flex justify-center px-4 max-md:bottom-28">
        <div className="w-[min(440px,100%)] rounded-full border border-line-strong bg-bg/70 px-4 py-2.5 backdrop-blur-md">
          <div className="relative h-2">
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line-strong" />
            <div className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-accent" style={{ width: `${playerPct * 100}%` }} />
            {layout.stations
              .filter((s) => markerColor[s.kind])
              .map((s) => (
                <span
                  key={s.id}
                  className={cn("absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full", progress.seen.includes(s.id) && "opacity-40")}
                  style={{ left: `${(s.x / layout.width) * 100}%`, background: markerColor[s.kind] }}
                />
              ))}
            <span
              className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg"
              style={{ left: `${playerPct * 100}%`, background: char?.color ?? "#5fd6c0" }}
            />
          </div>
        </div>
      </div>

      {/* desktop controls hint */}
      <p className="pointer-events-none absolute bottom-6 left-6 z-10 hidden font-mono text-[11px] uppercase tracking-[0.15em] text-muted lg:block">
        ← → move · space jump · e interact
      </p>

      {/* touch controls */}
      <div className="absolute inset-x-0 bottom-4 z-10 flex items-end justify-between px-4 [@media(pointer:fine)]:hidden">
        <div className="flex gap-2">
          <TouchButton label="Move left" action="left" onHold={setHeld}>
            <ArrowFatLeft size={24} weight="fill" />
          </TouchButton>
          <TouchButton label="Move right" action="right" onHold={setHeld}>
            <ArrowFatRight size={24} weight="fill" />
          </TouchButton>
        </div>
        <div className="flex gap-2">
          <TouchButton label="Interact" action="interact" disabled={!near} onHold={(_, down) => down && interact()}>
            <HandPointing size={24} weight="fill" />
          </TouchButton>
          <TouchButton label="Jump" action="jump" onHold={setHeld} accent>
            <ArrowFatUp size={24} weight="fill" />
          </TouchButton>
        </div>
      </div>

      <AnimatePresence>
        {panel ? (
          <WorldPanel
            key={typeof panel === "string" ? panel : panel.id}
            station={panel}
            content={content}
            stats={{ xp: game?.progress.xp ?? 0, bits: progress.bits.length, seen: progress.seen.length, quests: questsDone, totalQuests: quests.length }}
            onClose={() => setPanel(null)}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {creatorOpen ? (
          <CharacterCreator
            initial={char}
            onDone={(c) => {
              charRef.current = c;
              setChar(c);
              setCreatorOpen(false);
              game?.unlock("character");
            }}
            onCancel={char ? () => setCreatorOpen(false) : undefined}
          />
        ) : null}
      </AnimatePresence>

      <noscript>
        <div className="absolute inset-0 grid place-items-center p-8 text-center">
          The World needs JavaScript. <Link href="/">Head back to the main site</Link>.
        </div>
      </noscript>
    </div>
  );
}

function TouchButton({
  label,
  action,
  onHold,
  children,
  accent,
  disabled,
}: {
  label: string;
  action: string;
  onHold: (action: string, down: boolean) => void;
  children: React.ReactNode;
  accent?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onPointerDown={(e) => {
        e.preventDefault();
        onHold(action, true);
      }}
      onPointerUp={() => onHold(action, false)}
      onPointerLeave={() => onHold(action, false)}
      onPointerCancel={() => onHold(action, false)}
      className={cn(
        "grid size-16 touch-none place-items-center rounded-2xl border border-line-strong backdrop-blur-md transition-[opacity,background-color] duration-150 active:scale-95 disabled:opacity-30",
        accent ? "bg-accent/90 text-accent-ink" : "bg-bg/70 text-fg active:bg-surface-2",
      )}
    >
      {children}
    </button>
  );
}
