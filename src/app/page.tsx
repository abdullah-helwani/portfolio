import { Footer } from "@/components/layout/footer";
import { Nav } from "@/components/layout/nav";
import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";
import { Focus } from "@/components/sections/focus";
import { Hero } from "@/components/sections/hero";
import { StackMarquee } from "@/components/sections/marquee";
import { Work } from "@/components/sections/work";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <StackMarquee />
        <About />
        <Work />
        <Focus />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
