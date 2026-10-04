import { ArrowUpRight, EnvelopeSimple, GithubLogo, LinkedinLogo } from "@phosphor-icons/react/dist/ssr";
import { Magnetic } from "@/components/animations/magnetic";
import { Reveal } from "@/components/animations/reveal";
import { AuroraVeil } from "@/components/ui/shader-aurora-veil";
import { site } from "@/lib/site";

export function Contact() {
  const primary = site.email
    ? { href: `mailto:${site.email}`, label: "Send me an email", icon: <EnvelopeSimple size={20} weight="bold" /> }
    : { href: site.github, label: "Find me on GitHub", icon: <GithubLogo size={20} weight="fill" /> };

  return (
    <section id="contact" className="px-3 pb-3 md:px-4 md:pb-4">
      <AuroraVeil intensity={0.75} className="rounded-[2rem] border border-line md:rounded-[2.5rem]">
        <div className="relative mx-auto flex max-w-[1400px] flex-col gap-12 px-5 py-24 md:px-10 md:py-36">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-fg/70">
              <span className="text-accent">04</span> / Contact
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="max-w-[14ch] text-[clamp(2.8rem,8vw,7.5rem)] font-semibold leading-[0.92] tracking-[-0.05em]">
              Let&apos;s build something that{" "}
              <span className="font-serif font-normal italic text-accent">pays attention.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <p className="max-w-[44ch] text-lg leading-relaxed text-fg/75">
              Internships, research collaborations, freelance builds or a good conversation about models and
              interfaces. Say hello.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Magnetic>
                <a
                  href={primary.href}
                  target={site.email ? undefined : "_blank"}
                  rel={site.email ? undefined : "noreferrer"}
                  className="press group inline-flex h-16 items-center gap-3 rounded-full bg-fg pl-7 pr-2.5 text-base font-medium text-bg transition-[background-color] duration-200 hover:bg-accent"
                >
                  {primary.icon}
                  {primary.label}
                  <span className="grid size-11 place-items-center rounded-full bg-bg text-fg transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-45">
                    <ArrowUpRight size={18} weight="bold" />
                  </span>
                </a>
              </Magnetic>
              {site.linkedin ? (
                <a
                  href={site.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn profile"
                  className="press grid size-16 place-items-center rounded-full border border-line-strong bg-bg/40 backdrop-blur-md transition-colors duration-200 hover:border-fg/40"
                >
                  <LinkedinLogo size={22} weight="fill" />
                </a>
              ) : null}
            </div>
          </Reveal>
        </div>
      </AuroraVeil>
    </section>
  );
}
