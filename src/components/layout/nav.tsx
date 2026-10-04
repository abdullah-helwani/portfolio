"use client";

import Link from "next/link";
import { motion, useScroll, useSpring } from "motion/react";
import { GithubLogo } from "@phosphor-icons/react/dist/ssr";
import { site } from "@/lib/site";
import { easeOut } from "@/lib/utils";

const links = [
  { href: "/#about", label: "About" },
  { href: "/#work", label: "Work" },
  { href: "/#focus", label: "Focus" },
  { href: "/#contact", label: "Contact" },
];

export function Nav() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, restDelta: 0.001 });

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
        transition={{ duration: 0.8, ease: easeOut, delay: 0.9 }}
        className="fixed inset-x-0 top-4 z-50 flex justify-center px-4"
      >
        <nav
          aria-label="Primary"
          className="flex w-full max-w-[720px] items-center justify-between gap-2 rounded-full border border-line-strong bg-bg/60 py-1.5 pl-4 pr-1.5 shadow-[0_20px_50px_-24px_rgb(0_0_0/0.8)] backdrop-blur-xl"
        >
          <Link href="/#top" className="flex items-center gap-2.5 text-sm font-medium tracking-tight">
            <span className="grid size-7 place-items-center rounded-full bg-fg font-serif text-[15px] italic text-bg">
              {site.firstName[0]}
            </span>
            <span className="hidden sm:inline">{site.name}</span>
          </Link>
          <ul className="flex items-center">
            {links.map((link) => (
              <li key={link.href} className={link.label === "Focus" ? "hidden md:block" : undefined}>
                <Link
                  href={link.href}
                  className="rounded-full px-3 py-2 text-[13px] text-muted transition-colors duration-200 hover:text-fg"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <a
            href={site.github}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub profile"
            className="press grid size-9 place-items-center rounded-full bg-surface-2 text-fg transition-colors duration-200 hover:bg-accent hover:text-accent-ink"
          >
            <GithubLogo size={18} weight="fill" />
          </a>
        </nav>
      </motion.header>
    </>
  );
}
