import type { Metadata } from "next";
import { World } from "@/components/world/world";
import { getContent } from "@/lib/store";

export const metadata: Metadata = {
  title: "World",
  description: "Explore my portfolio as a little side-scrolling game.",
};

export default async function WorldPage() {
  const content = await getContent();
  return (
    <main>
      <h1 className="sr-only">Explore the portfolio as a game</h1>
      <World content={content} />
    </main>
  );
}
