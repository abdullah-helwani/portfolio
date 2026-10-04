"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, ArrowUpRight, EnvelopeSimple, FileText, GithubLogo, LinkedinLogo, MapPin, X } from "@phosphor-icons/react/dist/ssr";
import { formatDate, StatusPill } from "@/components/log/status";
import { ContactForm } from "@/components/sections/contact-form";
import { ProjectVisualView } from "@/components/sections/work-visuals";
import type { Content } from "@/lib/site";
import { easeOut } from "@/lib/utils";
import type { Station } from "./layout";

export type PanelTarget = Station | "end";

type Stats = { xp: number; bits: number; seen: number; quests: number; totalQuests: number };

export function CityPanel({
  station,
  content,
  stats,
  onClose,
}: {
  station: PanelTarget;
  content: Content;
  stats: Stats;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const { profile } = content;

  let body: React.ReactNode = null;
  let title = "";
  let kicker = "";

  if (station === "end") {
    kicker = "City complete";
    title = "You explored the whole city";
    body = (
      <div>
        <p className="leading-relaxed text-muted">
          Thanks for exploring every district. If something here made you think &ldquo;we should work together&rdquo;, head to the Post Office or use the buttons below.
        </p>
        <dl className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line text-center">
          {[
            { k: "XP", v: stats.xp },
            { k: "Bits", v: stats.bits },
            { k: "Quests", v: `${stats.quests}/${stats.totalQuests}` },
          ].map((s) => (
            <div key={s.k} className="bg-surface p-4">
              <dd className="font-mono text-2xl tabular-nums">{s.v}</dd>
              <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{s.k}</dt>
            </div>
          ))}
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/#contact" className="press inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-ink">
            Get in touch <ArrowRight size={14} weight="bold" />
          </Link>
          <Link href="/" className="press inline-flex h-11 items-center rounded-full border border-line-strong px-5 text-sm">
            Back to the main site
          </Link>
          <button type="button" onClick={onClose} className="h-11 rounded-full px-4 text-sm text-muted hover:text-fg">
            Keep exploring
          </button>
        </div>
      </div>
    );
  } else if (station.kind === "house") {
    kicker = "About me";
    title = profile.name;
    body = (
      <div>
        <p className="text-sm text-accent">{profile.tagline || profile.role}</p>
        <p className="mt-4 text-[17px] leading-relaxed text-fg/85">{profile.about}</p>
        <ul className="mt-6 flex flex-wrap gap-2 text-sm">
          {profile.location ? (
            <li className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-fg/75">
              <MapPin size={14} /> {profile.location}
            </li>
          ) : null}
          <li className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-fg/75">
            <span className={profile.available ? "size-2 rounded-full bg-accent" : "size-2 rounded-full bg-muted"} />
            {profile.status}
          </li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-2">
          <a href={profile.github} target="_blank" rel="noreferrer" className="press inline-flex h-10 items-center gap-2 rounded-full border border-line-strong px-4 text-sm">
            <GithubLogo size={16} weight="fill" /> GitHub
          </a>
          {profile.linkedin ? (
            <a href={profile.linkedin} target="_blank" rel="noreferrer" className="press inline-flex h-10 items-center gap-2 rounded-full border border-line-strong px-4 text-sm">
              <LinkedinLogo size={16} weight="fill" /> LinkedIn
            </a>
          ) : null}
          {profile.email ? (
            <a href={`mailto:${profile.email}`} className="press inline-flex h-10 items-center gap-2 rounded-full border border-line-strong px-4 text-sm">
              <EnvelopeSimple size={16} weight="fill" /> Email
            </a>
          ) : null}
          {profile.cvUrl ? (
            <a href={profile.cvUrl} target="_blank" rel="noreferrer" className="press inline-flex h-10 items-center gap-2 rounded-full border border-line-strong px-4 text-sm">
              <FileText size={16} weight="fill" /> CV
            </a>
          ) : null}
        </div>
      </div>
    );
  } else if (station.kind === "kiosk") {
    const p = station.project;
    kicker = `Project · ${p.year}`;
    title = p.title;
    body = (
      <div>
        <p className="text-sm" style={{ color: station.color }}>
          {p.kicker}
        </p>
        {p.visual !== "none" ? (
          <div className="mt-5 max-w-[420px]">
            <ProjectVisualView visual={p.visual} />
          </div>
        ) : null}
        <p className="mt-5 leading-relaxed text-fg/85">{p.description}</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {p.tags.map((t) => (
            <li key={t} className="rounded-full border border-line px-3 py-1 text-xs text-fg/70">
              {t}
            </li>
          ))}
        </ul>
        <a href={p.href} target="_blank" rel="noreferrer" className="press mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-ink">
          Open the project <ArrowUpRight size={14} weight="bold" />
        </a>
      </div>
    );
  } else if (station.kind === "board") {
    kicker = "Build log";
    title = "Done, doing, next";
    body = (
      <div>
        <ul className="space-y-3">
          {station.posts.slice(0, 5).map((post) => (
            <li key={post.id}>
              <Link href={`/log/${post.slug}`} className="group block rounded-2xl border border-line bg-bg p-4 transition-colors hover:border-line-strong">
                <div className="flex items-center gap-3">
                  <StatusPill status={post.status} />
                  <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted">{formatDate(post.date)}</span>
                </div>
                <p className="mt-2 font-semibold tracking-tight">{post.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{post.summary}</p>
              </Link>
            </li>
          ))}
          {station.posts.length === 0 ? <li className="text-muted">The board is empty for now.</li> : null}
        </ul>
        <Link href="/log" className="mt-5 inline-flex items-center gap-1.5 text-sm text-accent">
          Read the full log <ArrowRight size={14} />
        </Link>
      </div>
    );
  } else if (station.kind === "arcade") {
    kicker = "Arcade";
    title = "Insert coin";
    body = (
      <div>
        <p className="leading-relaxed text-muted">
          The cabinets here are wired to the retro computer on the main page. Beat 10 and 25 points in Snake for two more achievements.
        </p>
        <Link href="/#play" className="press mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-ink">
          Play Snake <ArrowRight size={14} weight="bold" />
        </Link>
      </div>
    );
  } else if (station.kind === "mailbox") {
    kicker = "Contact";
    title = "Leave me a message";
    body = <ContactForm />;
  }

  return (
    <motion.div
      className="absolute inset-0 z-20 flex items-end justify-center bg-bg/60 p-4 backdrop-blur-[2px] sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={{ opacity: 0, transform: "translateY(24px) scale(0.97)" }}
        animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
        exit={{ opacity: 0, transform: "translateY(12px) scale(0.98)", transition: { duration: 0.15 } }}
        transition={{ duration: 0.4, ease: easeOut }}
        className="relative max-h-[82dvh] w-full max-w-[600px] overflow-y-auto rounded-[2rem] border border-white/10 bg-[#0d1113]/95 p-6 shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9)] backdrop-blur-xl md:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="press absolute right-4 top-4 grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <X size={18} />
        </button>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">{kicker}</p>
        <h2 className="mb-5 mt-2 pr-10 text-3xl font-semibold tracking-[-0.03em]">{title}</h2>
        {body}
      </motion.div>
    </motion.div>
  );
}
