"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTime, useTransform } from "motion/react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CircleNotch, GameController, House, Trophy } from "@phosphor-icons/react/dist/ssr";
import { arcadeGames, type ArcadeGameId } from "@/components/arcade/games";
import type { KeyBus } from "@/components/arcade/engine";
import { ArcadeOS, type Screen } from "@/components/arcade/os";
import { useGameOptional } from "@/components/game/game-provider";
import { RetroPC } from "@/components/play/retro-pc";
import { cn } from "@/lib/utils";
import { SectionKicker, type SectionProps } from "./section-header";
import { TextReveal } from "@/components/animations/text-reveal";

const RIG_WIDTH = 760;
const GAME_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyA", "KeyS", "KeyD", "Space", "Enter", "NumpadEnter"]);

type Entry = { name: string; score: number };

function Leaderboard({ game, refresh }: { game: ArcadeGameId; refresh: number }) {
  const [rows, setRows] = useState<Entry[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/scores?game=${game}`)
      .then((r) => r.json())
      .then((d: { top?: Entry[] }) => !cancelled && setRows(d.top ?? []))
      .catch(() => !cancelled && setRows([]));
    return () => {
      cancelled = true;
    };
  }, [game, refresh]);
  const unit = arcadeGames.find((g) => g.id === game)?.unit ?? "";
  return (
    <div className="rounded-2xl border border-line bg-bg/60 p-4 backdrop-blur">
      <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
        <Trophy size={14} className="text-[#f6c177]" /> Leaderboard · {arcadeGames.find((g) => g.id === game)?.title}
      </p>
      {rows === null ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted">
          <CircleNotch size={14} className="animate-spin" /> Loading
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No scores yet. Be the first name on the board.</p>
      ) : (
        <ol className="mt-3 grid gap-1">
          {rows.map((r, i) => (
            <li key={`${r.name}-${i}`} className="flex items-center gap-3 font-mono text-[13px]">
              <span className={cn("w-5 tabular-nums", i === 0 ? "text-[#f6c177]" : "text-muted")}>{i + 1}</span>
              <span className="min-w-0 flex-1 truncate">{r.name}</span>
              <span className="tabular-nums text-accent">
                {r.score} <span className="text-muted">{unit}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function Arcade({ section, index }: SectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const game = useGameOptional();
  const reduce = useReducedMotion();

  const [armed, setArmed] = useState(false);
  const [power, setPower] = useState(false);
  const [screen, setScreenState] = useState<Screen>({ view: "boot", app: "snake" });
  const [pressed, setPressed] = useState<Set<string>>(new Set());
  const [scale, setScale] = useState(1);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<{ game: ArcadeGameId; score: number } | null>(null);
  const [name, setName] = useState("");
  const [submit, setSubmit] = useState<{ state: "idle" | "sending" | "done" | "error"; message?: string }>({ state: "idle" });
  const [refresh, setRefresh] = useState(0);
  const scaleMV = useMotionValue(1);
  const inView = useInView(sectionRef, { amount: 0.3 });

  const setScreen = useCallback((s: Screen) => setScreenState(s), []);

  // a tiny event bus so every game gets the same keyboard stream
  const listeners = useRef(new Set<(code: string, down: boolean) => void>());
  const keys = useMemo<KeyBus>(
    () => ({
      subscribe: (fn) => {
        listeners.current.add(fn);
        return () => listeners.current.delete(fn);
      },
    }),
    [],
  );
  const emit = useCallback((code: string, down: boolean) => listeners.current.forEach((fn) => fn(code, down)), []);

  useEffect(() => {
    if (inView && !power) {
      // power on the first time the machine scrolls into view
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPower(true);
    }
    if (!inView && armed) setArmed(false);
  }, [inView, armed, power]);

  useEffect(() => {
    // the saved name is only readable after mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (game?.progress.name && !name) setName(game.progress.name);
  }, [game?.progress.name, name]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const next = Math.min(1, entry.contentRect.width / RIG_WIDTH);
      scaleMV.set(next);
      setScale(next);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [scaleMV]);

  // keyboard while the machine has focus
  useEffect(() => {
    if (!armed) return;
    const typing = screen.view === "app" && screen.app === "typing";
    const down = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        if (screen.view === "app") setScreenState({ ...screen, view: "desktop" });
        else setArmed(false);
        return;
      }
      if (typing) return;
      if (!GAME_KEYS.has(e.code)) return;
      const target = e.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;
      e.preventDefault();
      if (!e.repeat) emit(e.code, true);
      setPressed((p) => new Set(p).add(e.code));
    };
    const up = (e: KeyboardEvent) => {
      emit(e.code, false);
      setPressed((p) => {
        if (!p.has(e.code)) return p;
        const n = new Set(p);
        n.delete(e.code);
        return n;
      });
    };
    const outside = (e: PointerEvent) => {
      if (!stageRef.current?.contains(e.target as Node) && !(e.target as HTMLElement).closest("[data-game-control]")) setArmed(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("pointerdown", outside);
    };
  }, [armed, screen, emit]);

  // swipe → arrow keys on touch screens
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const onScreenDown = (e: ReactPointerEvent) => {
    setArmed(true);
    if (e.pointerType !== "mouse") swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onScreenUp = (e: ReactPointerEvent) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start || screen.view !== "app" || screen.app !== "snake") return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return emit("Enter", true);
    emit(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "ArrowRight" : "ArrowLeft") : dy > 0 ? "ArrowDown" : "ArrowUp", true);
  };

  const flashKey = useCallback(
    (code: string) => {
      setArmed(true);
      emit(code, true);
      setPressed((p) => new Set(p).add(code));
      window.setTimeout(() => {
        emit(code, false);
        setPressed((p) => {
          const n = new Set(p);
          n.delete(code);
          return n;
        });
      }, 120);
    },
    [emit],
  );

  const onScore = useCallback(
    (g: ArcadeGameId, s: number) => {
      setScore(s);
      if (g === "snake") {
        if (s >= 10) game?.unlock("snake-10");
        if (s >= 25) game?.unlock("snake-25");
      }
    },
    [game],
  );
  const onEnd = useCallback(
    (g: ArcadeGameId, s: number) => {
      game?.played(g);
      setResult({ game: g, score: s });
      setSubmit({ state: "idle" });
    },
    [game],
  );

  const send = async () => {
    if (!result || !name.trim()) return;
    setSubmit({ state: "sending" });
    game?.setName(name.trim());
    try {
      const res = await fetch("/api/scores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ game: result.game, name: name.trim(), score: result.score }) });
      const body = (await res.json()) as { rank?: number; error?: string };
      if (!res.ok) return setSubmit({ state: "error", message: body.error ?? "Couldn't save the score." });
      setSubmit({ state: "done", message: body.rank ? `You're #${body.rank} on the board.` : "Saved. Not top 10 yet. Go again!" });
      game?.unlock("leaderboard");
      setRefresh((n) => n + 1);
    } catch {
      setSubmit({ state: "error", message: "Couldn't reach the server." });
    }
  };

  // ---- motion: scroll + pointer + idle float + focus mode ----
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const sRotY = useTransform(scrollYProgress, [0, 0.45, 1], [-62, -18, 14]);
  const sRotX = useTransform(scrollYProgress, [0, 0.45, 1], [28, -12, -24]);
  const sScale = useTransform(scrollYProgress, [0, 0.4], [0.72, 1]);
  const sY = useTransform(scrollYProgress, [0, 0.45, 1], [140, 0, -80]);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const pX = useSpring(px, { stiffness: 90, damping: 16 });
  const pY = useSpring(py, { stiffness: 90, damping: 16 });
  const focus = useMotionValue(0);
  useEffect(() => {
    const controls = animate(focus, armed ? 1 : 0, { duration: 0.9, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [armed, focus]);
  const time = useTime();
  const transform = useTransform([sRotX, sRotY, sScale, sY, pX, pY, focus, time, scaleMV], ([rx, ry, sc, y, mx, my, f, t, fit]: number[]) => {
    if (reduce) return `scale(${fit}) rotateX(-12deg) rotateY(-18deg)`;
    const float = Math.sin(t / 900) * 8 * (1 - f);
    const tilt = 1 - f * 0.7;
    const rotX = rx * (1 - f) + -8 * f + -my * 7 * tilt;
    const rotY = ry * (1 - f) + -4 * f + mx * 12 * tilt;
    const rotZ = Math.sin(t / 1300) * 0.6 * (1 - f);
    const s = (sc * (1 - f) + 1.04 * f) * fit;
    return `translate3d(0, ${y * (1 - f) + float}px, 0) scale(${s}) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`;
  });
  const onStageMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    py.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  };

  const current = arcadeGames.find((g) => g.id === screen.app)!;
  const inApp = screen.view === "app";

  return (
    <section id="play" ref={sectionRef} className="relative mx-auto max-w-[1400px] overflow-hidden px-5 py-28 md:overflow-visible md:px-10 md:py-36">
      <div className="grid items-center gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionKicker section={section} index={index} />
          <TextReveal text={section.title} className="mt-6 text-[clamp(2.4rem,4.6vw,4.25rem)] font-semibold leading-[0.95] tracking-[-0.045em]" />
          {section.intro ? <p className="mt-6 max-w-[40ch] leading-relaxed text-muted">{section.intro}</p> : null}

          <div data-game-control className="mt-8 flex flex-wrap gap-2">
            {arcadeGames.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  setArmed(true);
                  setScreenState({ view: "app", app: g.id });
                  setResult(null);
                  setScore(0);
                }}
                className={cn("rounded-full border px-3.5 py-1.5 text-sm transition-colors", inApp && screen.app === g.id ? "border-accent bg-accent/15 text-fg" : "border-line-strong text-muted hover:text-fg")}
              >
                {g.title}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4">
            {inApp ? (
              <div className="flex items-center justify-between rounded-2xl border border-line bg-bg/60 px-4 py-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">{current.title}</p>
                  <p className="mt-0.5 font-mono text-2xl tabular-nums">
                    {score} <span className="text-sm text-muted">{current.unit}</span>
                  </p>
                </div>
                <button type="button" data-game-control onClick={() => setScreenState({ ...screen, view: "desktop" })} className="press inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong px-3 text-sm text-muted hover:text-fg">
                  <House size={14} /> Desktop
                </button>
              </div>
            ) : null}

            {result && result.score > 0 ? (
              <form
                data-game-control
                onSubmit={(e) => {
                  e.preventDefault();
                  void send();
                }}
                className="rounded-2xl border border-[#f6c177]/40 bg-[#f6c177]/[0.07] p-4"
              >
                <p className="text-sm">
                  <span className="font-semibold">{result.score} {arcadeGames.find((g) => g.id === result.game)?.unit}</span> in {arcadeGames.find((g) => g.id === result.game)?.title}. Put your name on the board:
                </p>
                <div className="mt-3 flex gap-2">
                  <input value={name} onChange={(e) => setName(e.target.value)} maxLength={16} placeholder="Your name" aria-label="Your name for the leaderboard" disabled={submit.state === "done"} className="h-10 min-w-0 flex-1 rounded-full border border-line-strong bg-bg px-4 text-sm focus:border-accent focus:outline-none" />
                  <button type="submit" disabled={submit.state === "sending" || submit.state === "done" || name.trim().length < 2} className="press h-10 rounded-full bg-accent px-4 text-sm font-medium text-accent-ink disabled:opacity-50">
                    {submit.state === "sending" ? "Saving" : submit.state === "done" ? "Saved" : "Submit"}
                  </button>
                </div>
                {submit.message ? <p className={cn("mt-2 text-xs", submit.state === "error" ? "text-ember" : "text-accent")}>{submit.message}</p> : null}
              </form>
            ) : null}

            <Leaderboard game={result?.game ?? screen.app} refresh={refresh} />
          </div>

          <p className={cn("mt-4 flex items-center gap-2 text-xs transition-colors", armed ? "text-accent" : "text-muted")}>
            <GameController size={14} weight={armed ? "fill" : "regular"} />
            {armed ? "Keyboard captured. Esc goes back, Esc again lets you scroll." : "Click the screen to take control."}
          </p>
        </div>

        <div className="lg:col-span-8">
          <div
            ref={stageRef}
            onPointerMove={onStageMove}
            onPointerLeave={() => {
              px.set(0);
              py.set(0);
            }}
            className="relative grid place-items-center [perspective:1800px]"
            style={{ height: Math.max(340, 760 * scale) }}
          >
            <div aria-hidden="true" className="pointer-events-none absolute inset-[10%] rounded-full bg-accent/10 blur-[90px]" />
            <motion.div style={{ transform, transformStyle: "preserve-3d" }} className="relative will-change-transform">
              <RetroPC
                pressed={pressed}
                power={power}
                mouseDown={armed}
                screen={
                  <div
                    role="application"
                    aria-label="Arcade computer. Click to focus, then use the arrow keys, Space and Enter."
                    tabIndex={0}
                    onPointerDown={onScreenDown}
                    onPointerUp={onScreenUp}
                    onFocus={() => setArmed(true)}
                    className={cn("absolute inset-0 touch-none outline-none", armed && "shadow-[inset_0_0_0_2px_rgb(95_214_192/0.6)]")}
                  >
                    <ArcadeOS keys={keys} screen={screen} setScreen={setScreen} onScore={onScore} onEnd={onEnd} power={power} />
                  </div>
                }
              />
            </motion.div>
          </div>

          <div data-game-control className="mx-auto mt-4 grid w-fit grid-cols-4 gap-2 [@media(pointer:fine)]:hidden">
            {(
              [
                ["ArrowLeft", ArrowLeft],
                ["ArrowUp", ArrowUp],
                ["ArrowDown", ArrowDown],
                ["ArrowRight", ArrowRight],
              ] as const
            ).map(([code, Icon]) => (
              <button
                key={code}
                type="button"
                aria-label={code.replace("Arrow", "")}
                onPointerDown={(e) => {
                  e.preventDefault();
                  flashKey(code);
                }}
                className="press grid size-14 place-items-center rounded-2xl border border-line-strong bg-surface-2 text-fg active:bg-accent active:text-accent-ink"
              >
                <Icon size={20} weight="bold" />
              </button>
            ))}
            <button type="button" onPointerDown={(e) => {
                e.preventDefault();
                flashKey("Space");
              }} className="press col-span-4 h-12 rounded-2xl border border-line-strong bg-surface-2 font-mono text-xs uppercase tracking-[0.2em] active:bg-accent active:text-accent-ink">
              Action
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
