"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  ArrowSquareOut,
  Briefcase,
  Buildings,
  EnvelopeSimple,
  FilmSlate,
  Flask,
  GameController,
  IdentificationCard,
  Lightning,
  Notebook,
  Scroll,
  SignOut,
  SquaresFour,
  Star,
  TextAa,
  UserCircle,
} from "@phosphor-icons/react/dist/ssr";
import { logout } from "@/app/dashboard/actions";
import { Logo } from "@/components/layout/nav";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Overview", icon: SquaresFour },
  { href: "/dashboard/messages", label: "Messages", icon: EnvelopeSimple, badge: "unread" as const },
  { href: "/dashboard/content", label: "Pages & text", icon: TextAa },
  { href: "/dashboard/projects", label: "Projects", icon: Briefcase },
  { href: "/dashboard/resume", label: "Résumé", icon: Scroll },
  { href: "/dashboard/skills", label: "Skills", icon: Lightning },
  { href: "/dashboard/log", label: "Build log", icon: Notebook },
  { href: "/dashboard/lab", label: "AI Lab", icon: Flask },
  { href: "/dashboard/videos", label: "Videos", icon: FilmSlate },
  { href: "/dashboard/city", label: "The City", icon: Buildings },
  { href: "/dashboard/points", label: "Points & rewards", icon: Star },
  { href: "/dashboard/arcade", label: "Arcade", icon: GameController },
  { href: "/dashboard/card", label: "Business card", icon: IdentificationCard },
  { href: "/dashboard/profile", label: "Profile & logo", icon: UserCircle },
];

export function DashboardShell({
  children,
  name,
  logoUrl,
  unread,
}: {
  children: React.ReactNode;
  name: string;
  logoUrl: string;
  unread: number;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href));

  return (
    <div className="min-h-[100dvh] lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-xl lg:h-[100dvh] lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 px-5 py-4 lg:py-6">
            <Logo name={name} logoUrl={logoUrl} className="size-9" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">{name}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Dashboard</p>
            </div>
          </div>
          <nav aria-label="Dashboard" className="overflow-x-auto px-3 pb-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overflow-x-visible">
            <ul className="flex gap-1 lg:flex-col">
              {nav.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href} className="shrink-0">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-150",
                        active ? "text-fg" : "text-muted hover:bg-surface hover:text-fg",
                      )}
                    >
                      {active ? (
                        <motion.span
                          layoutId="dash-active"
                          className="absolute inset-0 rounded-xl border border-line-strong bg-surface"
                          transition={{ type: "spring", stiffness: 420, damping: 36 }}
                        />
                      ) : null}
                      <Icon size={18} weight={active ? "fill" : "regular"} className={cn("relative", active && "text-accent")} />
                      <span className="relative whitespace-nowrap">{item.label}</span>
                      {item.badge === "unread" && unread > 0 ? (
                        <span className="relative ml-auto rounded-full bg-accent px-1.5 py-px font-mono text-[10px] font-semibold text-accent-ink">
                          {unread}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="hidden border-t border-line p-3 lg:block">
            <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface hover:text-fg">
              <ArrowSquareOut size={18} /> View site
            </Link>
            <form action={logout}>
              <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface hover:text-fg">
                <SignOut size={18} /> Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-8 md:px-8 lg:px-12 lg:py-12">
        <div className="mx-auto max-w-[1180px]">{children}</div>
        <div className="mx-auto mt-12 flex max-w-[1180px] gap-2 border-t border-line pt-6 lg:hidden">
          <Link href="/" className="rounded-full border border-line px-4 py-2 text-sm text-muted">
            View site
          </Link>
          <form action={logout}>
            <button type="submit" className="rounded-full border border-line px-4 py-2 text-sm text-muted">
              Sign out
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
