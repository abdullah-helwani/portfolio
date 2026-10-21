import Link from "next/link";
import { GuideEditor } from "@/components/dashboard/guide-editor";
import { ListEditor, ObjectEditor } from "@/components/dashboard/schema-editor";
import { Card, PageHeader } from "@/components/dashboard/ui";
import { getDb } from "@/lib/store";

export default async function CityPage() {
  const db = await getDb();
  const { guide, places, ...settings } = db.city;
  return (
    <>
      <PageHeader
        title="The City"
        description="Your 3D portfolio world. Dress your guide avatar, write the welcome tour, and add buildings that open your other work."
        actions={
          <Link href="/world" target="_blank" className="press inline-flex h-10 items-center rounded-full border border-line-strong px-4 text-sm hover:border-fg/30">
            Open the City
          </Link>
        }
      />
      <div className="grid gap-4">
        <Card title="You, the guide" description="You stand in the plaza and greet every new visitor with this dialogue, then they're free to explore.">
          <GuideEditor initial={guide} portraitUrl={db.profile.portraitUrl} />
        </Card>
        <Card
          title="Places"
          description="Extra buildings in the City. Give each one a link: visitors ride the elevator (towers) or walk through the door (shops), then your site opens. Projects get towers automatically."
        >
          <ListEditor target="places" initial={places} addLabel="Add place" emptyText="No custom places yet. Add your websites, apps or anything else you want people to visit." />
        </Card>
        <Card title="Life in the City">
          <ObjectEditor target="citySettings" initial={settings} />
        </Card>
      </div>
    </>
  );
}
