import { About } from "@/components/sections/about";
import { Arcade } from "@/components/sections/arcade";
import { CityTeaser } from "@/components/sections/city-teaser";
import { Contact } from "@/components/sections/contact";
import { Focus } from "@/components/sections/focus";
import { Hero } from "@/components/sections/hero";
import { Journey } from "@/components/sections/journey";
import { Lab } from "@/components/sections/lab";
import { Log } from "@/components/sections/log";
import { Resume } from "@/components/sections/resume";
import { Skills } from "@/components/sections/skills";
import { Videos, publicVideos } from "@/components/sections/videos";
import { Work } from "@/components/sections/work";
import type { SectionConfig } from "@/lib/site";
import { getContent } from "@/lib/store";

export default async function Home() {
  const content = await getContent();
  const { profile, projects, stack, focus, journey, skills, posts, resume, sections, copy, demos, videos } = content;
  const facts = [
    { label: "Based in", value: profile.location || "Remote friendly" },
    { label: "Building with", value: stack.slice(0, 4).join(", ") || "Python, React, Flutter, SQL" },
    { label: "Status", value: profile.available ? "Available for work" : "Heads down on projects" },
  ];

  // a section with nothing to show is skipped, and numbering follows what's actually on the page
  const hasContent = (s: SectionConfig) =>
    s.visible &&
    !(s.id === "lab" && !demos.some((d) => d.visible)) &&
    !(s.id === "videos" && !publicVideos(videos).length) &&
    !(s.id === "journey" && !journey.length) &&
    !(s.id === "focus" && !focus.length);
  const shown = sections.filter(hasContent);

  const render = (section: SectionConfig, i: number) => {
    const props = { section, index: i + 1 };
    switch (section.id) {
      case "about":
        return <About key={section.id} {...props} statement={profile.about} facts={facts} portraitUrl={profile.portraitUrl} name={profile.name} />;
      case "resume":
        return <Resume key={section.id} {...props} resume={resume} profile={profile} stack={stack} />;
      case "skills":
        return <Skills key={section.id} {...props} classes={skills} profile={profile} />;
      case "work":
        return <Work key={section.id} {...props} projects={projects} github={profile.github} />;
      case "lab":
        return <Lab key={section.id} {...props} demos={demos} />;
      case "journey":
        return <Journey key={section.id} {...props} journey={journey} />;
      case "playground":
        return <Arcade key={section.id} {...props} />;
      case "videos":
        return <Videos key={section.id} {...props} videos={videos} />;
      case "log":
        return <Log key={section.id} {...props} posts={posts} />;
      case "focus":
        return <Focus key={section.id} {...props} focus={focus} />;
      case "city":
        return <CityTeaser key={section.id} {...props} content={content} />;
      case "contact":
        return <Contact key={section.id} {...props} profile={profile} note={copy.contactNote} />;
    }
  };

  return (
    <main>
      <Hero profile={profile} copy={copy} skills={skills} />
      {shown.map(render)}
    </main>
  );
}
