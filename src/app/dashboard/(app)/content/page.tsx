import { ContentEditor } from "@/components/dashboard/content-editor";
import { getDb } from "@/lib/store";

export default async function ContentPage() {
  const db = await getDb();
  return <ContentEditor journey={db.journey} focus={db.focus} stack={db.stack} />;
}
