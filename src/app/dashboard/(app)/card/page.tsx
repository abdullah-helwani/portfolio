import { headers } from "next/headers";
import { CardEditor } from "@/components/dashboard/card-editor";
import { Card, PageHeader } from "@/components/dashboard/ui";
import { getDb } from "@/lib/store";

export default async function CardPage() {
  const db = await getDb();
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const siteUrl = host ? `https://${host}` : db.profile.url;
  return (
    <>
      <PageHeader
        title="Business card"
        description="A digital card with a QR code and a Save contact button. It stays hidden until you switch it on; then it appears at /card and as a button on the site."
      />
      <Card>
        <CardEditor card={db.card} logoUrl={db.profile.logoUrl} siteUrl={siteUrl} />
      </Card>
    </>
  );
}
