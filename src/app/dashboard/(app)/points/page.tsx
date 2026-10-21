import { PointsEditor } from "@/components/dashboard/points-editor";
import { ListEditor } from "@/components/dashboard/schema-editor";
import { Card, PageHeader } from "@/components/dashboard/ui";
import { getDb } from "@/lib/store";

export default async function PointsPage() {
  const { game } = await getDb();
  return (
    <>
      <PageHeader
        title="Points & rewards"
        description="Decide what earns XP and what XP is worth. Visitors keep their progress on their device without an account."
      />
      <div className="grid gap-4">
        <Card title="Rewards" description="What visitors unlock when they reach an XP amount. Set XP to 0 to require every achievement.">
          <ListEditor target="rewards" initial={game.rewards} addLabel="Add reward" />
        </Card>
        <Card title="How visitors earn XP">
          <PointsEditor initial={game.achievements} />
        </Card>
      </div>
    </>
  );
}
