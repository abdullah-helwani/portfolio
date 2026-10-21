import { ListEditor } from "@/components/dashboard/schema-editor";
import { Card, PageHeader } from "@/components/dashboard/ui";
import { getContent } from "@/lib/store";

export default async function LabPage() {
  // getContent masks saved tokens as "set", so they never reach the browser
  const { demos } = await getContent();
  return (
    <>
      <PageHeader
        title="AI Lab"
        description="Let visitors try your models. Use a built-in demo, connect your own model's API, or embed a Hugging Face Space."
      />
      <Card
        title="Demos"
        description="API demos: the site POSTs {&quot;input&quot;: …} to your endpoint from the server and shows the JSON it returns. Your token stays on the server."
      >
        <ListEditor target="demos" initial={demos} addLabel="Add demo" />
      </Card>
    </>
  );
}
