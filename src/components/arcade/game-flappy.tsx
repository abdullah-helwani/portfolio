"use client";
/* eslint-disable react-hooks/immutability -- game state lives in a ref and is advanced every animation frame, by design. */

import { useRef } from "react";
import { C, H, W, centerText, hud, MONO, setupCanvas, useKeys, useLoop, type GameProps } from "./engine";

const GAP = 92;
const PIPE_W = 46;
const GRAVITY = 900;
const FLAP = -290;

export function FlappyGame({ keys, onScore, onEnd }: GameProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const s = useRef({ y: H / 2, vy: 0, pipes: [] as { x: number; gap: number; passed: boolean }[], t: 0, score: 0, state: "title" as "title" | "play" | "over", since: 0 });

  const flap = () => {
    const st = s.current;
    if (st.state === "over" && st.since < 0.5) return;
    if (st.state !== "play") {
      s.current = { y: H / 2, vy: FLAP, pipes: [], t: 1.2, score: 0, state: "play", since: 0 };
      onScore(0);
      return;
    }
    st.vy = FLAP;
  };

  useKeys(keys, (code, down) => {
    if (down && (code === "Space" || code === "ArrowUp" || code === "KeyW" || code === "Enter")) flap();
  });

  useLoop((dt) => {
    const ctx = setupCanvas(canvas.current);
    if (!ctx) return;
    const st = s.current;
    st.since += dt;
    if (st.state === "play") {
      st.vy += GRAVITY * dt;
      st.y += st.vy * dt;
      st.t += dt;
      const speed = 150 + Math.min(80, st.score * 4);
      if (st.t > 1.45) {
        st.t = 0;
        st.pipes.push({ x: W + 10, gap: 70 + Math.random() * (H - 140 - GAP), passed: false });
      }
      for (const p of st.pipes) {
        p.x -= speed * dt;
        if (!p.passed && p.x + PIPE_W < 90) {
          p.passed = true;
          st.score++;
          onScore(st.score);
        }
        const hitX = 90 + 10 > p.x && 90 - 10 < p.x + PIPE_W;
        if (hitX && (st.y - 9 < p.gap || st.y + 9 > p.gap + GAP)) st.state = "over";
      }
      st.pipes = st.pipes.filter((p) => p.x > -PIPE_W);
      if (st.y > H - 6 || st.y < 30) st.state = "over";
      if (st.state === "over") {
        st.since = 0;
        onEnd(st.score);
      }
    }
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    // firewall pipes
    ctx.font = `600 9px ${MONO}`;
    for (const p of st.pipes) {
      for (const [y0, y1] of [
        [30, p.gap],
        [p.gap + GAP, H],
      ]) {
        ctx.fillStyle = "rgba(240,119,63,0.18)";
        ctx.fillRect(p.x, y0, PIPE_W, y1 - y0);
        ctx.strokeStyle = C.ember;
        ctx.strokeRect(p.x + 0.5, y0 + 0.5, PIPE_W - 1, y1 - y0 - 1);
        ctx.fillStyle = C.ember;
        for (let y = y0 + 12; y < y1 - 4; y += 14) ctx.fillText("0101", p.x + 8, y);
      }
    }
    // the bit
    ctx.save();
    ctx.translate(90, st.y);
    ctx.rotate(Math.max(-0.5, Math.min(1, st.vy / 500)));
    ctx.fillStyle = C.accent;
    ctx.fillRect(-10, -9, 20, 18);
    ctx.fillStyle = C.bg;
    ctx.font = `700 12px ${MONO}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("1", 0, 1);
    ctx.restore();
    ctx.textAlign = "left";
    hud(ctx, "FLAPPY BIT", `PIPES ${String(st.score).padStart(3, "0")}`);
    if (st.state === "title") centerText(ctx, [{ text: "FLAPPY BIT", size: 26 }, { text: "Fly through the firewall" }, { text: "SPACE / click / tap to flap", color: C.dim }]);
    if (st.state === "over") centerText(ctx, [{ text: "PACKET LOST", size: 22, color: C.ember }, { text: `${st.score} pipes` }, { text: "SPACE to retry", color: C.dim }]);
  });

  return <canvas ref={canvas} className="size-full touch-none" onPointerDown={flap} />;
}
