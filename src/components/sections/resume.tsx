import { ArrowUpRight, Certificate, DownloadSimple, GraduationCap, Briefcase, BookOpen, Translate } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/animations/reveal";
import type { Profile, Resume as ResumeData } from "@/lib/site";
import { CvLink } from "./resume-cv-link";
import { SectionHeader, type SectionProps } from "./section-header";

function Block({ icon: Icon, title, children, count }: { icon: typeof Briefcase; title: string; children: React.ReactNode; count?: number }) {
  return (
    <div className="border-t border-line pt-6">
      <h3 className="mb-6 flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
        <Icon size={15} className="text-accent" />
        {title}
        {typeof count === "number" ? <span className="text-fg/40">{String(count).padStart(2, "0")}</span> : null}
      </h3>
      {children}
    </div>
  );
}

function When({ start, end }: { start: string; end: string }) {
  if (!start && !end) return null;
  return (
    <span className="font-mono text-xs tabular-nums text-muted">
      {start}
      {start && end ? " — " : ""}
      {end}
    </span>
  );
}

export function Resume({ resume, profile, stack, section, index }: { resume: ResumeData; profile: Profile; stack: string[] } & SectionProps) {
  return (
    <section id="resume" className="mx-auto max-w-[1400px] px-5 py-28 md:px-10 md:py-36">
      <SectionHeader section={section} index={index} />

      <div className="grid gap-12 lg:grid-cols-12">
        {/* sticky summary column */}
        <aside className="lg:col-span-4">
          <div className="grid gap-6 lg:sticky lg:top-28">
            <Reveal className="rounded-[1.75rem] border border-line bg-surface/70 p-6 backdrop-blur md:p-7">
              <div className="flex items-center gap-4">
                {profile.portraitUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.portraitUrl} alt="" className="size-14 rounded-2xl object-cover" />
                ) : null}
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold tracking-tight">{profile.name}</p>
                  <p className="truncate text-sm text-accent">{profile.tagline || profile.role}</p>
                </div>
              </div>
              {resume.summary ? <p className="mt-5 leading-relaxed text-fg/75">{resume.summary}</p> : null}
              {profile.cvUrl ? (
                <CvLink
                  href={profile.cvUrl}
                  className="press mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-ink"
                >
                  <DownloadSimple size={16} weight="bold" /> Download CV (PDF)
                </CvLink>
              ) : null}
            </Reveal>

            {resume.languages.length ? (
              <Reveal delay={0.05} className="rounded-[1.75rem] border border-line p-6">
                <h3 className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
                  <Translate size={15} className="text-accent" /> Languages
                </h3>
                <ul className="mt-4 divide-y divide-line">
                  {resume.languages.map((l) => (
                    <li key={l.id} className="flex items-center justify-between py-2.5 text-sm">
                      <span>{l.name}</span>
                      <span className="text-muted">{l.level}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ) : null}

            {stack.length || resume.interests.length ? (
              <Reveal delay={0.1} className="rounded-[1.75rem] border border-line p-6">
                {stack.length ? (
                  <>
                    <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Toolbox</h3>
                    <ul className="mt-4 flex flex-wrap gap-1.5">
                      {stack.map((s) => (
                        <li key={s} className="rounded-full border border-line-strong bg-bg/60 px-3 py-1 font-mono text-[12px] text-fg/80">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
                {resume.interests.length ? (
                  <>
                    <h3 className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Interests</h3>
                    <p className="mt-3 text-sm leading-relaxed text-fg/75">{resume.interests.join(" · ")}</p>
                  </>
                ) : null}
              </Reveal>
            ) : null}
          </div>
        </aside>

        <div className="grid gap-14 lg:col-span-8">
          {resume.experience.length ? (
            <Block icon={Briefcase} title="Experience" count={resume.experience.length}>
              <ol className="relative grid gap-8 border-l border-line pl-6 md:pl-8">
                {resume.experience.map((x, i) => (
                  <Reveal as="li" key={x.id} delay={i * 0.05} className="relative">
                    <span aria-hidden="true" className="absolute -left-[29px] top-2 size-2.5 rounded-full border-2 border-bg bg-accent md:-left-[37px]" />
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <h4 className="text-xl font-semibold tracking-[-0.02em] md:text-2xl">{x.role}</h4>
                      <When start={x.start} end={x.end} />
                    </div>
                    <p className="mt-1 text-sm text-accent">
                      {x.org}
                      {x.place ? <span className="text-muted"> · {x.place}</span> : null}
                    </p>
                    {x.body ? <p className="mt-3 max-w-[64ch] leading-relaxed text-fg/70">{x.body}</p> : null}
                  </Reveal>
                ))}
              </ol>
            </Block>
          ) : null}

          {resume.education.length ? (
            <Block icon={GraduationCap} title="Education" count={resume.education.length}>
              <ul className="grid gap-4 md:grid-cols-2">
                {resume.education.map((e, i) => (
                  <Reveal as="li" key={e.id} delay={i * 0.05} className="rounded-3xl border border-line bg-surface/60 p-6 backdrop-blur">
                    <When start={e.start} end={e.end} />
                    <h4 className="mt-2 text-lg font-semibold leading-snug tracking-tight">{e.degree}</h4>
                    <p className="mt-1 text-sm text-accent">{e.school}</p>
                    {e.body ? <p className="mt-3 text-sm leading-relaxed text-fg/65">{e.body}</p> : null}
                  </Reveal>
                ))}
              </ul>
            </Block>
          ) : null}

          <Block icon={Certificate} title="Certifications" count={resume.certifications.length}>
            {resume.certifications.length ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {resume.certifications.map((c, i) => (
                  <Reveal as="li" key={c.id} delay={i * 0.04}>
                    <a
                      href={c.url || undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex h-full items-start gap-4 rounded-3xl border border-line bg-surface/60 p-5 backdrop-blur transition-colors duration-200 hover:border-accent/40"
                    >
                      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent">
                        <Certificate size={20} weight="duotone" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium leading-snug">{c.name}</span>
                        <span className="mt-1 block text-sm text-muted">
                          {c.issuer}
                          {c.date ? ` · ${c.date}` : ""}
                        </span>
                        {c.credentialId ? <span className="mt-1 block truncate font-mono text-[11px] text-muted/80">ID {c.credentialId}</span> : null}
                      </span>
                      {c.url ? <ArrowUpRight size={16} className="mt-1 shrink-0 text-muted transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" /> : null}
                    </a>
                  </Reveal>
                ))}
              </ul>
            ) : (
              <p className="rounded-3xl border border-dashed border-line-strong p-6 text-sm text-muted">Certifications are on their way.</p>
            )}
          </Block>

          {resume.courses.length ? (
            <Block icon={BookOpen} title="Courses" count={resume.courses.length}>
              <ul className="divide-y divide-line border-y border-line">
                {resume.courses.map((c) => (
                  <li key={c.id}>
                    <a href={c.url || undefined} target="_blank" rel="noreferrer" className="group flex items-center gap-4 py-4">
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{c.name}</span>
                        <span className="block text-sm text-muted">{c.provider}</span>
                      </span>
                      <span className="font-mono text-xs text-muted">{c.date}</span>
                      {c.url ? <ArrowUpRight size={15} className="text-muted transition-colors group-hover:text-accent" /> : null}
                    </a>
                  </li>
                ))}
              </ul>
            </Block>
          ) : null}
        </div>
      </div>
    </section>
  );
}
