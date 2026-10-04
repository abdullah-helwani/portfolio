import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  EnvelopeSimple,
  EnvelopeSimpleOpen,
  Eye,
  Notebook,
  Plus,
  TrendDown,
  TrendUp,
} from "@phosphor-icons/react/dist/ssr";
import { AvailabilityToggle } from "@/components/dashboard/availability-toggle";
import { Card, EmptyState, PageHeader } from "@/components/dashboard/ui";
import { ViewsChart } from "@/components/dashboard/views-chart";
import { getDb, today } from "@/lib/store";

function lastDays(views: Record<string, number>, days: number, offset = 0) {
  const out: { date: string; views: number }[] = [];
  const now = Date.now();
  for (let i = days - 1 + offset; i >= offset; i--) {
    const date = today(new Date(now - i * 86_400_000));
    out.push({ date, views: views[date] ?? 0 });
  }
  return out;
}

function relative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export default async function Overview() {
  const db = await getDb();
  const series = lastDays(db.views, 30);
  const prev = lastDays(db.views, 30, 30);
  const total = series.reduce((s, d) => s + d.views, 0);
  const prevTotal = prev.reduce((s, d) => s + d.views, 0);
  const delta = prevTotal ? Math.round(((total - prevTotal) / prevTotal) * 100) : null;
  const unread = db.messages.filter((m) => !m.read && !m.archived);
  const inbox = db.messages.filter((m) => !m.archived);
  const visibleProjects = db.projects.filter((p) => p.visible).length;
  const published = db.posts.filter((p) => p.published).length;
  const drafts = db.posts.length - published;
  const recent = inbox.slice(0, 5);

  const tiles = [
    {
      label: "Views · 30 days",
      value: total.toLocaleString(),
      note:
        delta === null ? (
          <span className="text-muted">No earlier data yet</span>
        ) : (
          <span className={delta >= 0 ? "inline-flex items-center gap-1 text-accent" : "inline-flex items-center gap-1 text-ember"}>
            {delta >= 0 ? <TrendUp size={14} /> : <TrendDown size={14} />}
            {delta >= 0 ? "+" : ""}
            {delta}% vs previous 30 days
          </span>
        ),
      icon: Eye,
    },
    { label: "Unread messages", value: unread.length, note: <span className="text-muted">{inbox.length} in inbox</span>, icon: EnvelopeSimple, href: "/dashboard/messages" },
    { label: "Live projects", value: visibleProjects, note: <span className="text-muted">{db.projects.length - visibleProjects} hidden</span>, icon: Briefcase, href: "/dashboard/projects" },
    { label: "Log entries", value: published, note: <span className="text-muted">{drafts} draft{drafts === 1 ? "" : "s"}</span>, icon: Notebook, href: "/dashboard/log" },
  ];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${db.profile.firstName}`}
        description="Here's how the site is doing and what needs your attention."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/log?new=1" className="press inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-accent-ink">
              <Plus size={16} weight="bold" /> New log entry
            </Link>
            <Link href="/dashboard/projects?new=1" className="press inline-flex h-10 items-center gap-2 rounded-full border border-line-strong px-4 text-sm">
              <Plus size={16} weight="bold" /> Add project
            </Link>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => {
          const Icon = t.icon;
          const inner = (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted">{t.label}</p>
                <Icon size={18} className="text-muted" />
              </div>
              <p className="mt-3 font-mono text-4xl tabular-nums tracking-tight">{t.value}</p>
              <p className="mt-2 text-xs">{t.note}</p>
            </>
          );
          return t.href ? (
            <Link key={t.label} href={t.href} className="rounded-3xl border border-line bg-surface p-5 transition-colors hover:border-line-strong">
              {inner}
            </Link>
          ) : (
            <div key={t.label} className="rounded-3xl border border-line bg-surface p-5">
              {inner}
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card title="Traffic" description="Counted once per visitor tab, no cookies.">
          <ViewsChart data={series} />
        </Card>
        <Card title="Availability" description="Shown in the hero, about section and the World.">
          <AvailabilityToggle available={db.profile.available} status={db.profile.status} />
        </Card>
      </div>

      <div className="mt-4">
        <Card
          title="Latest messages"
          actions={
            <Link href="/dashboard/messages" className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
              Open inbox <ArrowRight size={14} />
            </Link>
          }
        >
          {recent.length === 0 ? (
            <EmptyState
              icon={<EnvelopeSimpleOpen size={22} />}
              title="No messages yet"
              body="When someone uses the contact form on your site or the mailbox in the World, it lands here."
            />
          ) : (
            <ul className="-my-2 divide-y divide-line">
              {recent.map((m) => (
                <li key={m.id}>
                  <Link href={`/dashboard/messages?id=${m.id}`} className="flex items-center gap-4 py-3 transition-colors hover:text-fg">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 font-medium uppercase">{m.name[0]}</span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm">
                        <span className={m.read ? "text-fg/80" : "font-semibold"}>{m.name}</span>
                        {!m.read ? <span className="size-2 rounded-full bg-accent" aria-label="Unread" /> : null}
                      </p>
                      <p className="truncate text-sm text-muted">{m.body}</p>
                    </div>
                    <span className="shrink-0 font-mono text-xs text-muted">{relative(m.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
