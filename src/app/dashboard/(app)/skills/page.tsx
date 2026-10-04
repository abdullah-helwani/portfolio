import { SkillsEditor } from "@/components/dashboard/skills-editor";
import { getDb } from "@/lib/store";

export default async function SkillsPage() {
  const db = await getDb();
  return <SkillsEditor initial={db.skills} />;
}
