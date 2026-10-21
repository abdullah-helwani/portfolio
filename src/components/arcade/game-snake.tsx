"use client";

import { useRef } from "react";
import { C, H, W, centerText, hud, setupCanvas, useKeys, useLoop, type GameProps } from "./engine";

const CELL = 15;
const COLS = Math.floor(W / CELL);
const ROWS = Math.floor((H - 30) / CELL);
const OX = Math.floor((W - COLS * CELL) / 2);
const OY = 30;
type P = { x: number; y: number };
const DIRS: Record<string, P> = {
  ArrowUp: { x: 0, y: -1 },
  KeyW: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  KeyS: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  KeyA: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  KeyD: { x: 1, y: 0 },
};

export function SnakeGame({ keys, onScore, onEnd }: GameProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const s = useRef({ snake: [] as P[], dir: { x: 1, y: 0 }, queue: [] as P[], food: { x: 0, y: 0 }, acc: 0, score: 0, over: false, started: false });

  const place = () => {
    const st = s.current;
    let f: P;
    do f = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    while (st.snake.some((p) => p.x === f.x && p.y === f.y));
    st.food = f;
  };
  const reset = () => {
    const mid = { x: Math.floor(COLS / 3), y: Math.floor(ROWS / 2) };
    s.current = { snake: [mid, { x: mid.x - 1, y: mid.y }, { x: mid.x - 2, y: mid.y }], dir: { x: 1, y: 0 }, queue: [], food: { x: 0, y: 0 }, acc: 0, score: 0, over: false, started: true };
    place();
  };

  useKeys(keys, (code, down) => {
    if (!down) return;
    const st = s.current;
    if (!st.started && (code === "Enter" || code === "Space" || DIRS[code])) reset();
    const d = DIRS[code];
    if (!d) return;
    const last = st.queue[st.queue.length - 1] ?? st.dir;
    if (d.x === -last.x && d.y === -last.y) return;
    if (st.queue.length < 3) st.queue.push(d);
  });

  useLoop((dt) => {
    const ctx = setupCanvas(canvas.current);
    if (!ctx) return;
    const st = s.current;
    if (st.started && !st.over) {
      st.acc += dt;
      const speed = Math.max(0.055, 0.12 - st.score * 0.0025);
      while (st.acc >= speed) {
        st.acc -= speed;
        if (st.queue.length) st.dir = st.queue.shift()!;
        const head = { x: st.snake[0].x + st.dir.x, y: st.snake[0].y + st.dir.y };
        if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS || st.snake.some((p) => p.x === head.x && p.y === head.y)) {
          st.over = true;
          st.started = false;
          onEnd(st.score);
          break;
        }
        st.snake.unshift(head);
        if (head.x === st.food.x && head.y === st.food.y) {
          st.score++;
          onScore(st.score);
          place();
        } else st.snake.pop();
      }
    }
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    hud(ctx, "SNAKE.EXE", `SCORE ${String(st.score).padStart(3, "0")}`);
    ctx.strokeStyle = "rgba(95,214,192,0.12)";
    ctx.strokeRect(OX - 0.5, OY - 0.5, COLS * CELL + 1, ROWS * CELL + 1);
    if (st.snake.length) {
      ctx.fillStyle = C.ember;
      ctx.fillRect(OX + st.food.x * CELL + 3, OY + st.food.y * CELL + 3, CELL - 6, CELL - 6);
      st.snake.forEach((p, i) => {
        ctx.fillStyle = i === 0 ? C.white : C.accent;
        ctx.globalAlpha = Math.max(0.35, 1 - i / (st.snake.length + 6));
        ctx.fillRect(OX + p.x * CELL + 1, OY + p.y * CELL + 1, CELL - 2, CELL - 2);
      });
      ctx.globalAlpha = 1;
    }
    if (!st.started) centerText(ctx, st.over ? [{ text: "GAME OVER", size: 22, color: C.ember }, { text: `${st.score} bugs eaten` }, { text: "ENTER to play again", color: C.dim }] : [{ text: "SNAKE", size: 26 }, { text: "Arrows / WASD / swipe" }, { text: "ENTER to start", color: C.dim }]);
  });

  return <canvas ref={canvas} className="size-full" />;
}
