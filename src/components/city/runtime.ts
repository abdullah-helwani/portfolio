"use client";

import { createContext, useContext } from "react";
import type { District, Station } from "./layout";

/**
 * Mutable per-frame state shared between the 3D scene and the DOM HUD.
 * Lives in a ref so the render loop never triggers React renders.
 */
export type Runtime = {
  keys: Set<string>;
  joy: { x: number; y: number };
  jumpQueued: boolean;
  sprint: boolean;
  paused: boolean;
  player: { x: number; z: number; y: number; vy: number; heading: number; speed: number; airborne: boolean };
  cam: { yaw: number; dist: number; pitch: number };
  taken: Set<string>; // orbs / monuments / stations seen
  bits: Set<number>;
  near: Station | null;
  district: District | null;
  talked: Set<number>;
  /** Live car footprints (half extents), written by the traffic each frame for collisions. */
  cars: { x: number; z: number; hw: number; hd: number }[];
  /** Who the player is chatting with right now (citizen id), -1 for nobody. */
  talking: number;
  events: {
    onNear: (s: Station | null) => void;
    onBit: (id: number) => void;
    onOrb: (id: string) => void;
    onMonument: (id: string) => void;
    onDistrict: (d: District | null) => void;
    onTalk: (id: number) => void;
  };
};

export function createRuntime(): Runtime {
  return {
    keys: new Set(),
    joy: { x: 0, y: 0 },
    jumpQueued: false,
    sprint: false,
    paused: true,
    player: { x: 0, z: 9, y: 0, vy: 0, heading: Math.PI, speed: 0, airborne: false },
    cam: { yaw: 0, dist: 24, pitch: 0.42 },
    taken: new Set(),
    bits: new Set(),
    near: null,
    district: null,
    talked: new Set(),
    cars: [],
    talking: -1,
    events: {
      onNear: () => {},
      onBit: () => {},
      onOrb: () => {},
      onMonument: () => {},
      onDistrict: () => {},
      onTalk: () => {},
    },
  };
}

export const RuntimeContext = createContext<Runtime | null>(null);

export function useRuntime() {
  const rt = useContext(RuntimeContext);
  if (!rt) throw new Error("useRuntime must be used inside the City canvas");
  return rt;
}
