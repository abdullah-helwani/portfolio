import type { Content, Milestone, Post, Project, SkillClass } from "@/lib/site";

export type Station =
  | { kind: "sign"; id: string; x: number; lines: string[] }
  | { kind: "house"; id: "about"; x: number }
  | { kind: "gate"; id: "dojo"; x: number }
  | { kind: "orb"; id: string; x: number; lift: number; skill: SkillClass; color: string }
  | { kind: "post"; id: string; x: number; milestone: Milestone }
  | { kind: "kiosk"; id: string; x: number; project: Project; color: string }
  | { kind: "board"; id: "log"; x: number; posts: Post[] }
  | { kind: "arcade"; id: "arcade"; x: number }
  | { kind: "mailbox"; id: "contact"; x: number }
  | { kind: "flag"; id: "end"; x: number };

export type Bit = { id: number; x: number; lift: number };

export type WorldLayout = {
  width: number;
  stations: Station[];
  bits: Bit[];
  lamps: number[];
};

export const palette = ["#5fd6c0", "#f0773f", "#a9b8ff", "#f6c177", "#e58fb6", "#8fd16b"];

/** Interactable stations open a panel with E / the action button. */
export const interactive = new Set(["house", "kiosk", "board", "arcade", "mailbox"]);

export function stationWidth(s: Station) {
  switch (s.kind) {
    case "house":
      return 260;
    case "kiosk":
      return 190;
    case "board":
      return 230;
    case "arcade":
      return 90;
    case "mailbox":
      return 70;
    default:
      return 60;
  }
}

export function buildWorld(content: Content): WorldLayout {
  const stations: Station[] = [];
  let x = 220;

  stations.push({
    kind: "sign",
    id: "welcome",
    x,
    lines: [`${content.profile.firstName.toUpperCase()}'S WORLD`, "walk → explore"],
  });
  x += 360;

  stations.push({ kind: "house", id: "about", x });
  x += 520;

  if (content.skills.length) {
    stations.push({ kind: "gate", id: "dojo", x });
    x += 190;
    content.skills.forEach((skill, i) => {
      stations.push({
        kind: "orb",
        id: `orb-${skill.id}`,
        x,
        lift: i % 2 === 0 ? 46 : 108,
        skill,
        color: palette[i % palette.length],
      });
      x += 165;
    });
    x += 140;
  }

  content.journey.forEach((milestone, i) => {
    stations.push({ kind: "post", id: `post-${i}`, x, milestone });
    x += 240;
  });
  x += 140;

  const projects = content.projects.filter((p) => p.visible);
  projects.forEach((project, i) => {
    stations.push({ kind: "kiosk", id: `kiosk-${project.id}`, x, project, color: palette[i % palette.length] });
    x += 330;
  });
  x += 120;

  const posts = content.posts.filter((p) => p.published);
  stations.push({ kind: "board", id: "log", x, posts });
  x += 420;
  stations.push({ kind: "arcade", id: "arcade", x });
  x += 340;
  stations.push({ kind: "mailbox", id: "contact", x });
  x += 420;
  stations.push({ kind: "flag", id: "end", x });

  const width = x + 360;

  // bits: a ribbon of collectibles, some at jump height
  const bits: Bit[] = [];
  let id = 0;
  for (let bx = 140; bx < width - 300; bx += 135) {
    const wave = Math.sin(id * 0.9);
    bits.push({ id: id++, x: bx, lift: wave > 0.55 ? 112 : wave > -0.2 ? 64 : 30 });
  }

  const lamps: number[] = [];
  for (let lx = 470; lx < width - 200; lx += 620) lamps.push(lx);

  return { width, stations, bits, lamps };
}
