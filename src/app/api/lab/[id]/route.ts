import { getDb } from "@/lib/store";

// Forwards a visitor's input to the owner's model API. The token stays on the server and
// requests are rate limited per visitor so a demo can't be used to hammer the endpoint.

const hits = new Map<string, number[]>();
const WINDOW = 60_000;
const LIMIT = 20;

function limited(key: string) {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < WINDOW);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return list.length > LIMIT;
}

function pick(value: unknown, path: string): unknown {
  if (!path) return value;
  return path.split(".").reduce<unknown>((v, key) => (v && typeof v === "object" ? (v as Record<string, unknown>)[key] : undefined), value);
}

export async function POST(request: Request, ctx: RouteContext<"/api/lab/[id]">) {
  const { id } = await ctx.params;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(`${ip}:${id}`)) return Response.json({ error: "Too many runs. Give it a minute." }, { status: 429 });

  const db = await getDb();
  const demo = db.demos.find((d) => d.id === id && d.kind === "api" && d.visible);
  if (!demo || !demo.endpoint) return Response.json({ error: "This demo isn't connected yet." }, { status: 404 });

  let input: unknown;
  try {
    const body = (await request.json()) as { input?: unknown };
    input = body.input;
  } catch {
    return Response.json({ error: "Send JSON like {\"input\": \"...\"}." }, { status: 400 });
  }
  if (JSON.stringify(input ?? "").length > 20_000) return Response.json({ error: "That input is too long." }, { status: 413 });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(demo.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", ...(demo.token ? { Authorization: `Bearer ${demo.token}` } : {}) },
      body: JSON.stringify({ input }),
      signal: controller.signal,
      redirect: "follow",
    });
    const text = (await res.text()).slice(0, 256_000);
    let data: unknown = text;
    try {
      data = JSON.parse(text);
    } catch {}
    if (!res.ok) return Response.json({ error: `The model answered with ${res.status}.`, raw: data }, { status: 502 });
    return Response.json({ output: pick(data, demo.outputPath), raw: data });
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    return Response.json({ error: aborted ? "The model took too long to answer." : "Couldn't reach the model." }, { status: 504 });
  } finally {
    clearTimeout(timer);
  }
}
