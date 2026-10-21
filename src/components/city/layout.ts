// Procedural city plan, generated deterministically from the site content.
// Coordinates: x → east, z → south, y → up. One unit ≈ one metre.

import type { CityPlace, Content, Milestone, Post, Project, SkillClass } from "@/lib/site";

export const BLOCK = 30; // block size (incl. sidewalk)
export const PITCH = 40; // block + road
export const ROAD = PITCH - BLOCK;
export const HALF_MAP = 118;
export const GRID = [-80, -40, 0, 40, 80];
export const ROAD_LINES = [-100, -60, -20, 20, 60, 100];

export const accent = ["#5fd6c0", "#f0773f", "#a9b8ff", "#f6c177", "#e58fb6", "#8fd16b", "#7cc7ff"];

export type Box = { x: number; z: number; w: number; d: number; h: number }; // centre + footprint + height, axis aligned

export type District =
  | "plaza"
  | "about"
  | "academy"
  | "park"
  | "news"
  | "arcade"
  | "post"
  | "projects"
  | "avenue"
  | "downtown";

export const districtInfo: Record<District, { name: string; hint: string; color: string }> = {
  plaza: { name: "Central Plaza", hint: "Welcome to the city. Explore every district.", color: "#5fd6c0" },
  about: { name: "Helwani Residence", hint: "Step inside to learn who lives here.", color: "#f0773f" },
  academy: { name: "Skill Academy", hint: "Collect the six class orbs.", color: "#a9b8ff" },
  park: { name: "Journey Park", hint: "Walk past the monuments to read the story.", color: "#8fd16b" },
  news: { name: "Daily Log Newsroom", hint: "What's shipped, building and next.", color: "#f6c177" },
  arcade: { name: "Neon Arcade", hint: "Insert coin.", color: "#e58fb6" },
  post: { name: "Post Office", hint: "Send a letter straight to my inbox.", color: "#7cc7ff" },
  projects: { name: "Project District", hint: "Every tower is something I built.", color: "#5fd6c0" },
  avenue: { name: "Maker's Avenue", hint: "Everything else I've made. Step inside.", color: "#f6c177" },
  downtown: { name: "Downtown", hint: "Keep walking. There's more to find.", color: "#8b9794" },
};

export type Station =
  | { kind: "house"; id: "about"; x: number; z: number; label: string }
  | { kind: "kiosk"; id: string; x: number; z: number; label: string; project: Project; color: string }
  | { kind: "board"; id: "log"; x: number; z: number; label: string; posts: Post[] }
  | { kind: "arcade"; id: "arcade"; x: number; z: number; label: string }
  | { kind: "mailbox"; id: "contact"; x: number; z: number; label: string }
  | { kind: "place"; id: string; x: number; z: number; label: string; place: CityPlace }
  | { kind: "guide"; id: "guide"; x: number; z: number; label: string };

export type Tower = {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  variant: number;
  tint: string;
  antenna: boolean;
  /** Base elevation, for setback tiers stacked on a podium. */
  y0?: number;
  sign?: { text: string; color: string };
};

export type PlaceBuilding = { place: CityPlace; x: number; z: number; w: number; d: number; h: number };
export type Pond = { x: number; z: number; r: number };
export type Parking = { x: number; z: number; w: number; d: number; cars: { x: number; z: number; rot: number; color: string }[] };

export type ProjectTower = Tower & { project: Project; color: string; door: { x: number; z: number; face: number } };

export type Orb = { id: string; x: number; z: number; skill: SkillClass; color: string };
export type Monument = { id: string; x: number; z: number; milestone: Milestone; rot: number };
export type Bit = { id: number; x: number; z: number; y: number };
export type Car = { axis: "x" | "z"; line: number; lane: number; dir: 1 | -1; speed: number; offset: number; color: string };
export type Walker = { id: number; cx: number; cz: number; half: number; speed: number; offset: number; color: string; hair: string; line: string };
export type Tree = { x: number; z: number; s: number };

export type CityPlan = {
  blocks: { x: number; z: number; district: District }[];
  places: PlaceBuilding[];
  ponds: Pond[];
  parking: Parking[];
  benches: { x: number; z: number; rot: number }[];
  guide: { x: number; z: number; heading: number } | null;
  spawn: { x: number; z: number; heading: number };
  towers: Tower[];
  projectTowers: ProjectTower[];
  stations: Station[];
  orbs: Orb[];
  monuments: Monument[];
  bits: Bit[];
  cars: Car[];
  walkers: Walker[];
  trees: Tree[];
  lamps: { x: number; z: number }[];
  colliders: Box[];
  billboards: { x: number; z: number; y: number; rot: number; text: string; sub: string; color: string }[];
};

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

export function districtAt(plan: CityPlan, x: number, z: number): District | null {
  for (const b of plan.blocks) {
    if (Math.abs(x - b.x) <= BLOCK / 2 + 2 && Math.abs(z - b.z) <= BLOCK / 2 + 2) return b.district;
  }
  return null;
}

const tips = [
  "The Skill Academy is east of the plaza. Grab every orb!",
  "Each tower up north is one of Abdullah's projects.",
  "Heard the arcade has a Snake high score to beat.",
  "Drop a letter at the Post Office down south. He reads them all.",
  "Journey Park tells the whole story, monument by monument.",
  "Those little crystals? Bits. Collect 30 for a prize.",
  "The newsroom posts what he shipped and what's next.",
  "Try sprinting with Shift. The city is bigger than it looks.",
  "Lost? Open the map in the corner.",
  "Nice hoodie, by the way.",
];

export function buildCity(content: Content): CityPlan {
  const rand = rng(42);
  const towers: Tower[] = [];
  const projectTowers: ProjectTower[] = [];
  const stations: Station[] = [];
  const colliders: Box[] = [];
  const trees: Tree[] = [];
  const blocks: CityPlan["blocks"] = [];

  const projects = content.projects.filter((p) => p.visible);
  const projectSlots = [
    [0, -40],
    [-40, -40],
    [40, -40],
    [0, -80],
    [-40, -80],
    [40, -80],
    [-80, -40],
    [80, -40],
    [-80, -80],
    [80, -80],
  ];

  const fixed: Record<string, District> = {
    "0,0": "plaza",
    "-40,0": "about",
    "40,0": "academy",
    "0,40": "park",
    "-40,40": "news",
    "40,40": "arcade",
    "0,80": "post",
  };
  projectSlots.slice(0, Math.max(projects.length, 3)).forEach(([x, z]) => (fixed[`${x},${z}`] = "projects"));

  for (const x of GRID) {
    for (const z of GRID) {
      const district = fixed[`${x},${z}`] ?? "downtown";
      blocks.push({ x, z, district });
    }
  }

  // ---- landmarks ----
  // About house
  colliders.push({ x: -40, z: -3, w: 14, d: 10, h: 12 });
  stations.push({ kind: "house", id: "about", x: -40, z: 4, label: "Helwani Residence" });
  for (const [tx, tz] of [[-50, 8], [-30, 9], [-51, -9], [-29, -10], [-46, 11]]) trees.push({ x: tx, z: tz, s: 0.9 + rand() * 0.4 });

  // Academy hall
  colliders.push({ x: 40, z: -9, w: 18, d: 9, h: 14 });
  const orbs: Orb[] = content.skills.slice(0, 8).map((skill, i, arr) => {
    const a = (i / arr.length) * Math.PI * 2 + Math.PI / 2;
    return { id: `orb-${skill.id}`, x: 40 + Math.cos(a) * 8, z: 3 + Math.sin(a) * 6, skill, color: accent[i % accent.length] };
  });

  // News, arcade, post
  colliders.push({ x: -40, z: 37, w: 16, d: 10, h: 9 });
  stations.push({ kind: "board", id: "log", x: -40, z: 44.5, label: "Daily Log Newsroom", posts: content.posts.filter((p) => p.published) });
  colliders.push({ x: 40, z: 37, w: 16, d: 11, h: 9.5 });
  stations.push({ kind: "arcade", id: "arcade", x: 40, z: 45, label: "Neon Arcade" });
  colliders.push({ x: 0, z: 76, w: 16, d: 10, h: 8.5 });
  stations.push({ kind: "mailbox", id: "contact", x: 0, z: 84, label: "Post Office" });

  // Plaza fountain
  colliders.push({ x: 0, z: 0, w: 7, d: 7, h: 3 });
  for (const [tx, tz] of [[-11, -11], [11, -11], [-11, 11], [11, 11]]) trees.push({ x: tx, z: tz, s: 1.1 });

  // Journey park: monuments along an S-curve
  const monuments: Monument[] = content.journey.map((milestone, i, arr) => {
    const t = arr.length > 1 ? i / (arr.length - 1) : 0.5;
    const z = 40 - 11 + t * 22;
    const x = Math.sin(t * Math.PI * 1.6) * 8;
    return { id: `mon-${i}`, x, z, milestone, rot: x > 0 ? -0.5 : 0.5 };
  });
  monuments.forEach((m) => colliders.push({ x: m.x, z: m.z, w: 1.6, d: 1.6, h: 2.8 }));
  for (let i = 0; i < 14; i++) {
    const x = -12 + rand() * 24;
    const z = 28 + rand() * 24;
    if (monuments.some((m) => Math.hypot(m.x - x, m.z - z) < 4)) continue;
    if (Math.abs(x - Math.sin(((z - 29) / 22) * Math.PI * 1.6) * 8) < 3) continue;
    trees.push({ x, z, s: 0.8 + rand() * 0.6 });
  }

  // Project towers
  projects.forEach((project, i) => {
    const [bx, bz] = projectSlots[i] ?? [80, 80];
    const h = project.featured ? 46 : 22 + ((i * 7) % 18);
    const w = project.featured ? 15 : 12;
    const tz = bz - 2;
    const color = accent[i % accent.length];
    projectTowers.push({
      x: bx,
      z: tz,
      w,
      d: 12,
      h,
      variant: i % 3,
      tint: "#1a2226",
      antenna: project.featured,
      project,
      color,
      door: { x: bx, z: tz + 6 + 3, face: 0 },
    });
    colliders.push({ x: bx, z: tz, w, d: 12, h });
    stations.push({ kind: "kiosk", id: `kiosk-${project.id}`, x: bx, z: tz + 9, label: project.title, project, color });
  });

  // ---- custom places on Maker's Avenue ----
  // free blocks nearest the centre host the owner's extra buildings, two per block
  const places = (content.city?.places ?? []).filter((pl) => pl.visible && pl.name);
  const placeBuildings: PlaceBuilding[] = [];
  const freeBlocks = blocks.filter((b) => b.district === "downtown").sort((p, q) => Math.hypot(p.x, p.z) - Math.hypot(q.x, q.z));
  places.slice(0, freeBlocks.length * 2).forEach((place, i) => {
    const b = freeBlocks[Math.floor(i / 2)];
    b.district = "avenue";
    const side = i % 2 === 0 ? -1 : 1;
    const x = b.x + side * 7;
    const z = b.z - 2;
    const dims = place.kind === "tower" ? { w: 10, d: 10, h: Math.max(8, Math.min(60, place.height || 24)) } : place.kind === "shop" ? { w: 11, d: 9, h: 7 } : { w: 4, d: 3.4, h: 3.2 };
    const pz = place.kind === "kiosk" ? b.z + 6 : z;
    placeBuildings.push({ place, x, z: pz, ...dims });
    colliders.push({ x, z: pz, w: dims.w, d: dims.d, h: dims.h });
    stations.push({ kind: "place", id: `place-${place.id}`, x, z: pz + dims.d / 2 + 2.6, label: place.name, place });
  });
  // a lone place leaves the other half of its block for a tree or two
  if (places.length % 2 === 1 && placeBuildings.length) {
    const last = placeBuildings[placeBuildings.length - 1];
    const bx = last.x + 14;
    trees.push({ x: bx - 3, z: last.z - 4, s: 1.2 }, { x: bx + 3, z: last.z + 3, s: 1 });
  }

  // ---- downtown: every block gets a different arrangement ----
  const ponds: Pond[] = [];
  const parking: Parking[] = [];
  const benches: CityPlan["benches"] = [];
  const carColorsParked = ["#e8eeec", "#2d3a52", "#c94f4f", "#f6c177", "#3a4246", "#7cc7ff"];
  const addTower = (t: Tower, collide = true) => {
    towers.push(t);
    if (collide && !t.y0) colliders.push({ x: t.x, z: t.z, w: t.w, d: t.d, h: t.h + (t.y0 ?? 0) });
  };
  const tint = () => ["#151b1e", "#1a2125", "#1d1a22", "#18201c", "#1e2224"][Math.floor(rand() * 5)];
  const variant = () => Math.floor(rand() * 3);
  let pondUsed = false;

  for (const b of blocks) {
    if (b.district !== "downtown" && b.district !== "projects") continue;
    if (b.district === "projects" && projectTowers.some((t) => t.x === b.x && Math.abs(t.z - b.z) < 5)) {
      // side buildings flanking the project tower, different heights each side
      for (const side of [-1, 1]) {
        const h = 8 + rand() * 18;
        addTower({ x: b.x + side * 10.5, z: b.z - 4, w: 4, d: 14, h, variant: variant(), tint: "#151b1e", antenna: false });
      }
      continue;
    }
    if (b.district !== "downtown") continue;
    const outer = Math.abs(b.x) === 80 || Math.abs(b.z) === 80;
    const tall = outer ? 1.6 : 1;
    const roll = rand();
    if (!pondUsed && Math.abs(b.x) === 80 && b.z === 40) {
      // pocket park with a pond
      pondUsed = true;
      ponds.push({ x: b.x, z: b.z, r: 7.5 });
      for (let k = 0; k < 9; k++) {
        const a = (k / 9) * Math.PI * 2 + rand() * 0.3;
        trees.push({ x: b.x + Math.cos(a) * 11, z: b.z + Math.sin(a) * 11, s: 0.9 + rand() * 0.5 });
      }
      benches.push({ x: b.x, z: b.z + 9.5, rot: Math.PI }, { x: b.x - 9.5, z: b.z, rot: Math.PI / 2 });
      continue;
    }
    if (roll < 0.2) {
      // four towers of different footprints
      for (const [ox, oz] of [
        [-7, -7],
        [7, -7],
        [-7, 7],
        [7, 7],
      ]) {
        if (rand() < 0.12) {
          trees.push({ x: b.x + ox, z: b.z + oz, s: 1 + rand() * 0.5 });
          continue;
        }
        const w = 7 + rand() * 4;
        const d = 7 + rand() * 4;
        const h = (10 + rand() * 26) * tall;
        addTower({ x: b.x + ox + (rand() - 0.5) * 1.5, z: b.z + oz + (rand() - 0.5) * 1.5, w, d, h, variant: variant(), tint: tint(), antenna: h > 45 && rand() > 0.4 });
      }
    } else if (roll < 0.4) {
      // two long slabs with a courtyard
      const alongX = rand() > 0.5;
      for (const side of [-1, 1]) {
        const h = (8 + rand() * 16) * tall;
        addTower(alongX ? { x: b.x, z: b.z + side * 7.5, w: 22, d: 8, h, variant: variant(), tint: tint(), antenna: false } : { x: b.x + side * 7.5, z: b.z, w: 8, d: 22, h, variant: variant(), tint: tint(), antenna: false });
      }
      trees.push({ x: b.x - 3, z: b.z, s: 0.8 }, { x: b.x + 3, z: b.z, s: 0.9 });
    } else if (roll < 0.58) {
      // landmark skyscraper: podium + two setbacks + spire
      const h1 = 9 + rand() * 4;
      const h2 = (18 + rand() * 16) * tall;
      const h3 = (10 + rand() * 18) * tall;
      const v = variant();
      const t = tint();
      addTower({ x: b.x, z: b.z, w: 20, d: 20, h: h1, variant: v, tint: t, antenna: false });
      addTower({ x: b.x, z: b.z, w: 14, d: 14, h: h2, variant: v, tint: t, antenna: false, y0: h1 }, false);
      addTower({ x: b.x, z: b.z, w: 9, d: 9, h: h3, variant: v, tint: t, antenna: true, y0: h1 + h2 }, false);
    } else if (roll < 0.78) {
      // one wide block and two small ones
      const h = (12 + rand() * 20) * tall;
      addTower({ x: b.x - 4.5, z: b.z, w: 13, d: 22, h, variant: variant(), tint: tint(), antenna: h > 40 });
      for (const oz of [-6, 6]) addTower({ x: b.x + 7.5, z: b.z + oz, w: 7.5, d: 9, h: (6 + rand() * 10) * tall, variant: variant(), tint: tint(), antenna: false });
    } else if (roll < 0.9) {
      // surface car park with a kiosk
      const cars: Parking["cars"] = [];
      for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) if (rand() > 0.3) cars.push({ x: b.x - 9 + c * 4.5, z: b.z - 4 + r * 8, rot: r ? Math.PI : 0, color: carColorsParked[Math.floor(rand() * carColorsParked.length)] });
      parking.push({ x: b.x, z: b.z, w: 24, d: 20, cars });
      cars.forEach((car) => colliders.push({ x: car.x, z: car.z, w: 2, d: 4.2, h: 1.6 }));
      trees.push({ x: b.x - 11, z: b.z + 10, s: 0.9 }, { x: b.x + 11, z: b.z + 10, s: 1 });
    } else {
      // pocket square: trees, benches, nothing tall
      for (let k = 0; k < 7; k++) trees.push({ x: b.x + (rand() - 0.5) * 20, z: b.z + (rand() - 0.5) * 20, s: 0.8 + rand() * 0.7 });
      benches.push({ x: b.x, z: b.z - 3, rot: 0 }, { x: b.x, z: b.z + 3, rot: Math.PI });
    }
  }

  // ---- street furniture ----
  const lamps: CityPlan["lamps"] = [];
  for (const b of blocks) {
    for (const [ox, oz] of [
      [-14.4, -14.4],
      [14.4, -14.4],
      [-14.4, 14.4],
      [14.4, 14.4],
    ]) {
      lamps.push({ x: b.x + ox, z: b.z + oz });
    }
  }

  // bits on sidewalks and crossings
  const bits: Bit[] = [];
  let id = 0;
  for (const line of ROAD_LINES) {
    for (let p = -96; p <= 96; p += 16) {
      if (rand() < 0.45) continue;
      const along = p + (rand() - 0.5) * 6;
      const horizontal = rand() > 0.5;
      const x = horizontal ? along : line + (rand() > 0.5 ? 1 : -1) * 3.5;
      const z = horizontal ? line + (rand() > 0.5 ? 1 : -1) * 3.5 : along;
      bits.push({ id: id++, x, z, y: rand() > 0.8 ? 2.6 : 1.1 });
    }
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    bits.push({ id: id++, x: Math.cos(a) * 9, z: Math.sin(a) * 9, y: 1.1 });
  }

  // traffic
  const carColors = ["#e8eeec", "#f0773f", "#5fd6c0", "#2d3a52", "#f6c177", "#a9b8ff", "#c94f4f", "#3a4246"];
  const cars: Car[] = [];
  const carCount = content.city?.traffic === false ? 0 : 18;
  for (let i = 0; i < carCount; i++) {
    const axis = i % 2 === 0 ? "x" : "z";
    const dir = rand() > 0.5 ? 1 : -1;
    cars.push({
      axis,
      line: ROAD_LINES[Math.floor(rand() * ROAD_LINES.length)],
      lane: dir * 2.3 * (axis === "x" ? 1 : -1),
      dir,
      speed: 7 + rand() * 6,
      offset: rand() * 240,
      color: carColors[i % carColors.length],
    });
  }

  // pedestrians walk loops around blocks on the sidewalk
  const shirtColors = ["#f0773f", "#a9b8ff", "#f6c177", "#e58fb6", "#8fd16b", "#7cc7ff", "#e8eeec", "#c94f4f"];
  const hairColors = ["#2a1d17", "#101314", "#5a3a22", "#c9a26b", "#3b2c20"];
  const walkers: Walker[] = [];
  const walkerBlocks = blocks.filter((b) => Math.abs(b.x) <= 40 && Math.abs(b.z) <= 80);
  const lines = content.city?.citizenLines?.length ? content.city.citizenLines : tips;
  const walkerCount = Math.max(0, Math.min(24, content.city?.citizens ?? 14));
  for (let i = 0; i < walkerCount; i++) {
    const b = walkerBlocks[Math.floor(rand() * walkerBlocks.length)];
    walkers.push({
      id: i,
      cx: b.x,
      cz: b.z,
      half: 13.8,
      speed: (1.4 + rand() * 0.8) * (rand() > 0.5 ? 1 : -1),
      offset: rand() * 132,
      color: shirtColors[i % shirtColors.length],
      hair: hairColors[i % hairColors.length],
      line: lines[i % lines.length],
    });
  }

  // rooftop billboards advertising skills, facing the city centre
  const skillNames: { text: string; sub: string }[] = [];
  const seenSkill = new Set<string>();
  for (const cl of content.skills) {
    for (const sk of [...cl.skills].sort((a, b) => b.level - a.level)) {
      const key = sk.name.toLowerCase();
      if (seenSkill.has(key)) continue;
      seenSkill.add(key);
      skillNames.push({ text: sk.name.toUpperCase(), sub: cl.name.toUpperCase() });
      break;
    }
  }
  for (const text of content.city?.billboards ?? []) skillNames.unshift({ text: text.toUpperCase().slice(0, 22), sub: content.profile.name.toUpperCase() });
  const billboardTowers = towers
    .filter((t) => !t.y0 && t.h > 14 && t.h < 42 && Math.hypot(t.x, t.z) > 45)
    .sort((a, b) => Math.atan2(a.z, a.x) - Math.atan2(b.z, b.x));
  const billboards: CityPlan["billboards"] = [];
  const step = Math.max(1, Math.floor(billboardTowers.length / Math.max(skillNames.length, 1)));
  skillNames.forEach((sk, i) => {
    const t = billboardTowers[i * step];
    if (!t) return;
    billboards.push({ x: t.x, z: t.z, y: t.h + 0.2, rot: Math.atan2(-t.x, -t.z), text: sk.text, sub: sk.sub, color: accent[i % accent.length] });
  });

  // ---- you, the guide, in the plaza ----
  const guideOn = content.city?.guide?.enabled !== false;
  const guide = guideOn ? { x: 0, z: 7.5, heading: 0 } : null;
  if (guide) {
    stations.push({ kind: "guide", id: "guide", x: guide.x, z: guide.z, label: content.city.guide.name || content.profile.firstName });
    colliders.push({ x: guide.x, z: guide.z, w: 1, d: 1, h: 2 });
  }
  const spawn = { x: 0, z: 13, heading: Math.PI };

  return { blocks, towers, projectTowers, stations, orbs, monuments, bits, cars, walkers, trees, lamps, colliders, billboards, places: placeBuildings, ponds, parking, benches, guide, spawn };
}

/** Position along a rectangular sidewalk loop. */
export function loopPoint(cx: number, cz: number, half: number, s: number) {
  const side = half * 2;
  const per = side * 4;
  const t = ((s % per) + per) % per;
  if (t < side) return { x: cx - half + t, z: cz - half, heading: Math.PI / 2 };
  if (t < side * 2) return { x: cx + half, z: cz - half + (t - side), heading: 0 };
  if (t < side * 3) return { x: cx + half - (t - side * 2), z: cz + half, heading: -Math.PI / 2 };
  return { x: cx - half, z: cz + half - (t - side * 3), heading: Math.PI };
}

export function carPoint(car: Car, time: number) {
  const span = HALF_MAP * 2 + 20;
  const raw = car.offset + car.dir * car.speed * time;
  const along = ((raw % span) + span) % span - span / 2;
  return car.axis === "x"
    ? { x: along, z: car.line + car.lane, heading: car.dir > 0 ? Math.PI / 2 : -Math.PI / 2 }
    : { x: car.line + car.lane, z: along, heading: car.dir > 0 ? 0 : Math.PI };
}

export const interactiveKinds = new Set<Station["kind"]>(["house", "kiosk", "board", "arcade", "mailbox", "place", "guide"]);

/** Irregular island coastline around the city, shared by the 3D terrain and the maps. */
export function islandOutline(points = 72): [number, number][] {
  return Array.from({ length: points + 1 }, (_, i) => {
    const a = (i / points) * Math.PI * 2;
    const r = 182 + Math.sin(a * 3) * 9 + Math.sin(a * 7 + 1.3) * 6 + Math.sin(a * 13 + 0.4) * 3;
    return [Math.cos(a) * r, Math.sin(a) * r];
  });
}

export type MapMarker = { id: string; x: number; z: number; color: string; label: string; done: boolean };

/** Everything worth pointing at on a map, shared by the HUD and the homepage teaser. */
export function cityMarkers(plan: CityPlan, taken: Set<string>): MapMarker[] {
  const colorFor = (s: Station) =>
    s.kind === "kiosk" ? s.color : s.kind === "place" ? s.place.color : s.kind === "guide" ? "#e8eeec" : districtInfo[s.kind === "house" ? "about" : s.kind === "board" ? "news" : s.kind === "arcade" ? "arcade" : "post"].color;
  const academy = plan.blocks.find((b) => b.district === "academy");
  const park = plan.blocks.find((b) => b.district === "park");
  return [
    { id: "plaza", x: 0, z: 0, color: "#5fd6c0", label: "Central Plaza", done: false },
    ...plan.stations.filter((s) => s.kind !== "guide").map((s) => ({ id: s.id, x: s.x, z: s.z, color: colorFor(s), label: s.label, done: taken.has(s.id) })),
    ...(academy ? [{ id: "academy", x: academy.x, z: 3, color: "#a9b8ff", label: "Skill Academy", done: plan.orbs.every((o) => taken.has(o.id)) }] : []),
    ...(park ? [{ id: "park", x: park.x, z: park.z, color: "#8fd16b", label: "Journey Park", done: plan.monuments.every((m) => taken.has(m.id)) }] : []),
  ];
}
