import Link from "next/link";
import { ArrowUp, ArrowUpRight, EnvelopeSimple, GameController, GithubLogo, IdentificationCard, LinkedinLogo, XLogo } from "@phosphor-icons/react/dist/ssr";
import type { BusinessCard, Profile, SectionConfig, SiteCopy } from "@/lib/site";
import { Logo } from "./nav";

function Accent({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*[^*]+\*)/g).map((part, i) =>
        part.startsWith("*") && part.endsWith("*") ? (
          <span key={i} className="text-accent">
            {part.slice(1, -1)}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

const sectionLinks: Partial<Record<SectionConfig["id"], string>> = {
  about: "About",
  resume: "Résumé",
  skills: "Skills",
  work: "Projects",
  lab: "AI Lab",
  playground: "Arcade",
  videos: "Videos",
  contact: "Contact",
};

export function Footer({ profile, copy, sections, card, hide = [] }: { profile: Profile; copy: SiteCopy; sections: SectionConfig[]; card: BusinessCard; hide?: SectionConfig["id"][] }) {
  const socials = [
    { href: profile.github, label: "GitHub", icon: GithubLogo },
    { href: profile.linkedin, label: "LinkedIn", icon: LinkedinLogo },
    { href: profile.x, label: "X", icon: XLogo },
  ].filter((s) => s.href);
  const explore = sections.filter((s) => s.visible && sectionLinks[s.id] && !hide.includes(s.id));

  return (
    <footer className="relative mt-10 border-t border-line">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <div className="grid gap-10 py-20 md:grid-cols-12 md:py-28">
          <div className="md:col-span-7">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              <span className="text-accent">EOF</span> / Thanks for scrolling
            </p>
            <p className="mt-6 max-w-[14ch] text-[clamp(2.4rem,6vw,5.25rem)] font-semibold leading-[0.95] tracking-[-0.045em]">
              <Accent text={copy.footerHeadline} />
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/#contact" className="press inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-accent-ink">
                <EnvelopeSimple size={17} weight="bold" /> Start a conversation
              </Link>
              <Link href="/world" className="press inline-flex h-12 items-center gap-2 rounded-full border border-line-strong px-5 text-sm hover:border-fg/30">
                <GameController size={17} className="text-ember" /> Walk the City
              </Link>
              {card.enabled ? (
                <Link href="/card" className="press inline-flex h-12 items-center gap-2 rounded-full border border-line-strong px-5 text-sm hover:border-fg/30">
                  <IdentificationCard size={17} /> Business card
                </Link>
              ) : null}
            </div>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 text-sm md:col-span-5 md:grid-cols-2">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Explore</p>
              <ul className="mt-4 grid gap-2.5">
                {explore.map((s) => (
                  <li key={s.id}>
                    <Link href={`/#${s.id === "playground" ? "play" : s.id}`} className="text-fg/80 transition-colors duration-200 hover:text-fg">
                      {sectionLinks[s.id]}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/log" className="text-fg/80 transition-colors duration-200 hover:text-fg">
                    Build log
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Elsewhere</p>
              <ul className="mt-4 grid gap-2.5">
                {socials.map(({ href, label, icon: Icon }) => (
                  <li key={label}>
                    <a href={href} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-2 text-fg/80 transition-colors duration-200 hover:text-fg">
                      <Icon size={15} /> {label}
                      <ArrowUpRight size={12} className="opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                    </a>
                  </li>
                ))}
                {profile.email ? (
                  <li>
                    <a href={`mailto:${profile.email}`} className="inline-flex items-center gap-2 text-fg/80 transition-colors duration-200 hover:text-fg">
                      <EnvelopeSimple size={15} /> Email
                    </a>
                  </li>
                ) : null}
                {profile.cvUrl ? (
                  <li>
                    <a href={profile.cvUrl} target="_blank" rel="noreferrer" className="text-fg/80 transition-colors duration-200 hover:text-fg">
                      Download CV
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>
          </nav>
        </div>

        <div className="flex flex-col gap-4 border-t border-line py-6 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Logo name={profile.name} logoUrl={profile.logoUrl} className="size-8" />
            <p>
              &copy; {new Date().getFullYear()} {profile.name}. {copy.footerNote}
            </p>
          </div>
          <div className="flex items-center gap-5">
            <span className="hidden items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] md:flex">
              <span className={profile.available ? "size-1.5 rounded-full bg-accent" : "size-1.5 rounded-full bg-muted"} />
              {profile.status}
            </span>
            <Link href="/#top" className="group inline-flex items-center gap-1.5 transition-colors duration-200 hover:text-fg">
              Back to top
              <ArrowUp size={14} className="transition-transform duration-300 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
