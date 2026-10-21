"use client";

import { useEffect, useRef, useState } from "react";
import { C, H, W, centerText, hud, MONO, setupCanvas, useLoop, type GameProps } from "./engine";

const SNIPPETS = [
  "df = pd.read_csv('data.csv')",
  "model.fit(X_train, y_train)",
  "SELECT name FROM users WHERE active = 1;",
  "const [state, setState] = useState(0);",
  "for i in range(10): print(i ** 2)",
  "git commit -m 'ship it'",
  "export default function Page() {}",
  "loss = criterion(output, target)",
  "Widget build(BuildContext context)",
  "await fetch('/api/scores')",
  "y_pred = clf.predict(X_test)",
  "import numpy as np",
  "UPDATE projects SET live = true;",
  "np.mean(scores, axis=0)",
];
const DURATION = 30;

export function TypingGame({ onScore, onEnd }: GameProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [typed, setTyped] = useState("");
  const s = useRef({ state: "title" as "title" | "play" | "over", time: DURATION, line: SNIPPETS[0], next: SNIPPETS[1], correct: 0, errors: 0, wpm: 0, typed: "" });

  useEffect(() => {
    s.current.typed = typed;
  }, [typed]);

  const start = () => {
    const shuffled = [...SNIPPETS].sort(() => Math.random() - 0.5);
    s.current = { state: "play", time: DURATION, line: shuffled[0], next: shuffled[1], correct: 0, errors: 0, wpm: 0, typed: "" };
    setTyped("");
    onScore(0);
    input.current?.focus();
  };

  useLoop((dt) => {
    const ctx = setupCanvas(canvas.current);
    if (!ctx) return;
    const st = s.current;
    if (st.state === "play") {
      st.time -= dt;
      const elapsed = Math.max(1, DURATION - st.time);
      st.wpm = Math.round((st.correct / 5) / (elapsed / 60));
      if (st.time <= 0) {
        st.state = "over";
        st.time = 0;
        st.wpm = Math.round(st.correct / 5 / (DURATION / 60));
        onScore(st.wpm);
        onEnd(st.wpm);
      }
    }
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    hud(ctx, `CODE TYPER · ${Math.ceil(st.time)}s`, `${st.wpm} WPM`);
    if (st.state === "play") {
      ctx.font = `500 15px ${MONO}`;
      ctx.textBaseline = "middle";
      const x0 = 24;
      let x = x0;
      for (let i = 0; i < st.line.length; i++) {
        const ch = st.line[i];
        const t = st.typed[i];
        ctx.fillStyle = t === undefined ? "rgba(159,240,224,0.4)" : t === ch ? C.accent : C.ember;
        if (i === st.typed.length) {
          ctx.fillStyle = C.white;
          ctx.fillRect(x, 165, 9, 2);
          ctx.fillStyle = "rgba(232,238,236,0.85)";
        }
        ctx.fillText(ch, x, 150);
        x += ctx.measureText(ch).width;
      }
      ctx.font = `500 12px ${MONO}`;
      ctx.fillStyle = C.dim;
      ctx.fillText(`next: ${st.next}`, x0, 210);
      ctx.fillStyle = "rgba(95,214,192,0.15)";
      ctx.fillRect(x0, 270, W - x0 * 2, 4);
      ctx.fillStyle = C.accent;
      ctx.fillRect(x0, 270, (W - x0 * 2) * (st.time / DURATION), 4);
    }
    if (st.state === "title") centerText(ctx, [{ text: "CODE TYPER", size: 26 }, { text: "Type real code for 30 seconds" }, { text: "Click here, then start typing", color: C.dim }]);
    if (st.state === "over") centerText(ctx, [{ text: `${st.wpm} WPM`, size: 30 }, { text: `${st.correct} correct characters · ${st.errors} typos` }, { text: "Click to try again", color: C.dim }]);
  });

  return (
    <div className="relative size-full" onPointerDown={() => (s.current.state === "play" ? input.current?.focus() : start())}>
      <canvas ref={canvas} className="size-full" />
      <input
        ref={input}
        value={typed}
        aria-label="Type the code shown on screen"
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        className="absolute inset-x-0 bottom-0 h-8 opacity-0"
        onChange={(e) => {
          const st = s.current;
          if (st.state !== "play") return;
          const v = e.target.value;
          if (v.length > typed.length) {
            const i = v.length - 1;
            if (v[i] === st.line[i]) st.correct++;
            else st.errors++;
          }
          if (v.length >= st.line.length) {
            st.line = st.next;
            st.next = SNIPPETS[Math.floor(Math.random() * SNIPPETS.length)];
            setTyped("");
            return;
          }
          setTyped(v);
        }}
      />
    </div>
  );
}
