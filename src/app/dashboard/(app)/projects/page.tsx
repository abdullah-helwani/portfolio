import { ProjectsManager } from "@/components/dashboard/projects-manager";
import { getDb } from "@/lib/store";

export default async function ProjectsPage({ searchParams }: PageProps<"/dashboard/projects">) {
  const sp = await searchParams;
  const db = await getDb();
  return <ProjectsManager projects={db.projects} startNew={sp.new === "1"} />;
}
