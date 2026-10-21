import { EnvelopeSimple, FileText, Globe, GithubLogo, LinkedinLogo, MapPin, Phone, XLogo } from "@phosphor-icons/react/dist/ssr";
import { Magnetic } from "@/components/animations/magnetic";
import { Reveal } from "@/components/animations/reveal";
import { TextReveal } from "@/components/animations/text-reveal";
import { AuroraVeil } from "@/components/ui/shader-aurora-veil";
import type { Profile } from "@/lib/site";
import { ContactForm } from "./contact-form";
import { SectionKicker, type SectionProps } from "./section-header";

export function Contact({ profile, note, section, index }: { profile: Profile; note: string } & SectionProps) {
  const links = [
    { href: profile.github, label: "GitHub", icon: GithubLogo, external: true },
    profile.email ? { href: `mailto:${profile.email}`, label: "Email", icon: EnvelopeSimple, external: false } : null,
    profile.linkedin ? { href: profile.linkedin, label: "LinkedIn", icon: LinkedinLogo, external: true } : null,
    profile.x ? { href: profile.x, label: "X", icon: XLogo, external: true } : null,
    profile.website ? { href: profile.website, label: "Website", icon: Globe, external: true } : null,
    profile.cvUrl ? { href: profile.cvUrl, label: "Download CV", icon: FileText, external: true } : null,
  ].filter((l): l is NonNullable<typeof l> => Boolean(l));

  return (
    <section id="contact" className="px-3 pb-3 md:px-4 md:pb-4">
      <AuroraVeil intensity={0.75} className="rounded-[2rem] border border-line md:rounded-[2.5rem]">
        <div className="relative mx-auto grid max-w-[1400px] gap-14 px-5 py-24 md:px-10 md:py-32 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Reveal>
              <SectionKicker section={section} index={index} className="text-fg/70" />
            </Reveal>
            <TextReveal
              text={section.title}
              accentClassName="text-accent"
              className="mt-8 max-w-[14ch] text-[clamp(2.8rem,6.5vw,6.25rem)] font-semibold leading-[0.92] tracking-[-0.05em]"
            />
            <Reveal delay={0.15}>
              <p className="mt-8 max-w-[44ch] text-lg leading-relaxed text-fg/75">
                {section.intro ||
                  "Internships, research collaborations, freelance builds or a good conversation about models and interfaces. Drop a note and it lands straight in my dashboard."}
              </p>
              {note ? <p className="mt-4 max-w-[44ch] text-sm leading-relaxed text-fg/60">{note}</p> : null}
              {profile.email || profile.phone || profile.location ? (
                <dl className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
                  {profile.email ? (
                    <div className="flex items-center gap-3">
                      <dt className="sr-only">Email</dt>
                      <EnvelopeSimple size={18} className="text-accent" />
                      <dd>
                        <a href={`mailto:${profile.email}`} className="hover:text-accent">
                          {profile.email}
                        </a>
                      </dd>
                    </div>
                  ) : null}
                  {profile.phone ? (
                    <div className="flex items-center gap-3">
                      <dt className="sr-only">Phone</dt>
                      <Phone size={18} className="text-accent" />
                      <dd>
                        <a href={`tel:${profile.phone.replace(/[^+\d]/g, "")}`} className="hover:text-accent">
                          {profile.phone}
                        </a>
                      </dd>
                    </div>
                  ) : null}
                  {profile.location ? (
                    <div className="flex items-center gap-3">
                      <dt className="sr-only">Location</dt>
                      <MapPin size={18} className="text-accent" />
                      <dd>{profile.location}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}
              <ul className="mt-8 flex flex-wrap gap-3">
                {links.map(({ href, label, icon: Icon, external }) => (
                  <li key={label}>
                    <Magnetic strength={0.25}>
                      <a
                        href={href}
                        target={external ? "_blank" : undefined}
                        rel={external ? "noreferrer" : undefined}
                        className="press inline-flex h-12 items-center gap-2 rounded-full border border-line-strong bg-bg/40 px-5 text-sm backdrop-blur-md transition-colors duration-200 hover:border-fg/40"
                      >
                        <Icon size={18} weight="fill" />
                        {label}
                      </a>
                    </Magnetic>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
          <Reveal delay={0.1} className="lg:col-span-6 lg:pt-16">
            <ContactForm />
          </Reveal>
        </div>
      </AuroraVeil>
    </section>
  );
}
