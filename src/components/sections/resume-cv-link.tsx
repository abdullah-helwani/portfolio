"use client";

import type { ReactNode } from "react";
import { useGameOptional } from "@/components/game/game-provider";

export function CvLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const game = useGameOptional();
  return (
    <a href={href} target="_blank" rel="noreferrer" className={className} onClick={() => game?.unlock("recruiter")}>
      {children}
    </a>
  );
}
