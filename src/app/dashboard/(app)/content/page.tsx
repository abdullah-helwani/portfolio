import { ListEditor, ObjectEditor } from "@/components/dashboard/schema-editor";
import { SectionsEditor } from "@/components/dashboard/sections-editor";
import { Card, PageHeader } from "@/components/dashboard/ui";
import { getDb } from "@/lib/store";

export default async function ContentPage() {
  const db = await getDb();
  return (
    <>
      <PageHeader title="Pages & text" description="Every heading, label and paragraph on the homepage. Reorder or hide whole sections, and rewrite anything." />
      <div className="grid gap-4">
        <Card title="Homepage sections" description="Top to bottom. Click a section to edit its label, heading and intro. The eye hides it.">
          <SectionsEditor initial={db.sections} />
        </Card>
        <Card title="Hero, intro & footer" description="Button labels, the opening animation, the code-rain background and the footer.">
          <ObjectEditor target="copy" initial={db.copy} />
        </Card>
        <Card title="Journey" description="Timeline milestones on the homepage and monuments in the City's park.">
          <ListEditor target="journey" initial={db.journey.map((m, i) => ({ id: `m-${i}`, ...m }))} addLabel="Add milestone" />
        </Card>
        <Card title="Services" description="The stacking cards under “What I can do for you”.">
          <ListEditor target="focus" initial={db.focus.map((f, i) => ({ id: `f-${i}`, ...f }))} addLabel="Add service" />
        </Card>
      </div>
    </>
  );
}
