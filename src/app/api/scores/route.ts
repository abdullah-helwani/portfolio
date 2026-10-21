import { arcadeGameIds, scoreCaps, type ArcadeGameId } from "@/components/arcade/games";
import { getDb, newId, updateDb } from "@/lib/store";

// Public arcade leaderboard. Names are filtered and capped; the owner can remove any entry
// from the dashboard.

const BLOCKED = ["fuck", "shit", "bitch", "cunt", "nigg", "fag", "rape", "nazi", "hitler", "porn", "sex", "dick", "pussy", "whore", "slut", "kys", "retard"];
const recent = new Map<string, number>();

function cleanName(raw: unknown) {
  const name = String(raw ?? "")
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N} _.-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 16);
  const flat = name.toLowerCase().replace(/[^a-z]/g, "").replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e").replace(/4/g, "a").replace(/5/g, "s");
  if (name.length < 2 || BLOCKED.some((w) => flat.includes(w))) return null;
  return name;
}

function top(scores: { game: string; name: string; score: number; createdAt: string }[], game: string) {
  return scores
    .filter((s) => s.game === game)
    .sort((a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt))
    .slice(0, 10)
    .map(({ name, score }) => ({ name, score }));
}

export async function GET(request: Request) {
  const game = new URL(request.url).searchParams.get("game") ?? "";
  if (!arcadeGameIds.includes(game)) return Response.json({ error: "Unknown game" }, { status: 400 });
  const { scores } = await getDb();
  return Response.json({ top: top(scores, game) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  let body: { game?: string; name?: string; score?: number };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  const game = String(body.game ?? "") as ArcadeGameId;
  if (!arcadeGameIds.includes(game)) return Response.json({ error: "Unknown game" }, { status: 400 });
  const score = Math.floor(Number(body.score));
  if (!Number.isFinite(score) || score <= 0 || score > scoreCaps[game]) return Response.json({ error: "That score doesn't look right." }, { status: 400 });
  const name = cleanName(body.name);
  if (!name) return Response.json({ error: "Pick a different name (2–16 letters or numbers)." }, { status: 400 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  if (now - (recent.get(ip) ?? 0) < 4000) return Response.json({ error: "Slow down a little." }, { status: 429 });
  recent.set(ip, now);
  if (recent.size > 5000) recent.clear();

  const result = await updateDb((db) => {
    const existing = db.scores.find((s) => s.game === game && s.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (score > existing.score) {
        existing.score = score;
        existing.createdAt = new Date().toISOString();
      }
    } else {
      db.scores.push({ id: newId(), game, name, score, createdAt: new Date().toISOString() });
    }
    // keep the file small: at most 200 entries per game
    const mine = db.scores.filter((s) => s.game === game).sort((a, b) => b.score - a.score);
    if (mine.length > 200) {
      const drop = new Set(mine.slice(200).map((s) => s.id));
      db.scores = db.scores.filter((s) => !drop.has(s.id));
    }
    const board = top(db.scores, game);
    return { top: board, rank: board.findIndex((s) => s.name.toLowerCase() === name.toLowerCase()) + 1 };
  });
  return Response.json(result);
}
