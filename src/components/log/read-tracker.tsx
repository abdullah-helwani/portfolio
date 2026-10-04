"use client";

import { useEffect } from "react";
import { useGameOptional } from "@/components/game/game-provider";

export function ReadTracker() {
  const game = useGameOptional();
  useEffect(() => {
    if (!game?.ready) return;
    const t = window.setTimeout(() => game.unlock("reader"), 1500);
    return () => window.clearTimeout(t);
  }, [game]);
  return null;
}
