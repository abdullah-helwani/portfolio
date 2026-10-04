import type { Metadata } from "next";
import { City } from "@/components/city/city";
import { getContent } from "@/lib/store";

export const metadata: Metadata = {
  title: "The City",
  description: "Explore my portfolio as an open-world 3D city.",
};

export default async function WorldPage() {
  const content = await getContent();
  return (
    <main>
      <h1 className="sr-only">Explore the portfolio as an open-world city</h1>
      <City content={content} />
    </main>
  );
}
