import { today, updateDb } from "@/lib/store";

const botPattern = /bot|crawl|spider|slurp|preview|headless|lighthouse/i;

export async function POST(request: Request) {
  const ua = request.headers.get("user-agent") ?? "";
  if (!botPattern.test(ua)) {
    try {
      await updateDb((db) => {
        const key = today();
        db.views[key] = (db.views[key] ?? 0) + 1;
      });
    } catch {
      // analytics must never break the page
    }
  }
  return new Response(null, { status: 204 });
}
