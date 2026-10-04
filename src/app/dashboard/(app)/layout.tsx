import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/shell";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const db = await getDb();
  const unread = db.messages.filter((m) => !m.read && !m.archived).length;
  return (
    <DashboardShell name={db.profile.name} logoUrl={db.profile.logoUrl} unread={unread}>
      {children}
    </DashboardShell>
  );
}
