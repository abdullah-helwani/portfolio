import { ProfileForm } from "@/components/dashboard/profile-form";
import { getDb } from "@/lib/store";

export default async function ProfilePage() {
  const db = await getDb();
  return <ProfileForm profile={db.profile} />;
}
