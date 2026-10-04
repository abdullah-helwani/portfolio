"use client";

import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from "three";

// One tile covers 16×16 world units. Building faces repeat it by their size.
export const TILE = 16;
const PX = 512;

type Facade = { map: CanvasTexture; emissive: CanvasTexture };

let cache: Facade[] | null = null;

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function makeFacade(variant: number): Facade {
  const base = document.createElement("canvas");
  const glow = document.createElement("canvas");
  base.width = base.height = glow.width = glow.height = PX;
  const b = base.getContext("2d")!;
  const g = glow.getContext("2d")!;
  const rand = rng(11 + variant * 97);

  b.fillStyle = "#c9d2d0";
  b.fillRect(0, 0, PX, PX);
  g.fillStyle = "#000";
  g.fillRect(0, 0, PX, PX);

  const unit = PX / TILE; // px per world unit
  const warm = ["#ffd9a0", "#ffe7c2", "#ffc983"];
  const cool = ["#9ff0e0", "#bfe9ff", "#d8e2ff"];

  if (variant === 0) {
    // punched windows on a 1.6u grid, 6 floors per tile
    const floor = TILE / 6;
    for (let fy = 0; fy < 6; fy++) {
      for (let fx = 0; fx < TILE / 1.6; fx++) {
        const x = fx * 1.6 * unit + unit * 0.35;
        const y = fy * floor * unit + unit * 0.6;
        const w = unit * 0.9;
        const h = unit * 1.35;
        b.fillStyle = "#1b2428";
        b.fillRect(x, y, w, h);
        if (rand() < 0.42) {
          const c = (rand() < 0.75 ? warm : cool)[Math.floor(rand() * 3)];
          g.fillStyle = c;
          g.globalAlpha = 0.55 + rand() * 0.45;
          g.fillRect(x, y, w, h);
          g.globalAlpha = 1;
        }
      }
    }
  } else if (variant === 1) {
    // glass curtain wall with mullions
    b.fillStyle = "#2a3a40";
    b.fillRect(0, 0, PX, PX);
    const band = TILE / 5;
    for (let fy = 0; fy < 5; fy++) {
      b.fillStyle = "#8a9a9a";
      b.fillRect(0, fy * band * unit, PX, unit * 0.25);
      for (let fx = 0; fx < TILE; fx++) {
        b.fillStyle = "#56676b";
        b.fillRect(fx * unit, fy * band * unit, unit * 0.06, band * unit);
        if (rand() < 0.3) {
          g.fillStyle = cool[Math.floor(rand() * 3)];
          g.globalAlpha = 0.35 + rand() * 0.4;
          g.fillRect(fx * unit + 2, fy * band * unit + unit * 0.3, unit - 4, unit * (band - 0.5));
          g.globalAlpha = 1;
        }
      }
    }
  } else {
    // tall slit windows, 5 floors per tile
    const floor = TILE / 5;
    for (let fy = 0; fy < 5; fy++) {
      for (let fx = 0; fx < TILE / 1.6; fx++) {
        const x = fx * 1.6 * unit + unit * 0.5;
        const y = fy * floor * unit + unit * 0.5;
        b.fillStyle = "#162024";
        b.fillRect(x, y, unit * 0.6, unit * 2.2);
        if (rand() < 0.38) {
          g.fillStyle = (rand() < 0.6 ? warm : ["#f0a0c8", "#c8b0ff", "#9ff0e0"])[Math.floor(rand() * 3)];
          g.globalAlpha = 0.5 + rand() * 0.5;
          g.fillRect(x, y, unit * 0.6, unit * 2.2);
          g.globalAlpha = 1;
        }
      }
    }
  }

  const map = new CanvasTexture(base);
  const emissive = new CanvasTexture(glow);
  for (const t of [map, emissive]) {
    t.wrapS = t.wrapT = RepeatWrapping;
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 4;
  }
  return { map, emissive };
}

export function facades() {
  if (!cache) cache = [0, 1, 2].map(makeFacade);
  return cache;
}

/** Clone a facade texture set for a face of size (w × h) world units. */
export function faceTextures(variant: number, w: number, h: number): { map: Texture; emissive: Texture } {
  const f = facades()[variant % 3];
  const map = f.map.clone();
  const emissive = f.emissive.clone();
  for (const t of [map, emissive]) {
    t.repeat.set(w / TILE, h / TILE);
    t.needsUpdate = true;
  }
  return { map, emissive };
}
