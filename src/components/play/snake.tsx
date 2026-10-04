"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { cn } from "@/lib/utils";

export type Dir = "up" | "down" | "left" | "right";
export type GameState = "off" | "boot" | "title" | "playing" | "paused" | "over";

export type SnakeHandle = {
  boot: () => void;
  start: () => void;
  turn: (dir: Dir) => void;
  togglePause: () => void;
  pause: () => void;
  state: () => GameState;
};

type Point = { x: number; y: number };

const W = 510;
const H = 330;
const CELL = 15;
const COLS = Math.floor(W / CELL);
const ROWS = Math.floor((H - 30) / CELL); // leave room for the HUD
const OFFSET_X = Math.floor((W - COLS * CELL) / 2);
const OFFSET_Y = 30;
const BEST_KEY = "ah-snake-best";

const bootLines = [
  "AH-86 BIOS v2.6  (c) Helwani Systems",
  "Memory test ........ 640K OK",
  "Detecting neural co-processor ... found",
  "Mounting /projects ............. done",
  "Loading SNAKE.EXE",
];

const opposite: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };
const vectors: Record<Dir, Point> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };

function readBest() {
  try {
    return Number(window.localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function SnakeGame({
  ref,
  onScore,
  onStateChange,
  onGameOver,
}: {
  ref?: Ref<SnakeHandle>;
  onScore?: (score: number, best: number) => void;
  onStateChange?: (state: GameState) => void;
  onGameOver?: (score: number, best: number, newBest: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<GameState>("off");
  const [bootCount, setBootCount] = useState(0);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [shake, setShake] = useState(false);
  const [newBest, setNewBest] = useState(false);

  const stateRef = useRef<GameState>("off");
  const game = useRef({
    snake: [] as Point[],
    dir: "right" as Dir,
    queue: [] as Dir[],
    food: { x: 0, y: 0 } as Point,
    score: 0,
    speed: 120,
    acc: 0,
    last: 0,
    bursts: [] as { x: number; y: number; t: number }[],
  });
  const frame = useRef(0);
  const loopRef = useRef<(now: number) => void>(() => {});

  const callbacks = useRef({ onScore, onStateChange, onGameOver });
  useEffect(() => {
    callbacks.current = { onScore, onStateChange, onGameOver };
  });

  const go = useCallback((next: GameState) => {
    stateRef.current = next;
    setState(next);
    callbacks.current.onStateChange?.(next);
  }, []);

  useEffect(() => {
    const b = readBest();
    // localStorage is only readable after mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBest(b);
  }, []);

  const placeFood = useCallback(() => {
    const g = game.current;
    for (let i = 0; i < 500; i++) {
      const p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
      if (!g.snake.some((s) => s.x === p.x && s.y === p.y)) {
        g.food = p;
        return;
      }
    }
  }, []);

  const draw = useCallback((now: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const g = game.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== W * dpr) {
      canvas.width = W * dpr;
      canvas.height = H * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // playfield grid
    ctx.fillStyle = "rgba(95,214,192,0.05)";
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        ctx.fillRect(OFFSET_X + x * CELL + CELL / 2 - 0.75, OFFSET_Y + y * CELL + CELL / 2 - 0.75, 1.5, 1.5);
      }
    }
    ctx.strokeStyle = "rgba(95,214,192,0.25)";
    ctx.lineWidth = 1;
    ctx.strokeRect(OFFSET_X - 0.5, OFFSET_Y - 0.5, COLS * CELL + 1, ROWS * CELL + 1);

    if (stateRef.current === "playing" || stateRef.current === "paused" || stateRef.current === "over") {
      // food: a small ember bug
      const fx = OFFSET_X + g.food.x * CELL;
      const fy = OFFSET_Y + g.food.y * CELL;
      const pulse = 1 + Math.sin(now / 160) * 0.12;
      ctx.save();
      ctx.translate(fx + CELL / 2, fy + CELL / 2);
      ctx.scale(pulse, pulse);
      ctx.shadowColor = "#f0773f";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#f0773f";
      ctx.fillRect(-4, -4, 8, 8);
      ctx.fillRect(-6, -2, 2, 1.5);
      ctx.fillRect(4, -2, 2, 1.5);
      ctx.fillRect(-6, 2, 2, 1.5);
      ctx.fillRect(4, 2, 2, 1.5);
      ctx.restore();

      // snake
      ctx.save();
      ctx.shadowColor = "#5fd6c0";
      ctx.shadowBlur = 10;
      g.snake.forEach((s, i) => {
        const t = 1 - i / Math.max(g.snake.length, 1);
        ctx.fillStyle = i === 0 ? "#c9fff4" : `rgba(95,214,192,${0.35 + t * 0.65})`;
        const inset = i === 0 ? 1 : 2;
        ctx.fillRect(OFFSET_X + s.x * CELL + inset, OFFSET_Y + s.y * CELL + inset, CELL - inset * 2, CELL - inset * 2);
      });
      ctx.restore();

      // eat bursts
      g.bursts = g.bursts.filter((b) => now - b.t < 420);
      for (const b of g.bursts) {
        const p = (now - b.t) / 420;
        ctx.strokeStyle = `rgba(240,119,63,${1 - p})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(OFFSET_X + b.x * CELL + CELL / 2, OFFSET_Y + b.y * CELL + CELL / 2, 6 + p * 22, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }, []);

  const step = useCallback(() => {
    const g = game.current;
    let dir = g.dir;
    while (g.queue.length) {
      const next = g.queue.shift()!;
      if (next !== opposite[dir] && next !== dir) {
        dir = next;
        break;
      }
    }
    g.dir = dir;
    const head = g.snake[0];
    const v = vectors[dir];
    const nx = head.x + v.x;
    const ny = head.y + v.y;
    const hitWall = nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS;
    const hitSelf = g.snake.slice(0, -1).some((s) => s.x === nx && s.y === ny);
    if (hitWall || hitSelf) {
      const previousBest = readBest();
      const isBest = g.score > previousBest;
      if (isBest) {
        try {
          window.localStorage.setItem(BEST_KEY, String(g.score));
        } catch {}
      }
      const bestNow = Math.max(previousBest, g.score);
      setBest(bestNow);
      setNewBest(isBest);
      setShake(true);
      window.setTimeout(() => setShake(false), 400);
      go("over");
      callbacks.current.onGameOver?.(g.score, bestNow, isBest);
      return;
    }
    g.snake.unshift({ x: nx, y: ny });
    if (nx === g.food.x && ny === g.food.y) {
      g.score += 1;
      g.speed = Math.max(55, 120 - g.score * 3);
      g.bursts.push({ x: nx, y: ny, t: performance.now() });
      setScore(g.score);
      callbacks.current.onScore?.(g.score, Math.max(readBest(), g.score));
      placeFood();
    } else {
      g.snake.pop();
    }
  }, [go, placeFood]);

  const loop = useCallback(
    (now: number) => {
      const g = game.current;
      const dt = Math.min(now - (g.last || now), 100);
      g.last = now;
      if (stateRef.current === "playing") {
        g.acc += dt;
        while (g.acc >= g.speed && stateRef.current === "playing") {
          g.acc -= g.speed;
          step();
        }
      }
      draw(now);
      if (stateRef.current === "playing" || game.current.bursts.length) {
        frame.current = requestAnimationFrame(loopRef.current);
      } else {
        frame.current = 0;
      }
    },
    [draw, step],
  );
  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  const kick = useCallback(() => {
    if (!frame.current) {
      game.current.last = 0;
      frame.current = requestAnimationFrame(loopRef.current);
    }
  }, []);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const start = useCallback(() => {
    const cx = Math.floor(COLS / 2);
    const cy = Math.floor(ROWS / 2);
    game.current = {
      ...game.current,
      snake: [
        { x: cx, y: cy },
        { x: cx - 1, y: cy },
        { x: cx - 2, y: cy },
      ],
      dir: "right",
      queue: [],
      score: 0,
      speed: 120,
      acc: 0,
      bursts: [],
    };
    placeFood();
    setScore(0);
    setNewBest(false);
    callbacks.current.onScore?.(0, readBest());
    go("playing");
    kick();
  }, [go, kick, placeFood]);

  const boot = useCallback(() => {
    if (stateRef.current !== "off") return;
    go("boot");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setBootCount(bootLines.length);
      go("title");
      draw(performance.now());
      return;
    }
    bootLines.forEach((_, i) => {
      window.setTimeout(() => setBootCount(i + 1), 280 + i * 320);
    });
    window.setTimeout(
      () => {
        go("title");
        draw(performance.now());
      },
      280 + bootLines.length * 320 + 400,
    );
  }, [draw, go]);

  useImperativeHandle(
    ref,
    () => ({
      boot,
      start,
      turn: (dir: Dir) => {
        if (stateRef.current !== "playing") return;
        const q = game.current.queue;
        if (q.length < 3) q.push(dir);
      },
      togglePause: () => {
        if (stateRef.current === "playing") go("paused");
        else if (stateRef.current === "paused") {
          go("playing");
          kick();
        }
      },
      pause: () => {
        if (stateRef.current === "playing") go("paused");
      },
      state: () => stateRef.current,
    }),
    [boot, go, kick, start],
  );

  const hud = state === "playing" || state === "paused" || state === "over";

  return (
    <div
      className={cn(
        "absolute inset-0 font-mono text-[#8ff5e0] [text-shadow:0_0_8px_rgb(95_214_192/0.7)]",
        shake && "animate-[crt-shake_0.4s_ease-out]",
      )}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ width: W, height: H }} />

      {hud ? (
        <div className="absolute inset-x-0 top-0 flex h-[30px] items-center justify-between px-[16px] text-[11px] uppercase tracking-[0.18em]">
          <span>
            score <b className="tabular-nums">{String(score).padStart(3, "0")}</b>
          </span>
          <span className="text-[#8ff5e0]/60">snake.exe</span>
          <span>
            best <b className="tabular-nums">{String(Math.max(best, score)).padStart(3, "0")}</b>
          </span>
        </div>
      ) : null}

      {state === "boot" || state === "off" ? (
        <div className="absolute inset-0 p-6 text-[12px] leading-6">
          {bootLines.slice(0, bootCount).map((line) => (
            <p key={line}>{line}</p>
          ))}
          {state === "boot" ? <span className="inline-block h-4 w-2 animate-pulse bg-[#8ff5e0]" /> : null}
        </div>
      ) : null}

      {state === "title" ? (
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-[42px] font-bold leading-none tracking-[0.12em]">SNAKE</p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-[#8ff5e0]/70">eat the bugs · avoid the walls</p>
            <p className="mt-8 animate-pulse text-[13px] uppercase tracking-[0.25em]">press enter or tap to play</p>
            {best ? <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-[#8ff5e0]/60">your best · {best}</p> : null}
          </div>
        </div>
      ) : null}

      {state === "paused" ? (
        <div className="absolute inset-0 grid place-items-center bg-[#020a08]/60 text-center">
          <p className="text-[22px] font-bold tracking-[0.3em]">PAUSED</p>
        </div>
      ) : null}

      {state === "over" ? (
        <div className="absolute inset-0 grid place-items-center bg-[#020a08]/70 text-center">
          <div>
            <p className="text-[30px] font-bold tracking-[0.2em] text-[#ffb08a] [text-shadow:0_0_10px_rgb(240_119_63/0.8)]">
              GAME OVER
            </p>
            <p className="mt-3 text-[13px] uppercase tracking-[0.2em]">
              score {score}
              {newBest ? " · new best!" : ""}
            </p>
            <p className="mt-6 animate-pulse text-[12px] uppercase tracking-[0.25em]">enter / tap to retry</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
