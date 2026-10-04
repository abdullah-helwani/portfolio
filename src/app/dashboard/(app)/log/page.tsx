import { PostsManager } from "@/components/dashboard/posts-manager";
import { getDb } from "@/lib/store";

export default async function DashboardLogPage({ searchParams }: PageProps<"/dashboard/log">) {
  const sp = await searchParams;
  const db = await getDb();
  const posts = [...db.posts].sort((a, b) => b.date.localeCompare(a.date));
  return <PostsManager posts={posts} startNew={sp.new === "1"} />;
}
