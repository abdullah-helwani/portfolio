"use client";

import { useEffect, useState } from "react";
import { BreakoutGame } from "./game-breakout";
import { FlappyGame } from "./game-flappy";
import { MemoryGame } from "./game-memory";
import { SnakeGame } from "./game-snake";
import { TypingGame } from "./game-typing";
import { arcadeGames, type ArcadeGameId } from "./games";
import { useKeys, type GameProps, type KeyBus } from "./engine";
import { cn } from "@/lib/utils";

const components: Record<ArcadeGameId, (p: GameProps) => React.ReactNode> = {
  snake: SnakeGame,
  breakout: BreakoutGame,
  flappy: FlappyGame,
  memory: MemoryGame,
  typing: TypingGame,
};

const glyphs: Record<ArcadeGameId, string[]> = {
  snake: ["▪▪▪▪", "   ▪", " ● ▪"],
  breakout: ["▬▬▬▬", "▬▬▬▬", "  ●  ", " ▀▀ "],
  flappy: ["█   █", "  ■  ", "█   █"],
  memory: ["▣ ▢", "▢ ▣"],
  typing: ["> _", "{ }"],
};

const bootLines = ["AH-OS 2.0  (c) Helwani Systems", "Memory test ........ 640K OK", "Detecting neural co-processor ... found", "Mounting /arcade ................ done", "Starting desktop"];

export type Screen = { view: "boot" | "desktop" | "app"; app: ArcadeGameId };

export function ArcadeOS({
  keys,
  screen,
  setScreen,
  onScore,
  onEnd,
  power,
}: {
  keys: KeyBus;
  screen: Screen;
  setScreen: (s: Screen) => void;
  onScore: (game: ArcadeGameId, score: number) => void;
  onEnd: (game: ArcadeGameId, score: number) => void;
  power: boolean;
}) {
  const [lines, setLines] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [clock, setClock] = useState("");

  useEffect(() => {
    if (!power || screen.view !== "boot") return;
    let i = 0;
    const t = window.setInterval(() => {
      i++;
      setLines(i);
      if (i > bootLines.length) {
        window.clearInterval(t);
        setScreen({ ...screen, view: "desktop" });
      }
    }, 230);
    return () => window.clearInterval(t);
  }, [power, screen, setScreen]);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    tick();
    const t = window.setInterval(tick, 20_000);
    return () => window.clearInterval(t);
  }, []);

  useKeys(keys, (code, down) => {
    if (!down || screen.view !== "desktop") return;
    if (code === "ArrowRight" || code === "KeyD") setCursor((c) => (c + 1) % arcadeGames.length);
    if (code === "ArrowLeft" || code === "KeyA") setCursor((c) => (c - 1 + arcadeGames.length) % arcadeGames.length);
    if (code === "ArrowDown" || code === "KeyS") setCursor((c) => Math.min(arcadeGames.length - 1, c + 3));
    if (code === "ArrowUp" || code === "KeyW") setCursor((c) => Math.max(0, c - 3));
    if (code === "Enter" || code === "Space") setScreen({ view: "app", app: arcadeGames[cursor].id });
  });

  if (!power) return <div className="size-full bg-[#020a08]" />;

  if (screen.view === "boot") {
    return (
      <div className="size-full bg-[#020a08] p-5 font-mono text-[12px] leading-[1.8] text-[#9ff0e0]">
        {bootLines.slice(0, lines).map((l) => (
          <p key={l}>{l}</p>
        ))}
        <span className="inline-block h-3.5 w-2 animate-pulse bg-[#9ff0e0]" />
      </div>
    );
  }

  if (screen.view === "app") {
    const Game = components[screen.app];
    return (
      <div className="size-full">
        <Game key={screen.app} keys={keys} onScore={(s) => onScore(screen.app, s)} onEnd={(s) => onEnd(screen.app, s)} />
      </div>
    );
  }

  return (
    <div className="flex size-full flex-col bg-[radial-gradient(circle_at_30%_20%,#08302a,#020a08_70%)] font-mono text-[#9ff0e0]">
      <div className="flex items-center justify-between border-b border-[#5fd6c0]/30 px-3 py-1.5 text-[11px]">
        <span>■ AH-OS 2.0</span>
        <span className="text-[#5fd6c0]/70">arcade</span>
        <span>{clock}</span>
      </div>
      <div className="grid flex-1 grid-cols-3 content-center gap-x-3 gap-y-4 px-8">
        {arcadeGames.map((g, i) => (
          <button
            key={g.id}
            type="button"
            onMouseEnter={() => setCursor(i)}
            onClick={(e) => {
              e.stopPropagation();
              setScreen({ view: "app", app: g.id });
            }}
            className={cn("group grid justify-items-center gap-1.5 rounded-md p-2 text-center outline-none", cursor === i && "bg-[#5fd6c0]/15")}
          >
            <span aria-hidden="true" className={cn("grid h-[52px] w-[62px] place-items-center whitespace-pre rounded-md border text-[9px] leading-[1.15]", cursor === i ? "border-[#e8eeec] text-[#e8eeec]" : "border-[#5fd6c0]/50 text-[#5fd6c0]")}>
              {glyphs[g.id].join("\n")}
            </span>
            <span className="text-[11px]">{g.title.toUpperCase().replace(" ", "_")}.EXE</span>
          </button>
        ))}
      </div>
      <p className="px-3 pb-2 text-center text-[10px] text-[#5fd6c0]/60">click an app · arrows + ENTER · ESC to leave</p>
    </div>
  );
}
