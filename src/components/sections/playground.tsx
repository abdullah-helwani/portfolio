"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTime,
  useTransform,
} from "motion/react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  GameController,
  Pause,
  Play,
} from "@phosphor-icons/react/dist/ssr";
import { TextReveal } from "@/components/animations/text-reveal";
import { useGameOptional } from "@/components/game/game-provider";
import { RetroPC } from "@/components/play/retro-pc";
import { SnakeGame, type Dir, type GameState, type SnakeHandle } from "@/components/play/snake";
import { cn } from "@/lib/utils";

const keyToDir: Record<string, Dir> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
};

const RIG_WIDTH = 760;

export function Playground() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<SnakeHandle>(null);
  const game = useGameOptional();
  const reduce = useReducedMotion();

  const [armed, setArmed] = useState(false);
  const [state, setState] = useState<GameState>("off");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [pressed, setPressed] = useState<Set<string>>(new Set());
  const [scale, setScale] = useState(1);
  const scaleMV = useMotionValue(1);

  const inView = useInView(sectionRef, { amount: 0.35 });

  // boot the machine the first time it scrolls into view
  useEffect(() => {
    if (inView) gameRef.current?.boot();
    if (!inView && armed) {
      gameRef.current?.pause();
      // leaving the section always releases the keyboard
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setArmed(false);
    }
  }, [inView, armed]);

  // fit the 760px rig into the column
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

  const flash = useCallback((code: string) => {
    setPressed((p) => new Set(p).add(code));
    window.setTimeout(
      () =>
        setPressed((p) => {
          const n = new Set(p);
          n.delete(code);
          return n;
        }),
      140,
    );
  }, []);

  const primary = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    const s = g.state();
    if (s === "off" || s === "boot") return;
    if (s === "playing" || s === "paused") g.togglePause();
    else g.start();
  }, []);

  // keyboard while armed
  useEffect(() => {
    if (!armed) return;
    const down = (e: KeyboardEvent) => {
      const g = gameRef.current;
      if (!g) return;
      const dir = keyToDir[e.code];
      if (dir) {
        e.preventDefault();
        g.turn(dir);
      } else if (e.code === "Enter" || e.code === "NumpadEnter") {
        e.preventDefault();
        primary();
      } else if (e.code === "Space" || e.code === "KeyP") {
        e.preventDefault();
        if (g.state() === "playing" || g.state() === "paused") g.togglePause();
        else primary();
      } else if (e.code === "Escape") {
        g.pause();
        setArmed(false);
      } else {
        return;
      }
      setPressed((p) => new Set(p).add(e.code));
    };
    const up = (e: KeyboardEvent) =>
      setPressed((p) => {
        if (!p.has(e.code)) return p;
        const n = new Set(p);
        n.delete(e.code);
        return n;
      });
    const outside = (e: PointerEvent) => {
      if (!stageRef.current?.contains(e.target as Node) && !(e.target as HTMLElement).closest("[data-game-control]")) {
        gameRef.current?.pause();
        setArmed(false);
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("pointerdown", outside);
    };
  }, [armed, primary]);

  // swipe on touch screens
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const onScreenDown = (e: ReactPointerEvent) => {
    setArmed(true);
    if (e.pointerType !== "mouse") swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onScreenUp = (e: ReactPointerEvent) => {
    const start = swipe.current;
    swipe.current = null;
    if (start) {
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) > 24) {
        gameRef.current?.turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
        return;
      }
    }
    primary();
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

  const transform = useTransform(
    [sRotX, sRotY, sScale, sY, pX, pY, focus, time, scaleMV],
    ([rx, ry, sc, y, mx, my, f, t, fit]: number[]) => {
      if (reduce) return `scale(${fit}) rotateX(-12deg) rotateY(-18deg)`;
      const float = Math.sin(t / 900) * 8 * (1 - f);
      const tilt = 1 - f * 0.7;
      const rotX = rx * (1 - f) + -8 * f + -my * 7 * tilt;
      const rotY = ry * (1 - f) + -4 * f + mx * 12 * tilt;
      const rotZ = Math.sin(t / 1300) * 0.6 * (1 - f);
      const s = (sc * (1 - f) + 1.04 * f) * fit;
      return `translate3d(0, ${y * (1 - f) + float}px, 0) scale(${s}) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`;
    },
  );

  const onStageMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    py.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  };

  const dpad = useCallback(
    (dir: Dir, code: string) => {
      setArmed(true);
      flash(code);
      const g = gameRef.current;
      if (!g) return;
      if (g.state() === "title" || g.state() === "over") g.start();
      g.turn(dir);
    },
    [flash],
  );

  const playing = state === "playing";
  const label =
    state === "playing" ? "Pause" : state === "paused" ? "Resume" : state === "over" ? "Play again" : "Start game";

  return (
    <section
      id="play"
      ref={sectionRef}
      className="relative mx-auto max-w-[1400px] overflow-hidden px-5 py-28 md:overflow-visible md:px-10 md:py-36"
    >
      <div className="grid items-center gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            <span className="text-accent">05</span> / Playground
          </p>
          <TextReveal
            text="Take a break. *Beat my score.*"
            className="mt-6 text-[clamp(2.4rem,4.6vw,4.25rem)] font-semibold leading-[0.95] tracking-[-0.045em]"
          />
          <p className="mt-6 max-w-[40ch] leading-relaxed text-muted">
            A tiny machine I built for this page. Click the screen to take control, steer with the arrow keys or WASD, and
            eat the bugs before they eat your afternoon.
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line">
            <div className="bg-bg p-4">
              <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Score</dt>
              <dd className="mt-1 font-mono text-3xl tabular-nums">
                <motion.span key={score} initial={{ opacity: 0.3, transform: "translateY(-6px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} className="inline-block">
                  {String(score).padStart(3, "0")}
                </motion.span>
              </dd>
            </div>
            <div className="bg-bg p-4">
              <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Your best</dt>
              <dd className="mt-1 font-mono text-3xl tabular-nums text-accent">{String(best).padStart(3, "0")}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              data-game-control
              onClick={() => {
                setArmed(true);
                primary();
              }}
              disabled={state === "off" || state === "boot"}
              className="press inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-accent-ink transition-opacity duration-200 disabled:opacity-50"
            >
              {playing ? <Pause size={16} weight="fill" /> : <Play size={16} weight="fill" />}
              {state === "off" || state === "boot" ? "Booting" : label}
            </button>
            <p className="hidden items-center gap-1.5 text-xs text-muted md:flex">
              <kbd className="rounded border border-line-strong px-1.5 py-0.5 font-mono">Enter</kbd> start
              <kbd className="ml-2 rounded border border-line-strong px-1.5 py-0.5 font-mono">Space</kbd> pause
              <kbd className="ml-2 rounded border border-line-strong px-1.5 py-0.5 font-mono">Esc</kbd> release
            </p>
          </div>
          <p className={cn("mt-4 flex items-center gap-2 text-xs transition-colors", armed ? "text-accent" : "text-muted")}>
            <GameController size={14} weight={armed ? "fill" : "regular"} />
            {armed ? "Keyboard captured. Press Esc to scroll normally." : "Keyboard free. Click the screen to play."}
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
                power={state !== "off"}
                mouseDown={armed}
                screen={
                  <div
                    role="application"
                    aria-label="Snake game. Click to focus, then use arrow keys or WASD."
                    tabIndex={0}
                    onPointerDown={onScreenDown}
                    onPointerUp={onScreenUp}
                    onFocus={() => setArmed(true)}
                    className={cn(
                      "absolute inset-0 cursor-pointer touch-none outline-none",
                      armed && "shadow-[inset_0_0_0_2px_rgb(95_214_192/0.6)]",
                    )}
                  >
                    <SnakeGame
                      ref={gameRef}
                      onStateChange={setState}
                      onScore={(s, b) => {
                        setScore(s);
                        setBest(b);
                        if (s >= 10) game?.unlock("snake-10");
                        if (s >= 25) game?.unlock("snake-25");
                      }}
                      onGameOver={(s, b) => {
                        setScore(s);
                        setBest(b);
                      }}
                    />
                  </div>
                }
              />
            </motion.div>
          </div>

          {/* touch d-pad */}
          <div data-game-control className="mx-auto mt-4 grid w-fit grid-cols-3 gap-2 [@media(pointer:fine)]:hidden">
            <span />
            <DpadButton label="Up" dir="up" code="ArrowUp" onPress={dpad}>
              <ArrowUp size={20} weight="bold" />
            </DpadButton>
            <span />
            <DpadButton label="Left" dir="left" code="ArrowLeft" onPress={dpad}>
              <ArrowLeft size={20} weight="bold" />
            </DpadButton>
            <DpadButton label="Down" dir="down" code="ArrowDown" onPress={dpad}>
              <ArrowDown size={20} weight="bold" />
            </DpadButton>
            <DpadButton label="Right" dir="right" code="ArrowRight" onPress={dpad}>
              <ArrowRight size={20} weight="bold" />
            </DpadButton>
          </div>
        </div>
      </div>
    </section>
  );
}

function DpadButton({
  label,
  dir,
  code,
  onPress,
  children,
}: {
  label: string;
  dir: Dir;
  code: string;
  onPress: (dir: Dir, code: string) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        onPress(dir, code);
      }}
      className="press grid size-14 place-items-center rounded-2xl border border-line-strong bg-surface-2 text-fg active:bg-accent active:text-accent-ink"
    >
      {children}
    </button>
  );
}
