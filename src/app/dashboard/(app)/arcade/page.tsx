import { Trash } from "@phosphor-icons/react/dist/ssr";
import { clearScores, deleteScore } from "@/app/dashboard/actions";
import { arcadeGames } from "@/components/arcade/games";
import { ActionButton, Card, PageHeader } from "@/components/dashboard/ui";
import { getDb } from "@/lib/store";

export default async function ArcadePage() {
  const { scores } = await getDb();
  return (
    <>
      <PageHeader title="Arcade leaderboard" description="Names visitors entered on the arcade games. Remove anything inappropriate; it disappears from the site immediately." />
      <div className="grid gap-4 lg:grid-cols-2">
        {arcadeGames.map((g) => {
          const list = scores.filter((s) => s.game === g.id).sort((a, b) => b.score - a.score);
          return (
            <Card
              key={g.id}
              title={g.title}
              description={`${list.length} ${list.length === 1 ? "entry" : "entries"}`}
              actions={
                list.length ? (
                  <ActionButton action={clearScores.bind(null, g.id)} label="Clear board" confirm="Clear all?">
                    <span className="text-xs">Clear</span>
                  </ActionButton>
                ) : null
              }
            >
              {list.length ? (
                <ol className="divide-y divide-line">
                  {list.slice(0, 50).map((s, i) => (
                    <li key={s.id} className="flex items-center gap-3 py-2">
                      <span className="w-6 font-mono text-xs tabular-nums text-muted">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-sm">{s.name}</span>
                      <span className="font-mono text-sm tabular-nums text-accent">
                        {s.score} <span className="text-muted">{g.unit}</span>
                      </span>
                      <span className="hidden font-mono text-[11px] text-muted sm:inline">{s.createdAt.slice(0, 10)}</span>
                      <ActionButton action={deleteScore.bind(null, s.id)} label={`Remove ${s.name}`} confirm="Remove?">
                        <Trash size={15} />
                      </ActionButton>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted">No scores yet.</p>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
