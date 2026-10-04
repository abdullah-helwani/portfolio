"use client";
/* eslint-disable react-hooks/immutability -- `runtime` is the game loop's mutable state (like a ref): input, camera and player data are written from events and read every frame without re-rendering. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowFatUp,
  ArrowsClockwise,
  CaretDown,
  CheckCircle,
  Circle,
  Cpu,
  HandPointing,
  ListChecks,
  Moon,
  PencilSimple,
  PersonSimpleRun,
  Sun,
} from "@phosphor-icons/react/dist/ssr";
import { levelFor } from "@/components/game/achievements";
import { useGameOptional } from "@/components/game/game-provider";
import type { Content } from "@/lib/site";
import { cn, easeOut } from "@/lib/utils";
import { CharacterCreator, loadCharacter, lookFor, type Character } from "./character-creator";
import { CityPanel, type PanelTarget } from "./city-panel";
import { FullMap, Joystick, Minimap, type Marker } from "./hud";
import { buildCity, districtInfo, type District, type Station } from "./layout";
import { createRuntime } from "./runtime";
import type { Quality } from "./scene";

const CityScene = dynamic(() => import("./scene"), { ssr: false });

const SAVE_KEY = "ah-city-v1";
type Save = { taken: string[]; bits: number[]; talked: number[]; districts: string[]; pos?: { x: number; z: number }; night?: boolean };

function loadSave(): Save {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (raw) return { taken: [], bits: [], talked: [], districts: [], ...(JSON.parse(raw) as Partial<Save>) };
  } catch {}
  return { taken: [], bits: [], talked: [], districts: [] };
}

type Card = { id: number; kicker: string; title: string; body: string; color: string; chips?: string[] };
type Pop = { id: number; text: string };

const verbs: Record<Station["kind"], string> = {
  house: "Enter",
  kiosk: "Inspect",
  board: "Read",
  arcade: "Play",
  mailbox: "Write a letter",
};

export function City({ content }: { content: Content }) {
  const game = useGameOptional();
  const plan = useMemo(() => buildCity(content), [content]);
  const runtime = useMemo(() => createRuntime(), []);
  const wrap = useRef<HTMLDivElement>(null);

  const [char, setChar] = useState<Character | null>(null);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [booted, setBooted] = useState(false);
  const [ready, setReady] = useState(false);
  const [night, setNight] = useState(true);
  const [quality, setQuality] = useState<Quality>("high");
  const [panel, setPanel] = useState<PanelTarget | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [questsOpen, setQuestsOpen] = useState(true);
  const [near, setNear] = useState<Station | null>(null);
  const [banner, setBanner] = useState<{ id: number; district: District } | null>(null);
  const [card, setCard] = useState<Card | null>(null);
  const [pops, setPops] = useState<Pop[]>([]);
  const [taken, setTaken] = useState<Set<string>>(new Set());
  const [bitsCount, setBitsCount] = useState(0);
  const [talkedCount, setTalkedCount] = useState(0);
  const [districts, setDistricts] = useState<Set<string>>(new Set());
  const [hudPos, setHudPos] = useState({ x: 0, z: 9, heading: Math.PI });
  const ids = useRef(0);
  const districtsRef = useRef<Set<string>>(new Set());

  // ---------- boot ----------
  useEffect(() => {
    const save = loadSave();
    const c = loadCharacter();
    runtime.taken = new Set(save.taken);
    runtime.bits = new Set(save.bits);
    runtime.talked = new Set(save.talked);
    districtsRef.current = new Set(save.districts);
    if (save.pos) {
      runtime.player.x = save.pos.x;
      runtime.player.z = save.pos.z;
    }
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    // restoring saved state is only possible after mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTaken(new Set(save.taken));
    setBitsCount(save.bits.length);
    setTalkedCount(save.talked.length);
    setDistricts(new Set(save.districts));
    if (typeof save.night === "boolean") setNight(save.night);
    if (coarse) runtime.cam.dist = 28;
    if (coarse || (navigator.hardwareConcurrency ?? 8) <= 4) setQuality("low");
    setChar(c);
    setCreatorOpen(!c);
    setBooted(true);
  }, [runtime]);

  const persist = useCallback(() => {
    const save: Save = {
      taken: [...runtime.taken],
      bits: [...runtime.bits],
      talked: [...runtime.talked],
      districts: [...districtsRef.current],
      pos: { x: runtime.player.x, z: runtime.player.z },
      night,
    };
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch {}
  }, [runtime, night]);

  useEffect(() => {
    const t = window.setInterval(persist, 2000);
    window.addEventListener("beforeunload", persist);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("beforeunload", persist);
    };
  }, [persist]);

  const pop = useCallback((text: string) => {
    const id = ++ids.current;
    setPops((p) => [...p.slice(-3), { id, text }]);
    window.setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 1600);
  }, []);

  const reward = useCallback(
    (xp: number, label: string) => {
      game?.addXp(xp);
      pop(`+${xp} XP · ${label}`);
    },
    [game, pop],
  );

  const showCard = useCallback((c: Omit<Card, "id">) => {
    const id = ++ids.current;
    setCard({ ...c, id });
    window.setTimeout(() => setCard((cur) => (cur?.id === id ? null : cur)), 6000);
  }, []);

  const markTaken = useCallback(
    (id: string, xp: number, label: string) => {
      runtime.taken.add(id);
      setTaken(new Set(runtime.taken));
      reward(xp, label);
      const towers = plan.stations.filter((s) => s.kind === "kiosk").map((s) => s.id);
      if (towers.length && towers.every((t) => runtime.taken.has(t))) game?.unlock("curator");
      persist();
      return true;
    },
    [game, persist, plan.stations, reward, runtime],
  );

  const openStation = useCallback(
    (s: Station) => {
      setPanel(s);
      if (!runtime.taken.has(s.id)) {
        const xp = s.kind === "kiosk" ? 20 : s.kind === "house" ? 15 : 10;
        markTaken(s.id, xp, s.label);
      }
    },
    [markTaken, runtime],
  );

  // ---------- events from the 3D scene ----------
  useEffect(() => {
    runtime.events = {
      onNear: (s) => setNear(s),
      onBit: () => {
        setBitsCount(runtime.bits.size);
        game?.addXp(2);
        pop("+2 XP · bit");
        if (runtime.bits.size >= 25) game?.unlock("collector");
      },
      onOrb: (id) => {
        const orb = plan.orbs.find((o) => o.id === id);
        if (!orb) return;
        setTaken(new Set(runtime.taken));
        reward(10, "class orb");
        game?.inspect(orb.skill.id, plan.orbs.length);
        showCard({
          kicker: `Class orb · Lv ${orb.skill.level}`,
          title: orb.skill.name,
          body: orb.skill.blurb,
          color: orb.color,
          chips: orb.skill.skills.map((s) => s.name),
        });
        persist();
      },
      onMonument: (id) => {
        const m = plan.monuments.find((x) => x.id === id);
        if (!m) return;
        setTaken(new Set(runtime.taken));
        reward(5, "memory");
        showCard({ kicker: m.milestone.date, title: m.milestone.title, body: m.milestone.body, color: "#8fd16b" });
        persist();
      },
      onDistrict: (d) => {
        if (!d) return;
        setBanner({ id: ++ids.current, district: d });
        if (!districtsRef.current.has(d)) {
          districtsRef.current.add(d);
          setDistricts(new Set(districtsRef.current));
          if (d !== "downtown") reward(10, "new district");
          const all = new Set(plan.blocks.map((b) => b.district));
          if ([...all].every((x) => districtsRef.current.has(x))) {
            game?.unlock("world-walker");
            window.setTimeout(() => setPanel("end"), 1200);
          }
          persist();
        }
      },
      onTalk: (id) => {
        if (runtime.talked.has(id)) return;
        runtime.talked.add(id);
        setTalkedCount(runtime.talked.size);
        reward(5, "new friend");
      },
    };
  }, [game, persist, plan, pop, reward, runtime, showCard]);

  // banner auto-hide
  useEffect(() => {
    if (!banner) return;
    const t = window.setTimeout(() => setBanner(null), 3600);
    return () => window.clearTimeout(t);
  }, [banner]);

  // pause while menus are open
  useEffect(() => {
    runtime.paused = !booted || !ready || creatorOpen || panel !== null || mapOpen;
    if (runtime.paused) runtime.keys.clear();
  }, [booted, ready, creatorOpen, panel, mapOpen, runtime]);

  // HUD position sampling (minimap)
  useEffect(() => {
    const t = window.setInterval(() => setHudPos({ x: runtime.player.x, z: runtime.player.z, heading: runtime.player.heading }), 120);
    return () => window.clearInterval(t);
  }, [runtime]);

  // ---------- keyboard ----------
  useEffect(() => {
    const map: Record<string, string> = {
      KeyW: "forward",
      ArrowUp: "forward",
      KeyS: "back",
      ArrowDown: "back",
      KeyA: "left",
      ArrowLeft: "left",
      KeyD: "right",
      ArrowRight: "right",
      ShiftLeft: "sprint",
      ShiftRight: "sprint",
    };
    const down = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === "KeyM") {
        setMapOpen((o) => !o);
        return;
      }
      if (runtime.paused) return;
      const action = map[e.code];
      if (action) {
        e.preventDefault();
        runtime.keys.add(action);
      } else if (e.code === "Space") {
        e.preventDefault();
        if (!e.repeat) runtime.jumpQueued = true;
      } else if (e.code === "KeyE" || e.code === "Enter") {
        if (runtime.near) {
          e.preventDefault();
          openStation(runtime.near);
        }
      } else if (e.code === "KeyC") {
        runtime.cam.yaw = runtime.player.heading + Math.PI;
      } else if (e.code === "KeyQ") {
        runtime.cam.yaw += 0.35;
      } else if (e.code === "KeyR") {
        runtime.cam.yaw -= 0.35;
      }
    };
    const up = (e: KeyboardEvent) => {
      const action = map[e.code];
      if (action) runtime.keys.delete(action);
    };
    const blur = () => runtime.keys.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [openStation, runtime]);

  // ---------- camera: drag to orbit, wheel to zoom ----------
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let dragging = false;
    let lx = 0;
    let ly = 0;
    const downH = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("[data-hud]")) return;
      dragging = true;
      lx = e.clientX;
      ly = e.clientY;
    };
    const moveH = (e: PointerEvent) => {
      if (!dragging) return;
      runtime.cam.yaw -= (e.clientX - lx) * 0.006;
      runtime.cam.pitch = Math.max(0.22, Math.min(1.15, runtime.cam.pitch + (e.clientY - ly) * 0.004));
      lx = e.clientX;
      ly = e.clientY;
    };
    const upH = () => (dragging = false);
    const wheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest("[data-hud]")) return;
      e.preventDefault();
      runtime.cam.dist = Math.max(8, Math.min(40, runtime.cam.dist + e.deltaY * 0.02));
    };
    el.addEventListener("pointerdown", downH);
    window.addEventListener("pointermove", moveH);
    window.addEventListener("pointerup", upH);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", downH);
      window.removeEventListener("pointermove", moveH);
      window.removeEventListener("pointerup", upH);
      el.removeEventListener("wheel", wheel);
    };
  }, [runtime]);

  // ---------- derived HUD data ----------
  const orbs = plan.orbs;
  const towers = plan.stations.filter((s) => s.kind === "kiosk");
  const count = (list: { id: string }[]) => list.filter((x) => taken.has(x.id)).length;
  const allDistricts = useMemo(() => [...new Set(plan.blocks.map((b) => b.district))], [plan.blocks]);
  const quests = [
    { label: "Visit the Helwani Residence", done: taken.has("about") },
    { label: "Collect the class orbs", n: `${count(orbs)}/${orbs.length}`, done: count(orbs) === orbs.length },
    { label: "Inspect every project tower", n: `${count(towers)}/${towers.length}`, done: towers.length > 0 && count(towers) === towers.length },
    { label: "Read the Journey monuments", n: `${count(plan.monuments)}/${plan.monuments.length}`, done: count(plan.monuments) === plan.monuments.length },
    { label: "Read the Daily Log", done: taken.has("log") },
    { label: "Play at the arcade", done: taken.has("arcade") },
    { label: "Write a letter at the Post Office", done: taken.has("contact") },
    { label: "Chat with 3 citizens", n: `${Math.min(talkedCount, 3)}/3`, done: talkedCount >= 3 },
    { label: "Collect 25 bits", n: `${Math.min(bitsCount, 25)}/25`, done: bitsCount >= 25 },
    { label: "Visit every district", n: `${allDistricts.filter((d) => districts.has(d)).length}/${allDistricts.length}`, done: allDistricts.every((d) => districts.has(d)) },
  ];
  const doneCount = quests.filter((q) => q.done).length;
  const lvl = levelFor(game?.progress.xp ?? 0);

  const markers: Marker[] = useMemo(
    () => [
      { id: "plaza", x: 0, z: 0, color: "#5fd6c0", label: "Central Plaza", done: false },
      ...plan.stations.map((s) => ({
        id: s.id,
        x: s.x,
        z: s.z,
        color: s.kind === "kiosk" ? s.color : districtInfo[s.kind === "house" ? "about" : s.kind === "board" ? "news" : s.kind === "arcade" ? "arcade" : "post"].color,
        label: s.label,
        done: taken.has(s.id),
      })),
      { id: "academy", x: 40, z: 3, color: "#a9b8ff", label: "Skill Academy", done: orbs.every((o) => taken.has(o.id)) },
      { id: "park", x: 0, z: 40, color: "#8fd16b", label: "Journey Park", done: plan.monuments.every((m) => taken.has(m.id)) },
    ],
    [orbs, plan.monuments, plan.stations, taken],
  );

  const travel = (m: Marker) => {
    runtime.player.x = m.x;
    runtime.player.z = m.z + (m.id === "plaza" ? 9 : m.id === "academy" || m.id === "park" ? 12 : 2);
    runtime.player.heading = Math.PI;
    runtime.cam.yaw = 0;
    setMapOpen(false);
  };

  const setJump = () => {
    runtime.jumpQueued = true;
  };

  return (
    <div ref={wrap} className="relative h-[100dvh] min-h-[560px] w-full select-none overflow-hidden bg-[#070b10] touch-none">
      {booted ? (
        <CityScene
          plan={plan}
          content={content}
          look={lookFor(char)}
          seen={taken}
          runtime={runtime}
          night={night}
          quality={quality}
          onReady={() => window.setTimeout(() => setReady(true), 400)}
        />
      ) : null}

      {/* loading */}
      <AnimatePresence>
        {!ready ? (
          <motion.div
            className="absolute inset-0 z-40 grid place-items-center bg-[#070b10]"
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
          >
            <div className="text-center">
              <div className="mx-auto flex h-16 items-end justify-center gap-1.5">
                {[28, 44, 36, 60, 30, 50, 40].map((h, i) => (
                  <motion.span
                    key={i}
                    className="w-3 rounded-t-sm bg-accent/70"
                    initial={{ height: 4 }}
                    animate={{ height: h }}
                    transition={{ duration: 0.8, delay: i * 0.08, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                  />
                ))}
              </div>
              <p className="mt-6 font-mono text-xs uppercase tracking-[0.3em] text-muted">Building the city</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ---------- HUD ---------- */}
      <div data-hud className="pointer-events-none absolute inset-0 z-10">
        {/* player card */}
        <div className="pointer-events-auto absolute left-4 top-24 max-sm:origin-top-left max-sm:scale-[0.86] md:left-6">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b0f11]/70 p-2.5 pr-4 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.9)] backdrop-blur-md">
            <span className="grid size-11 place-items-center rounded-xl font-mono text-sm font-semibold text-[#062520]" style={{ background: char?.color ?? "#5fd6c0" }}>
              {lvl.level}
            </span>
            <div className="min-w-[96px] sm:min-w-[150px]">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold tracking-tight">{char?.name || "Visitor"}</p>
                <button type="button" onClick={() => setCreatorOpen(true)} aria-label="Edit character" className="grid size-6 place-items-center rounded-md text-muted transition-colors hover:bg-white/10 hover:text-fg">
                  <PencilSimple size={13} />
                </button>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div className="h-full origin-left rounded-full bg-accent" animate={{ transform: `scaleX(${lvl.progress})` }} transition={{ duration: 0.6, ease: easeOut }} />
              </div>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
                {game?.progress.xp ?? 0} xp · {bitsCount} bits
              </p>
            </div>
          </div>
        </div>

        {/* toolbar + quests */}
        <div className="pointer-events-auto absolute right-4 top-24 flex w-[min(290px,calc(100vw-2rem))] flex-col items-end gap-2 md:right-6">
          <div className="flex gap-1.5 rounded-2xl border border-white/10 bg-[#0b0f11]/70 p-1.5 backdrop-blur-md">
            <ToolButton label={night ? "Switch to day" : "Switch to night"} onClick={() => setNight((n) => !n)}>
              {night ? <Sun size={18} /> : <Moon size={18} />}
            </ToolButton>
            <ToolButton label={`Graphics: ${quality}`} onClick={() => setQuality((q) => (q === "high" ? "low" : "high"))} active={quality === "high"}>
              <Cpu size={18} />
            </ToolButton>
            <ToolButton label="Reset camera (C)" onClick={() => (runtime.cam.yaw = runtime.player.heading + Math.PI)}>
              <ArrowsClockwise size={18} />
            </ToolButton>
            <span className="grid h-9 place-items-center rounded-xl px-2 font-mono text-[11px] text-muted sm:hidden" aria-label={`${doneCount} of ${quests.length} quests done`}>
              {doneCount}/{quests.length}
            </span>
          </div>
          <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f11]/70 backdrop-blur-md max-sm:hidden">
            <button type="button" onClick={() => setQuestsOpen((o) => !o)} aria-expanded={questsOpen} className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium">
              <span className="flex items-center gap-2">
                <ListChecks size={16} className="text-accent" /> Quests
              </span>
              <span className="flex items-center gap-2 font-mono text-xs text-muted">
                {doneCount}/{quests.length}
                <CaretDown size={12} className={cn("transition-transform", questsOpen && "rotate-180")} />
              </span>
            </button>
            <AnimatePresence initial={false}>
              {questsOpen ? (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.3, ease: easeOut }}
                  className="space-y-1 border-t border-white/5 px-4 py-3"
                >
                  {quests.map((q) => (
                    <li key={q.label} className={cn("flex items-center gap-2 text-[13px]", q.done ? "text-fg/45 line-through" : "text-fg/85")}>
                      {q.done ? <CheckCircle size={15} weight="fill" className="shrink-0 text-accent" /> : <Circle size={15} className="shrink-0 text-muted" />}
                      <span className="flex-1">{q.label}</span>
                      {q.n && !q.done ? <span className="font-mono text-[11px] text-muted">{q.n}</span> : null}
                    </li>
                  ))}
                </motion.ul>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        {/* district banner */}
        <AnimatePresence>
          {banner && ready ? (
            <motion.div
              key={banner.id}
              className="absolute inset-x-0 top-[13%] flex justify-center px-4 text-center md:top-[11%]"
              initial={{ opacity: 0, transform: "translateY(10px)", filter: "blur(6px)" }}
              animate={{ opacity: 1, transform: "translateY(0px)", filter: "blur(0px)" }}
              exit={{ opacity: 0, transform: "translateY(-8px)", filter: "blur(6px)", transition: { duration: 0.4 } }}
              transition={{ duration: 0.7, ease: easeOut }}
            >
              <div>
                <motion.div
                  className="mx-auto h-px w-40 origin-center"
                  style={{ background: districtInfo[banner.district].color }}
                  initial={{ transform: "scaleX(0)" }}
                  animate={{ transform: "scaleX(1)" }}
                  transition={{ duration: 0.8, ease: easeOut, delay: 0.1 }}
                />
                <p className="mt-3 font-serif text-3xl italic tracking-[-0.02em] text-fg [text-shadow:0_4px_30px_rgb(0_0_0/0.8)] md:text-5xl">
                  {districtInfo[banner.district].name}
                </p>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.25em] text-fg/70 [text-shadow:0_2px_12px_rgb(0_0_0/0.9)]">
                  {districtInfo[banner.district].hint}
                </p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* discovery card */}
        <AnimatePresence>
          {card ? (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, transform: "translateX(-16px)" }}
              animate={{ opacity: 1, transform: "translateX(0px)" }}
              exit={{ opacity: 0, transform: "translateX(-10px)", transition: { duration: 0.2 } }}
              transition={{ duration: 0.45, ease: easeOut }}
              className="pointer-events-auto absolute left-4 top-48 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#0d1113]/90 p-5 backdrop-blur-xl md:left-6"
            >
              <span className="absolute inset-y-0 left-0 w-1" style={{ background: card.color }} />
              <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: card.color }}>
                {card.kicker}
              </p>
              <p className="mt-1 text-lg font-semibold tracking-tight">{card.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{card.body}</p>
              {card.chips?.length ? (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {card.chips.map((c) => (
                    <li key={c} className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-fg/75">
                      {c}
                    </li>
                  ))}
                </ul>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* XP pops */}
        <div className="absolute inset-x-0 top-[58%] flex flex-col items-center gap-1.5">
          <AnimatePresence>
            {pops.map((p) => (
              <motion.span
                key={p.id}
                initial={{ opacity: 0, transform: "translateY(10px) scale(0.9)" }}
                animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
                exit={{ opacity: 0, transform: "translateY(-14px)", transition: { duration: 0.3 } }}
                transition={{ duration: 0.3, ease: easeOut }}
                className="rounded-full bg-accent/90 px-3 py-1 font-mono text-xs font-semibold text-[#062520] shadow-[0_8px_30px_-8px_rgb(95_214_192/0.6)]"
              >
                {p.text}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>

        {/* interaction prompt */}
        <AnimatePresence>
          {near && !panel ? (
            <motion.div
              key={near.id}
              className="pointer-events-auto absolute inset-x-0 bottom-28 flex justify-center px-4 md:bottom-10"
              initial={{ opacity: 0, transform: "translateY(12px)" }}
              animate={{ opacity: 1, transform: "translateY(0px)" }}
              exit={{ opacity: 0, transform: "translateY(8px)", transition: { duration: 0.15 } }}
              transition={{ duration: 0.3, ease: easeOut }}
            >
              <button
                type="button"
                onClick={() => openStation(near)}
                className="flex items-center gap-3 rounded-full border border-white/15 bg-[#0b0f11]/85 py-2 pl-2 pr-5 text-sm backdrop-blur-md transition-colors hover:border-accent/60"
              >
                <kbd className="grid size-8 place-items-center rounded-full bg-accent font-mono text-xs font-bold text-[#062520]">E</kbd>
                <span>
                  <span className="text-muted">{verbs[near.kind]} · </span>
                  <span className="font-medium">{near.label}</span>
                </span>
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* minimap */}
        <div className="pointer-events-auto absolute bottom-5 right-4 md:bottom-6 md:right-6 max-md:bottom-auto max-md:top-[150px]">
          <Minimap plan={plan} markers={markers} player={hudPos} heading={hudPos.heading} onOpen={() => setMapOpen(true)} />
        </div>

        {/* controls help */}
        <div className="absolute bottom-6 left-6 hidden flex-wrap gap-1.5 lg:flex [@media(pointer:coarse)]:hidden">
          {[
            ["WASD", "move"],
            ["Shift", "run"],
            ["Space", "jump"],
            ["E", "interact"],
            ["Drag", "look"],
            ["Scroll", "zoom"],
            ["M", "map"],
          ].map(([k, v]) => (
            <span key={k} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0b0f11]/60 py-1 pl-1 pr-2.5 text-[11px] text-muted backdrop-blur">
              <kbd className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] text-fg">{k}</kbd>
              {v}
            </span>
          ))}
        </div>

        {/* touch controls */}
        <div className="pointer-events-auto absolute inset-x-0 bottom-4 flex items-end justify-between px-4 [@media(pointer:fine)]:hidden">
          <Joystick runtime={runtime} />
          <div className="flex items-end gap-2">
            <TouchButton label="Run" onPress={() => (runtime.sprint = !runtime.sprint)}>
              <PersonSimpleRun size={22} weight="fill" />
            </TouchButton>
            <TouchButton label="Interact" disabled={!near} onPress={() => runtime.near && openStation(runtime.near)}>
              <HandPointing size={22} weight="fill" />
            </TouchButton>
            <TouchButton label="Jump" onPress={setJump} accent big>
              <ArrowFatUp size={26} weight="fill" />
            </TouchButton>
          </div>
        </div>
      </div>

      {/* overlays */}
      <AnimatePresence>
        {mapOpen ? <FullMap plan={plan} markers={markers} player={hudPos} heading={hudPos.heading} onClose={() => setMapOpen(false)} onTravel={travel} /> : null}
      </AnimatePresence>
      <AnimatePresence>
        {panel ? (
          <CityPanel
            key={typeof panel === "string" ? panel : panel.id}
            station={panel}
            content={content}
            stats={{ xp: game?.progress.xp ?? 0, bits: bitsCount, seen: taken.size, quests: doneCount, totalQuests: quests.length }}
            onClose={() => setPanel(null)}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {creatorOpen && ready ? (
          <CharacterCreator
            initial={char}
            onDone={(c) => {
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
          The City needs JavaScript and WebGL. <Link href="/">Head back to the main site</Link>.
        </div>
      </noscript>
    </div>
  );
}

function ToolButton({ label, onClick, children, active }: { label: string; onClick: () => void; children: React.ReactNode; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn("press grid size-9 place-items-center rounded-xl transition-colors", active ? "bg-white/10 text-fg" : "text-muted hover:bg-white/10 hover:text-fg")}
    >
      {children}
    </button>
  );
}

function TouchButton({ label, onPress, children, accent, big, disabled }: { label: string; onPress: () => void; children: React.ReactNode; accent?: boolean; big?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onPress();
      }}
      className={cn(
        "grid touch-none place-items-center rounded-full border border-white/15 backdrop-blur-md transition-[opacity,transform] duration-100 active:scale-95 disabled:opacity-30",
        big ? "size-[76px]" : "size-14",
        accent ? "bg-accent/90 text-[#062520]" : "bg-[#0b0f11]/60 text-fg",
      )}
    >
      {children}
    </button>
  );
}
