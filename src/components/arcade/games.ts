export const arcadeGames = [
  { id: "snake", title: "Snake", blurb: "Eat the bugs. Don't bite yourself.", unit: "pts" },
  { id: "breakout", title: "Breakout", blurb: "Smash the legacy code, brick by brick.", unit: "pts" },
  { id: "flappy", title: "Flappy Bit", blurb: "Tap to fly through the firewall.", unit: "pipes" },
  { id: "memory", title: "Memory", blurb: "Match the tech stack pairs.", unit: "pts" },
  { id: "typing", title: "Code Typer", blurb: "Type real code as fast as you can.", unit: "wpm" },
] as const;

export type ArcadeGameId = (typeof arcadeGames)[number]["id"];
export const arcadeGameIds = arcadeGames.map((g) => g.id) as readonly string[];

/** Highest sane score per game, to reject obviously forged submissions. */
export const scoreCaps: Record<ArcadeGameId, number> = { snake: 400, breakout: 5000, flappy: 999, memory: 2000, typing: 250 };
