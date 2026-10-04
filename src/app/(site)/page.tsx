import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";
import { Focus } from "@/components/sections/focus";
import { Hero } from "@/components/sections/hero";
import { Journey } from "@/components/sections/journey";
import { Log } from "@/components/sections/log";
import { StackMarquee } from "@/components/sections/marquee";
import { Playground } from "@/components/sections/playground";
import { Skills } from "@/components/sections/skills";
import { Work } from "@/components/sections/work";
import { getContent } from "@/lib/store";

export default async function Home() {
  const { profile, projects, stack, focus, journey, skills, posts } = await getContent();
  const facts = [
    { label: "Based in", value: profile.location || "Remote friendly" },
    { label: "Building with", value: "Python, React, Flutter, SQL" },
    { label: "Status", value: profile.available ? "Available for work" : "Heads down on projects" },
  ];

  return (
    <main>
      <Hero profile={profile} />
      <StackMarquee stack={stack} />
      <About statement={profile.about} facts={facts} />
      <Skills classes={skills} profile={profile} />
      <Journey journey={journey} />
      <Work projects={projects} github={profile.github} />
      <Playground />
      <Log posts={posts} />
      <Focus focus={focus} />
      <Contact profile={profile} />
    </main>
  );
}
