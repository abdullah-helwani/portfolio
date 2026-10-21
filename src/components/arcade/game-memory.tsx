"use client";

import { useRef } from "react";
import { C, H, W, canvasPoint, centerText, hud, MONO, setupCanvas, useKeys, useLoop, type GameProps } from "./engine";

const WORDS = ["Python", "React", "SQL", "Flutter", "Next.js", "PyTorch", "Git", "Dart"];
const COLORS = [C.accent, C.ember, C.violet, C.amber, C.pink, C.fg, "#8fd16b", "#7cc7ff"];
const COLS = 4;
const ROWS = 4;
const CW = 104;
const CH = 64;
const GX = (W - COLS * CW - (COLS - 1) * 10) / 2;
const GY = 36;

type Card = { word: number; open: boolean; done: boolean; flip: number };

function deck(): Card[] {
  const ids = [...WORDS.keys(), ...WORDS.keys()].sort(() => Math.random() - 0.5);
  return ids.map((word) => ({ word, open: false, done: false, flip: 0 }));
}

export function MemoryGame({ keys, onScore, onEnd }: GameProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const s = useRef({ cards: [] as Card[], picks: [] as number[], moves: 0, time: 0, wait: 0, state: "title" as "title" | "play" | "won", score: 0, cursor: 0 });

  const start = () => {
    s.current = { cards: deck(), picks: [], moves: 0, time: 0, wait: 0, state: "play", score: 0, cursor: 0 };
    onScore(0);
  };
  const pick = (i: number) => {
    const st = s.current;
    if (st.state !== "play") return start();
    const c = st.cards[i];
    if (!c || c.open || c.done || st.wait > 0 || st.picks.length >= 2) return;
    c.open = true;
    st.picks.push(i);
    if (st.picks.length === 2) {
      st.moves++;
      const [a, b] = st.picks.map((k) => st.cards[k]);
      if (a.word === b.word) {
        a.done = b.done = true;
        st.picks = [];
        if (st.cards.every((x) => x.done)) {
          st.state = "won";
          st.score = Math.max(50, Math.round(1200 - st.moves * 25 - st.time * 6));
          onScore(st.score);
          onEnd(st.score);
        }
      } else st.wait = 0.8;
    }
  };

  useKeys(keys, (code, down) => {
    if (!down) return;
    const st = s.current;
    if (code === "Enter" || code === "Space") return st.state === "play" ? pick(st.cursor) : start();
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -COLS, ArrowDown: COLS };
    if (moves[code] !== undefined) st.cursor = (st.cursor + moves[code] + 16) % 16;
  });

  useLoop((dt) => {
    const ctx = setupCanvas(canvas.current);
    if (!ctx) return;
    const st = s.current;
    if (st.state === "play") {
      st.time += dt;
      if (st.wait > 0) {
        st.wait -= dt;
        if (st.wait <= 0) {
          st.picks.forEach((k) => (st.cards[k].open = false));
          st.picks = [];
        }
      }
    }
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    hud(ctx, `MEMORY · ${st.moves} moves`, `${Math.floor(st.time)}s`);
    st.cards.forEach((c, i) => {
      const target = c.open || c.done ? 1 : 0;
      c.flip += (target - c.flip) * Math.min(1, dt * 14);
      const x = GX + (i % COLS) * (CW + 10);
      const y = GY + Math.floor(i / COLS) * (CH + 8);
      const squeeze = Math.abs(Math.cos(c.flip * Math.PI));
      const w = CW * squeeze;
      const showFace = c.flip > 0.5;
      ctx.fillStyle = showFace ? (c.done ? "rgba(95,214,192,0.12)" : "rgba(232,238,236,0.08)") : "rgba(95,214,192,0.18)";
      ctx.fillRect(x + (CW - w) / 2, y, w, CH);
      ctx.strokeStyle = i === st.cursor && st.state === "play" ? C.white : showFace ? COLORS[c.word] : C.dim;
      ctx.strokeRect(x + (CW - w) / 2 + 0.5, y + 0.5, w - 1, CH - 1);
      if (squeeze > 0.2) {
        ctx.font = `600 ${showFace ? 13 : 18}px ${MONO}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = showFace ? COLORS[c.word] : C.dim;
        ctx.fillText(showFace ? WORDS[c.word] : "</>", x + CW / 2, y + CH / 2);
        ctx.textAlign = "left";
      }
    });
    if (st.state === "title") centerText(ctx, [{ text: "MEMORY", size: 26 }, { text: "Match the tech stack pairs" }, { text: "Click or ENTER to start", color: C.dim }]);
    if (st.state === "won") {
      ctx.fillStyle = "rgba(2,10,8,0.8)";
      ctx.fillRect(0, 26, W, H);
      centerText(ctx, [{ text: "ALL PAIRS FOUND", size: 22 }, { text: `${st.score} points · ${st.moves} moves` }, { text: "Click to play again", color: C.dim }]);
    }
  });

  return (
    <canvas
      ref={canvas}
      className="size-full touch-none"
      onPointerDown={(e) => {
        const p = canvasPoint(e, e.currentTarget);
        const col = Math.floor((p.x - GX) / (CW + 10));
        const row = Math.floor((p.y - GY) / (CH + 8));
        if (s.current.state !== "play") return start();
        if (col >= 0 && col < COLS && row >= 0 && row < ROWS) pick(row * COLS + col);
      }}
    />
  );
}
