"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import { Command, GithubLogo, List, X } from "@phosphor-icons/react/dist/ssr";
import { useGameOptional } from "@/components/game/game-provider";
import { XpBadge } from "@/components/game/quest-ui";
import { defaultSections, type SectionConfig } from "@/lib/site";
import { cn, easeOut } from "@/lib/utils";

const sectionLinks: Partial<Record<SectionConfig["id"], { href: string; label: string }>> = {
  about: { href: "/#about", label: "About" },
  resume: { href: "/#resume", label: "Résumé" },
  work: { href: "/#work", label: "Work" },
  lab: { href: "/#lab", label: "AI Lab" },
  playground: { href: "/#play", label: "Arcade" },
  contact: { href: "/#contact", label: "Contact" },
};

function navLinks(sections: SectionConfig[] | undefined, card: boolean) {
  const shown = (sections ?? defaultSections).filter((s) => s.visible && sectionLinks[s.id]).map((s) => sectionLinks[s.id]!);
  const contact = shown.find((l) => l.href === "/#contact");
  const out = shown.filter((l) => l !== contact);
  out.push({ href: "/world", label: "City" });
  if (card) out.push({ href: "/card", label: "Card" });
  if (contact) out.push(contact);
  return out;
}

export function Logo({ name, logoUrl, className }: { name: string; logoUrl?: string; className?: string }) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt={`${name} logo`} className={cn("size-8 rounded-full object-contain", className)} />
    );
  }
  return (
    <span
      className={cn("grid size-8 place-items-center rounded-full bg-fg font-mono text-[15px] font-semibold text-bg", className)}
      aria-hidden="true"
    >
      {name.trim()[0] ?? ""}
    </span>
  );
}

export function Nav({ name, github, logoUrl, sections, card = false }: { name: string; github: string; logoUrl?: string; sections?: SectionConfig[]; card?: boolean }) {
  const links = navLinks(sections, card);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, restDelta: 0.001 });
  const game = useGameOptional();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const taps = useRef(0);
  const [spin, setSpin] = useState(0);

  const onLogo = () => {
    taps.current += 1;
    setSpin((s) => s + 1);
    if (taps.current >= 5) game?.unlock("logo");
  };

  const isActive = (href: string) => !href.startsWith("/#") && pathname.startsWith(href);

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-50 h-px origin-left bg-accent"
        style={{ scaleX: progress }}
      />
      <motion.header
        initial={{ opacity: 0, transform: "translateY(-12px)" }}
        animate={{ opacity: 1, transform: "translateY(0px)" }}
        transition={{ duration: 0.8, ease: easeOut, delay: pathname === "/" ? 0.9 : 0.1 }}
        className="fixed inset-x-0 top-4 z-50 flex justify-center px-4"
      >
        <nav
          aria-label="Primary"
          className="flex w-full max-w-[1020px] items-center justify-between gap-2 rounded-full border border-line-strong bg-bg/65 py-1.5 pl-2 pr-1.5 shadow-[0_20px_50px_-24px_rgb(0_0_0/0.8)] backdrop-blur-xl"
        >
          <Link href="/" onClick={onLogo} className="flex items-center gap-2.5 rounded-full pr-2 text-sm font-medium tracking-tight">
            <motion.span
              animate={{ rotate: spin * 72 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="inline-flex"
            >
              <Logo name={name} logoUrl={logoUrl} />
            </motion.span>
            <span className="hidden lg:inline">{name}</span>
          </Link>

          <ul className="hidden items-center md:flex">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] transition-colors duration-200 hover:text-fg",
                    isActive(link.href) ? "text-fg" : "text-muted",
                  )}
                >
                  {link.label === "City" ? <span className="size-1.5 rounded-full bg-ember" aria-hidden="true" /> : null}
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1.5">
            {game ? (
              <>
                <button
                  type="button"
                  onClick={game.openPalette}
                  aria-label="Open command palette"
                  className="press hidden h-9 items-center gap-1.5 rounded-full bg-surface-2 px-3 text-[12px] text-muted transition-colors duration-200 hover:text-fg sm:flex"
                >
                  <Command size={14} />K
                </button>
                <XpBadge />
              </>
            ) : null}
            <a
              href={github}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub profile"
              className="press hidden size-9 place-items-center rounded-full bg-surface-2 text-fg transition-colors duration-200 hover:bg-accent hover:text-accent-ink sm:grid"
            >
              <GithubLogo size={18} weight="fill" />
            </a>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="press grid size-9 place-items-center rounded-full bg-surface-2 md:hidden"
            >
              {open ? <X size={18} /> : <List size={18} />}
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, transform: "translateY(-8px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            exit={{ opacity: 0, transform: "translateY(-8px)", transition: { duration: 0.15 } }}
            transition={{ duration: 0.3, ease: easeOut }}
            className="fixed inset-x-4 top-[76px] z-50 rounded-3xl border border-line-strong bg-surface/95 p-2 backdrop-blur-xl md:hidden"
          >
            <ul>
              {links.map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, transform: "translateX(-8px)" }}
                  animate={{ opacity: 1, transform: "translateX(0px)" }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-2xl px-4 py-3.5 text-lg font-medium tracking-tight hover:bg-surface-2"
                  >
                    {link.label}
                    <span className="font-mono text-xs text-muted">0{i + 1}</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
