// Procedural pixel-art renderer for the World. No image assets.

import type { Station } from "./layout";

export type Character = {
  name: string;
  color: string;
  accessory: "cap" | "headphones" | "none";
};

export const hoodieColors = ["#5fd6c0", "#f0773f", "#a9b8ff", "#f6c177"];

const PX = 4; // size of one "pixel"

const body = [
  "....hhhh....",
  "...hhhhhh...",
  "...hhhhhh...",
  "...hsssss...",
  "...ssesse...",
  "...sssss....",
  "....sss.....",
  "..cccccccc..",
  ".cccccccccc.",
  ".sccccccccs.",
  "..cccddccc..",
  "..pppppppp..",
];

const legs: Record<string, string[]> = {
  stand: ["..ppp..ppp..", "..pp....pp..", "..pp....pp..", "..bbb...bbb."],
  strideA: ["...pppppp...", "..pp...pp...", ".pp.....pp..", ".bb.....bbb."],
  pass: ["...pppppp...", "....pppp....", "....pppp....", "...bbbbbb..."],
  strideB: ["...pppppp...", "...pp...pp..", "..pp.....pp.", ".bbb.....bb."],
  jump: ["..pppppppp..", "..pp....pp..", ".bb......bb.", "............"],
};

function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amount));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (n & 255) + amount));
  return `rgb(${r},${g},${b})`;
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  ground: number,
  char: Character,
  state: { facing: 1 | -1; frame: string; bob: number; airborne: boolean },
  font: string,
) {
  const rows = [...body, ...legs[state.frame]];
  const colors: Record<string, string> = {
    h: "#2a1d17",
    s: "#c98b62",
    e: "#101314",
    c: char.color,
    d: shade(char.color, -60),
    p: "#2d3a52",
    b: "#e8eeec",
  };
  const w = 12 * PX;
  const h = rows.length * PX;
  const top = ground - h + state.bob;

  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  const shadowScale = state.airborne ? 0.6 : 1;
  ctx.beginPath();
  ctx.ellipse(x, ground + 2, 18 * shadowScale, 4 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(x, top);
  ctx.scale(state.facing, 1);
  ctx.translate(-w / 2, 0);
  rows.forEach((row, ry) => {
    for (let rx = 0; rx < row.length; rx++) {
      const c = colors[row[rx]];
      if (!c) continue;
      ctx.fillStyle = c;
      ctx.fillRect(rx * PX, ry * PX, PX, PX);
    }
  });
  // accessories
  if (char.accessory === "cap") {
    ctx.fillStyle = shade(char.color, -30);
    ctx.fillRect(3 * PX, -1 * PX, 6 * PX, 2 * PX);
    ctx.fillRect(3 * PX, 1 * PX, 8 * PX, PX);
  } else if (char.accessory === "headphones") {
    ctx.fillStyle = "#e8eeec";
    ctx.fillRect(3 * PX, -1 * PX, 6 * PX, PX);
    ctx.fillStyle = "#1a1f22";
    ctx.fillRect(2 * PX, 2 * PX, 2 * PX, 3 * PX);
    ctx.fillRect(8 * PX, 2 * PX, 2 * PX, 3 * PX);
  }
  ctx.restore();

  // name tag
  ctx.font = `600 11px ${font}`;
  ctx.textAlign = "center";
  const label = char.name || "Visitor";
  const tw = ctx.measureText(label).width + 12;
  ctx.fillStyle = "rgba(9,11,12,0.75)";
  roundRect(ctx, x - tw / 2, top - 26, tw, 18, 9);
  ctx.fill();
  ctx.fillStyle = "#e8eeec";
  ctx.fillText(label, x, top - 13);
}

export function drawDrone(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, facing: number) {
  ctx.save();
  ctx.translate(x, y);
  // glow
  const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 30);
  g.addColorStop(0, "rgba(95,214,192,0.35)");
  g.addColorStop(1, "rgba(95,214,192,0)");
  ctx.fillStyle = g;
  ctx.fillRect(-30, -30, 60, 60);
  // body
  ctx.fillStyle = "#e8eeec";
  roundRect(ctx, -11, -8, 22, 16, 6);
  ctx.fill();
  ctx.fillStyle = "#101314";
  roundRect(ctx, -7, -4, 14, 8, 3);
  ctx.fill();
  ctx.fillStyle = "#5fd6c0";
  const blink = Math.sin(t * 0.004) > 0.97 ? 1 : 4;
  ctx.fillRect(-4 + facing * 2, -2, 3, blink);
  ctx.fillRect(1 + facing * 2, -2, 3, blink);
  // rotor
  ctx.fillStyle = "rgba(232,238,236,0.6)";
  const spin = Math.abs(Math.sin(t * 0.04)) * 12 + 2;
  ctx.fillRect(-spin / 2, -13, spin, 2);
  ctx.fillRect(-1, -12, 2, 4);
  ctx.restore();
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else line = test;
  }
  if (lines.length < maxLines && line) lines.push(line);
  return lines;
}

export type Background = {
  stars: { x: number; y: number; r: number; p: number }[];
  mountains: number[];
  city: { x: number; w: number; h: number; lit: number[] }[];
};

export function makeBackground(width: number): Background {
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const stars = Array.from({ length: 140 }, () => ({ x: rnd() * 2400, y: rnd() * 0.55, r: rnd() * 1.4 + 0.3, p: rnd() * 6 }));
  const mountains: number[] = [];
  let h = 0.5;
  for (let i = 0; i < Math.ceil((width * 0.25 + 2400) / 60); i++) {
    h = Math.max(0.2, Math.min(0.95, h + (rnd() - 0.5) * 0.35));
    mountains.push(h);
  }
  const city: Background["city"] = [];
  for (let cx = 0; cx < width * 0.5 + 2400; ) {
    const w = 40 + rnd() * 70;
    const bh = 60 + rnd() * 150;
    const lit: number[] = [];
    for (let i = 0; i < 24; i++) if (rnd() > 0.72) lit.push(i);
    city.push({ x: cx, w, h: bh, lit });
    cx += w + 8 + rnd() * 30;
  }
  return { stars, mountains, city };
}

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  bg: Background,
  cam: number,
  W: number,
  H: number,
  ground: number,
  t: number,
) {
  const sky = ctx.createLinearGradient(0, 0, 0, ground);
  sky.addColorStop(0, "#06080a");
  sky.addColorStop(1, "#0d1a1a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, ground);

  // stars
  for (const s of bg.stars) {
    const sx = (((s.x - cam * 0.04) % 2400) + 2400) % 2400;
    if (sx > W) continue;
    ctx.globalAlpha = 0.35 + Math.sin(t * 0.0015 + s.p) * 0.3;
    ctx.fillStyle = "#e8eeec";
    ctx.fillRect(sx, s.y * ground, s.r, s.r);
  }
  ctx.globalAlpha = 1;

  // aurora ribbons
  for (let band = 0; band < 2; band++) {
    ctx.beginPath();
    const baseY = ground * (0.22 + band * 0.12);
    for (let x = 0; x <= W; x += 24) {
      const wx = x + cam * 0.08;
      const y = baseY + Math.sin(wx * 0.004 + t * 0.0004 + band) * 30 + Math.sin(wx * 0.011 - t * 0.0006) * 12;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = band === 0 ? "rgba(95,214,192,0.07)" : "rgba(240,119,63,0.035)";
    ctx.lineWidth = 46;
    ctx.stroke();
  }

  // mountains
  ctx.fillStyle = "#0e1718";
  ctx.beginPath();
  ctx.moveTo(0, ground);
  const mOff = cam * 0.2;
  const start = Math.floor(mOff / 60);
  for (let i = start; i < start + Math.ceil(W / 60) + 2; i++) {
    const hgt = bg.mountains[i % bg.mountains.length];
    ctx.lineTo(i * 60 - mOff, ground - 60 - hgt * 160);
  }
  ctx.lineTo(W, ground);
  ctx.fill();

  // city
  const cOff = cam * 0.45;
  for (const b of bg.city) {
    const bx = b.x - cOff;
    if (bx > W || bx + b.w < 0) continue;
    ctx.fillStyle = "#0b1213";
    ctx.fillRect(bx, ground - b.h, b.w, b.h);
    ctx.fillStyle = "rgba(246,193,119,0.45)";
    const cols = Math.floor(b.w / 14);
    for (const i of b.lit) {
      const cx = i % Math.max(cols, 1);
      const cy = Math.floor(i / Math.max(cols, 1));
      if (cy * 18 + 20 > b.h) continue;
      ctx.fillRect(bx + 6 + cx * 14, ground - b.h + 12 + cy * 18, 5, 7);
    }
  }
}

export function drawGround(ctx: CanvasRenderingContext2D, cam: number, W: number, H: number, ground: number) {
  ctx.fillStyle = "#0f1517";
  ctx.fillRect(0, ground, W, H - ground);
  ctx.fillStyle = "#2c6b60";
  ctx.fillRect(0, ground, W, 4);
  ctx.fillStyle = "#1a2a2b";
  ctx.fillRect(0, ground + 4, W, 4);
  // dirt flecks
  ctx.fillStyle = "#16201f";
  const off = cam % 48;
  for (let x = -off; x < W; x += 48) {
    ctx.fillRect(x + 8, ground + 18, 8, 4);
    ctx.fillRect(x + 30, ground + 34, 4, 4);
    ctx.fillRect(x + 20, ground + 54, 8, 4);
  }
}

export function drawLamp(ctx: CanvasRenderingContext2D, x: number, ground: number) {
  const g = ctx.createRadialGradient(x, ground - 150, 4, x, ground - 150, 120);
  g.addColorStop(0, "rgba(246,193,119,0.22)");
  g.addColorStop(1, "rgba(246,193,119,0)");
  ctx.fillStyle = g;
  ctx.fillRect(x - 120, ground - 270, 240, 270);
  ctx.fillStyle = "#1f272a";
  ctx.fillRect(x - 3, ground - 150, 6, 150);
  ctx.fillRect(x - 12, ground - 6, 24, 6);
  ctx.fillStyle = "#f6c177";
  ctx.fillRect(x - 8, ground - 162, 16, 12);
}

export function drawStation(
  ctx: CanvasRenderingContext2D,
  s: Station,
  x: number,
  ground: number,
  t: number,
  opts: { near: boolean; done: boolean; font: string; serif: string },
) {
  const { near, done, font } = opts;
  switch (s.kind) {
    case "sign": {
      ctx.fillStyle = "#2a2018";
      ctx.fillRect(x - 4, ground - 90, 8, 90);
      ctx.fillStyle = "#3b2c20";
      roundRect(ctx, x - 100, ground - 150, 200, 66, 8);
      ctx.fill();
      ctx.strokeStyle = "#f0773f";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#f6c177";
      ctx.textAlign = "center";
      ctx.font = `700 14px ${font}`;
      ctx.fillText(s.lines[0], x, ground - 120);
      ctx.font = `500 11px ${font}`;
      ctx.fillStyle = "#e8eeec";
      ctx.fillText(s.lines[1] ?? "", x, ground - 100);
      break;
    }
    case "house": {
      const w = 260;
      const left = x - w / 2;
      // body
      ctx.fillStyle = "#1c2326";
      ctx.fillRect(left, ground - 150, w, 150);
      ctx.fillStyle = "#232c30";
      ctx.fillRect(left, ground - 150, w, 8);
      // roof
      ctx.fillStyle = "#b5532a";
      ctx.beginPath();
      ctx.moveTo(left - 20, ground - 146);
      ctx.lineTo(x, ground - 236);
      ctx.lineTo(left + w + 20, ground - 146);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#f0773f";
      ctx.fillRect(left - 20, ground - 150, w + 40, 6);
      // chimney + smoke
      ctx.fillStyle = "#1c2326";
      ctx.fillRect(left + w - 70, ground - 228, 24, 50);
      for (let i = 0; i < 3; i++) {
        const p = ((t * 0.0004 + i / 3) % 1);
        ctx.fillStyle = `rgba(232,238,236,${0.18 * (1 - p)})`;
        ctx.beginPath();
        ctx.arc(left + w - 58 + Math.sin(p * 6) * 8, ground - 236 - p * 80, 8 + p * 10, 0, Math.PI * 2);
        ctx.fill();
      }
      // windows
      const glow = near ? "#9ff0e0" : "#5fd6c0";
      ctx.fillStyle = glow;
      ctx.fillRect(left + 26, ground - 104, 50, 40);
      ctx.fillRect(left + w - 76, ground - 104, 50, 40);
      ctx.fillStyle = "#1c2326";
      ctx.fillRect(left + 49, ground - 104, 4, 40);
      ctx.fillRect(left + w - 53, ground - 104, 4, 40);
      // door
      ctx.fillStyle = "#3b2c20";
      ctx.fillRect(x - 24, ground - 80, 48, 80);
      ctx.fillStyle = "#f6c177";
      ctx.fillRect(x + 12, ground - 42, 5, 5);
      // plaque
      ctx.fillStyle = "#e8eeec";
      ctx.font = `700 12px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText("ABOUT ME", x, ground - 126);
      break;
    }
    case "gate": {
      ctx.fillStyle = "#b5532a";
      ctx.fillRect(x - 70, ground - 170, 12, 170);
      ctx.fillRect(x + 58, ground - 170, 12, 170);
      ctx.fillStyle = "#f0773f";
      ctx.fillRect(x - 96, ground - 186, 192, 14);
      ctx.fillRect(x - 80, ground - 150, 160, 10);
      ctx.fillStyle = "#e8eeec";
      ctx.font = `700 12px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText("SKILL DOJO", x, ground - 194);
      break;
    }
    case "orb": {
      const y = ground - s.lift - Math.sin(t * 0.003 + x) * 6;
      // pedestal
      ctx.fillStyle = "#1c2326";
      ctx.fillRect(x - 16, ground - 18, 32, 18);
      ctx.fillStyle = "#273034";
      ctx.fillRect(x - 20, ground - 22, 40, 6);
      if (!done) {
        const g = ctx.createRadialGradient(x, y, 2, x, y, 42);
        g.addColorStop(0, `${s.color}aa`);
        g.addColorStop(1, `${s.color}00`);
        ctx.fillStyle = g;
        ctx.fillRect(x - 42, y - 42, 84, 84);
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fillRect(x - 7, y - 8, 5, 5);
      } else {
        ctx.strokeStyle = `${s.color}66`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = done ? "rgba(232,238,236,0.4)" : "#e8eeec";
      ctx.font = `600 10px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText(s.skill.name.toUpperCase(), x, ground + 26);
      ctx.fillStyle = s.color;
      ctx.fillText(`LV ${s.skill.level}`, x, ground + 40);
      break;
    }
    case "post": {
      ctx.fillStyle = "#2a2018";
      ctx.fillRect(x - 3, ground - 100, 6, 100);
      ctx.fillStyle = done ? "#2d3a3b" : "#3b2c20";
      roundRect(ctx, x - 80, ground - 166, 160, 68, 6);
      ctx.fill();
      ctx.fillStyle = "#5fd6c0";
      ctx.font = `700 10px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText(s.milestone.date.toUpperCase(), x, ground - 148);
      ctx.fillStyle = "#e8eeec";
      ctx.font = `600 11px ${font}`;
      wrapText(ctx, s.milestone.title, 146, 2).forEach((l, i) => ctx.fillText(l, x, ground - 130 + i * 14));
      break;
    }
    case "kiosk": {
      const w = 190;
      const left = x - w / 2;
      // pillar
      ctx.fillStyle = "#1c2326";
      ctx.fillRect(x - 10, ground - 70, 20, 70);
      ctx.fillRect(x - 40, ground - 8, 80, 8);
      // screen frame
      if (near) {
        const g = ctx.createRadialGradient(x, ground - 140, 10, x, ground - 140, 160);
        g.addColorStop(0, `${s.color}40`);
        g.addColorStop(1, `${s.color}00`);
        ctx.fillStyle = g;
        ctx.fillRect(x - 160, ground - 300, 320, 300);
      }
      ctx.fillStyle = "#273034";
      roundRect(ctx, left, ground - 200, w, 132, 10);
      ctx.fill();
      ctx.fillStyle = "#04100e";
      roundRect(ctx, left + 8, ground - 192, w - 16, 116, 6);
      ctx.fill();
      // screen content
      ctx.fillStyle = s.color;
      ctx.fillRect(left + 18, ground - 180, 30, 4);
      ctx.font = `700 13px ${font}`;
      ctx.textAlign = "left";
      ctx.fillStyle = "#e8eeec";
      wrapText(ctx, s.project.title, w - 40, 2).forEach((l, i) => ctx.fillText(l, left + 18, ground - 158 + i * 16));
      ctx.font = `500 10px ${font}`;
      ctx.fillStyle = "rgba(232,238,236,0.6)";
      wrapText(ctx, s.project.kicker, w - 40, 2).forEach((l, i) => ctx.fillText(l, left + 18, ground - 118 + i * 13));
      // scanline shimmer
      const scan = ((t * 0.06) % 116) | 0;
      ctx.fillStyle = "rgba(95,214,192,0.08)";
      ctx.fillRect(left + 8, ground - 192 + scan, w - 16, 3);
      if (done) {
        ctx.fillStyle = "#5fd6c0";
        ctx.beginPath();
        ctx.arc(left + w - 14, ground - 196, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#062520";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(left + w - 18, ground - 196);
        ctx.lineTo(left + w - 15, ground - 193);
        ctx.lineTo(left + w - 10, ground - 200);
        ctx.stroke();
      }
      break;
    }
    case "board": {
      const w = 230;
      const left = x - w / 2;
      ctx.fillStyle = "#2a2018";
      ctx.fillRect(left + 20, ground - 70, 8, 70);
      ctx.fillRect(left + w - 28, ground - 70, 8, 70);
      ctx.fillStyle = "#5a4330";
      roundRect(ctx, left, ground - 200, w, 136, 6);
      ctx.fill();
      ctx.fillStyle = "#6e5338";
      roundRect(ctx, left + 8, ground - 192, w - 16, 120, 4);
      ctx.fill();
      const colors = { shipped: "#5fd6c0", building: "#f6c177", planned: "#a9b8ff" } as const;
      s.posts.slice(0, 3).forEach((p, i) => {
        const nx = left + 18 + i * 68;
        const ny = ground - 180 + (i % 2) * 10;
        ctx.save();
        ctx.translate(nx + 28, ny + 34);
        ctx.rotate((i - 1) * 0.06);
        ctx.fillStyle = colors[p.status];
        ctx.fillRect(-28, -34, 56, 64);
        ctx.fillStyle = "rgba(6,20,18,0.85)";
        ctx.font = `700 8px ${font}`;
        ctx.textAlign = "left";
        wrapText(ctx, p.title, 46, 4).forEach((l, j) => ctx.fillText(l, -23, -20 + j * 10));
        ctx.fillStyle = "#b5532a";
        ctx.beginPath();
        ctx.arc(0, -30, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      ctx.fillStyle = "#e8eeec";
      ctx.font = `700 12px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText("BUILD LOG", x, ground - 210);
      break;
    }
    case "arcade": {
      ctx.fillStyle = "#2d2147";
      ctx.fillRect(x - 40, ground - 170, 80, 170);
      ctx.fillStyle = "#a9b8ff";
      ctx.fillRect(x - 40, ground - 176, 80, 10);
      ctx.fillStyle = "#04100e";
      ctx.fillRect(x - 30, ground - 150, 60, 50);
      // tiny snake animation
      const step = Math.floor(t / 180) % 10;
      ctx.fillStyle = "#5fd6c0";
      for (let i = 0; i < 4; i++) ctx.fillRect(x - 24 + ((step + i) % 10) * 5, ground - 128, 4, 4);
      ctx.fillStyle = "#f0773f";
      ctx.fillRect(x + 18, ground - 140, 4, 4);
      ctx.fillStyle = "#1f1733";
      ctx.fillRect(x - 36, ground - 92, 72, 22);
      ctx.fillStyle = "#f0773f";
      ctx.beginPath();
      ctx.arc(x - 16, ground - 82, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#5fd6c0";
      ctx.fillRect(x + 6, ground - 86, 6, 6);
      ctx.fillRect(x + 16, ground - 86, 6, 6);
      ctx.fillStyle = "#e8eeec";
      ctx.font = `700 10px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText("ARCADE", x, ground - 182);
      break;
    }
    case "mailbox": {
      ctx.fillStyle = "#2a2018";
      ctx.fillRect(x - 4, ground - 70, 8, 70);
      ctx.fillStyle = "#b5532a";
      roundRect(ctx, x - 30, ground - 110, 60, 42, 14);
      ctx.fill();
      ctx.fillStyle = "#101314";
      ctx.fillRect(x - 18, ground - 94, 30, 4);
      // flag
      ctx.fillStyle = "#1f272a";
      ctx.fillRect(x + 28, ground - 128, 4, 40);
      ctx.fillStyle = done ? "#5fd6c0" : "#f6c177";
      const wave = Math.sin(t * 0.006) * 2;
      ctx.fillRect(x + 32, ground - 128 + wave, 18, 10);
      ctx.fillStyle = "#e8eeec";
      ctx.font = `700 10px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText("CONTACT", x, ground - 136);
      break;
    }
    case "flag": {
      ctx.fillStyle = "#e8eeec";
      ctx.fillRect(x - 3, ground - 230, 6, 230);
      ctx.fillStyle = "#1f272a";
      ctx.fillRect(x - 16, ground - 10, 32, 10);
      ctx.beginPath();
      ctx.moveTo(x + 3, ground - 226);
      for (let i = 0; i <= 10; i++) {
        ctx.lineTo(x + 3 + i * 8, ground - 226 + Math.sin(t * 0.008 + i * 0.7) * 4);
      }
      for (let i = 10; i >= 0; i--) {
        ctx.lineTo(x + 3 + i * 8, ground - 180 + Math.sin(t * 0.008 + i * 0.7) * 4);
      }
      ctx.closePath();
      ctx.fillStyle = done ? "#5fd6c0" : "#f0773f";
      ctx.fill();
      ctx.fillStyle = "#e8eeec";
      ctx.font = `700 11px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText("THE END?", x, ground - 240);
      break;
    }
  }
}

export function drawBit(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  const s = 6 + Math.sin(t * 0.008 + x) * 1.2;
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 0.004 + x * 0.1) * 3);
  ctx.rotate(Math.PI / 4);
  ctx.shadowColor = "#5fd6c0";
  ctx.shadowBlur = 10;
  ctx.fillStyle = "#9ff0e0";
  ctx.fillRect(-s / 2, -s / 2, s, s);
  ctx.restore();
}

export function drawPrompt(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, font: string, t: number) {
  ctx.font = `600 11px ${font}`;
  ctx.textAlign = "center";
  const w = ctx.measureText(label).width + 40;
  const by = y + Math.sin(t * 0.006) * 3;
  ctx.fillStyle = "rgba(9,11,12,0.85)";
  roundRect(ctx, x - w / 2, by - 24, w, 26, 13);
  ctx.fill();
  ctx.strokeStyle = "rgba(95,214,192,0.6)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#5fd6c0";
  roundRect(ctx, x - w / 2 + 5, by - 19, 18, 16, 4);
  ctx.fill();
  ctx.fillStyle = "#062520";
  ctx.fillText("E", x - w / 2 + 14, by - 7);
  ctx.fillStyle = "#e8eeec";
  ctx.textAlign = "left";
  ctx.fillText(label, x - w / 2 + 28, by - 7);
}
