"use client";
/* eslint-disable react-hooks/immutability -- game state lives in a ref and is advanced every animation frame, by design. */

import { useRef } from "react";
import { C, H, W, canvasPoint, centerText, hud, MONO, setupCanvas, useKeys, useLoop, type GameProps } from "./engine";

const LABELS = ["TODO", "BUG", "LEGACY", "HACK", "FIXME", "TEMP"];
const ROW_COLORS = [C.ember, C.amber, C.pink, C.violet, C.accent, C.fg];
const COLS = 9;
const BW = (W - 24) / COLS;
const BH = 16;

function bricks(level: number) {
  const rows = Math.min(6, 3 + level);
  const out: { x: number; y: number; row: number; alive: boolean }[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < COLS; c++) out.push({ x: 12 + c * BW, y: 40 + r * (BH + 4), row: r, alive: true });
  return out;
}

export function BreakoutGame({ keys, onScore, onEnd }: GameProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const s = useRef({ px: W / 2, bx: W / 2, by: H - 40, vx: 0, vy: 0, stuck: true, bricks: bricks(1), level: 1, lives: 3, score: 0, left: false, right: false, state: "title" as "title" | "play" | "over" });

  const launch = () => {
    const st = s.current;
    if (st.state !== "play") {
      s.current = { ...st, bricks: bricks(1), level: 1, lives: 3, score: 0, state: "play", stuck: true };
      onScore(0);
      return;
    }
    if (st.stuck) {
      st.stuck = false;
      const speed = 250 + st.level * 25;
      st.vx = (Math.random() > 0.5 ? 1 : -1) * speed * 0.55;
      st.vy = -speed;
    }
  };

  useKeys(keys, (code, down) => {
    const st = s.current;
    if (code === "ArrowLeft" || code === "KeyA") st.left = down;
    if (code === "ArrowRight" || code === "KeyD") st.right = down;
    if (down && (code === "Space" || code === "Enter" || code === "ArrowUp")) launch();
  });

  useLoop((dt) => {
    const ctx = setupCanvas(canvas.current);
    if (!ctx) return;
    const st = s.current;
    const PW = 70;
    if (st.state === "play") {
      if (st.left) st.px -= 420 * dt;
      if (st.right) st.px += 420 * dt;
      st.px = Math.max(PW / 2, Math.min(W - PW / 2, st.px));
      if (st.stuck) {
        st.bx = st.px;
        st.by = H - 30;
      } else {
        st.bx += st.vx * dt;
        st.by += st.vy * dt;
        if (st.bx < 5 || st.bx > W - 5) {
          st.vx *= -1;
          st.bx = Math.max(5, Math.min(W - 5, st.bx));
        }
        if (st.by < 32) {
          st.vy = Math.abs(st.vy);
        }
        if (st.by > H - 26 && st.by < H - 14 && Math.abs(st.bx - st.px) < PW / 2 + 5 && st.vy > 0) {
          const hit = (st.bx - st.px) / (PW / 2);
          const speed = Math.hypot(st.vx, st.vy) * 1.02;
          st.vx = speed * hit * 0.85;
          st.vy = -Math.sqrt(Math.max(1, speed * speed - st.vx * st.vx));
        }
        for (const b of st.bricks) {
          if (!b.alive) continue;
          if (st.bx > b.x && st.bx < b.x + BW - 4 && st.by > b.y && st.by < b.y + BH) {
            b.alive = false;
            st.vy *= -1;
            st.score += 10 * (6 - b.row);
            onScore(st.score);
            break;
          }
        }
        if (st.bricks.every((b) => !b.alive)) {
          st.level++;
          st.bricks = bricks(st.level);
          st.stuck = true;
        }
        if (st.by > H + 10) {
          st.lives--;
          st.stuck = true;
          if (st.lives <= 0) {
            st.state = "over";
            onEnd(st.score);
          }
        }
      }
    }
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    hud(ctx, `BREAKOUT · LV ${st.level}`, `${"♥".repeat(Math.max(0, st.lives))}  ${String(st.score).padStart(4, "0")}`);
    ctx.font = `600 8px ${MONO}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const b of st.bricks) {
      if (!b.alive) continue;
      ctx.fillStyle = ROW_COLORS[b.row % ROW_COLORS.length];
      ctx.globalAlpha = 0.85;
      ctx.fillRect(b.x, b.y, BW - 4, BH);
      ctx.globalAlpha = 1;
      ctx.fillStyle = C.bg;
      ctx.fillText(LABELS[b.row % LABELS.length], b.x + (BW - 4) / 2, b.y + BH / 2 + 0.5);
    }
    ctx.textAlign = "left";
    ctx.fillStyle = C.white;
    ctx.fillRect(st.px - PW / 2, H - 20, PW, 6);
    ctx.beginPath();
    ctx.arc(st.bx, st.by, 5, 0, Math.PI * 2);
    ctx.fillStyle = C.accent;
    ctx.fill();
    if (st.state === "title") centerText(ctx, [{ text: "BREAKOUT", size: 26 }, { text: "Smash the legacy code" }, { text: "Mouse / arrows · SPACE to launch", color: C.dim }], H / 2 + 50);
    if (st.state === "over") centerText(ctx, [{ text: "GAME OVER", size: 22, color: C.ember }, { text: `${st.score} points` }, { text: "SPACE to play again", color: C.dim }], H / 2 + 40);
    if (st.state === "play" && st.stuck) centerText(ctx, [{ text: "SPACE or click to launch", color: C.dim, size: 12 }], H - 60);
  });

  return (
    <canvas
      ref={canvas}
      className="size-full touch-none"
      onPointerMove={(e) => {
        s.current.px = canvasPoint(e, e.currentTarget).x;
      }}
      onPointerDown={(e) => {
        s.current.px = canvasPoint(e, e.currentTarget).x;
        launch();
      }}
    />
  );
}
