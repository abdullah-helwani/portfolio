import Link from "next/link";
import {
  Archive,
  ArrowBendUpLeft,
  ArrowCounterClockwise,
  Checks,
  EnvelopeSimple,
  EnvelopeSimpleOpen,
  MagnifyingGlass,
  Trash,
  Tray,
} from "@phosphor-icons/react/dist/ssr";
import { deleteMessage, markAllRead, setMessageArchived, setMessageRead } from "@/app/dashboard/actions";
import { MarkRead } from "@/components/dashboard/mark-read";
import { ActionButton, EmptyState, PageHeader, inputClass } from "@/components/dashboard/ui";
import { getDb } from "@/lib/store";
import { cn } from "@/lib/utils";

const views = [
  { id: "inbox", label: "Inbox" },
  { id: "unread", label: "Unread" },
  { id: "archived", label: "Archived" },
] as const;

function when(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default async function MessagesPage({ searchParams }: PageProps<"/dashboard/messages">) {
  const sp = await searchParams;
  const view = (typeof sp.view === "string" && views.some((v) => v.id === sp.view) ? sp.view : "inbox") as (typeof views)[number]["id"];
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const selectedId = typeof sp.id === "string" ? sp.id : "";

  const db = await getDb();
  const all = db.messages;
  const counts = {
    inbox: all.filter((m) => !m.archived).length,
    unread: all.filter((m) => !m.archived && !m.read).length,
    archived: all.filter((m) => m.archived).length,
  };
  const list = all
    .filter((m) => (view === "archived" ? m.archived : !m.archived && (view === "unread" ? !m.read : true)))
    .filter((m) => !q || `${m.name} ${m.email} ${m.body}`.toLowerCase().includes(q));
  const selected = all.find((m) => m.id === selectedId) ?? list[0];

  const href = (params: Record<string, string>) => {
    const u = new URLSearchParams({ view, ...(q ? { q } : {}), ...params });
    return `/dashboard/messages?${u.toString()}`;
  };

  return (
    <>
      <PageHeader
        title="Messages"
        description="Everything sent through the contact form and the World's mailbox."
        actions={
          counts.unread ? (
            <ActionButton action={markAllRead} label="Mark all as read" className="h-10 border border-line-strong px-4 text-fg">
              <Checks size={16} /> Mark all read
            </ActionButton>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full border border-line bg-surface p-1">
          {views.map((v) => (
            <Link
              key={v.id}
              href={`/dashboard/messages?view=${v.id}`}
              className={cn("rounded-full px-4 py-1.5 text-sm transition-colors", view === v.id ? "bg-fg text-bg" : "text-muted hover:text-fg")}
            >
              {v.label} <span className="opacity-60">{counts[v.id]}</span>
            </Link>
          ))}
        </div>
        <form className="relative min-w-[220px] flex-1 sm:max-w-[320px]">
          <input type="hidden" name="view" value={view} />
          <MagnifyingGlass size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={q} placeholder="Search name, email or text" aria-label="Search messages" className={inputClass + " h-10 rounded-full pl-9"} />
        </form>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(280px,380px)_1fr]">
        <div className="overflow-hidden rounded-3xl border border-line bg-surface">
          {list.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={<Tray size={22} />}
                title={q ? "No matches" : view === "archived" ? "Nothing archived" : "Inbox zero"}
                body={q ? `Nothing matches "${q}". Try a different word.` : "New messages from your site will appear here."}
              />
            </div>
          ) : (
            <ul className="max-h-[70vh] divide-y divide-line overflow-y-auto">
              {list.map((m) => (
                <li key={m.id}>
                  <Link
                    href={href({ id: m.id })}
                    className={cn(
                      "block px-5 py-4 transition-colors hover:bg-surface-2",
                      selected?.id === m.id && "bg-surface-2 shadow-[inset_3px_0_0_var(--accent)]",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {!m.read ? <span className="size-2 shrink-0 rounded-full bg-accent" aria-label="Unread" /> : null}
                      <p className={cn("truncate text-sm", m.read ? "text-fg/80" : "font-semibold")}>{m.name}</p>
                      <span className="ml-auto shrink-0 font-mono text-[11px] text-muted">{when(m.createdAt)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{m.body}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-line bg-surface">
          {selected ? (
            <article className="p-6 md:p-8">
              {!selected.read ? <MarkRead id={selected.id} /> : null}
              <div className="flex flex-wrap items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent/15 text-lg font-semibold uppercase text-accent">
                  {selected.name[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-semibold tracking-tight">{selected.name}</h2>
                  <a href={`mailto:${selected.email}`} className="text-sm text-muted hover:text-accent">
                    {selected.email}
                  </a>
                  <p className="mt-1 font-mono text-xs text-muted">{when(selected.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={`mailto:${selected.email}?subject=${encodeURIComponent("Re: your message on my portfolio")}`}
                    className="press inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-medium text-accent-ink"
                  >
                    <ArrowBendUpLeft size={16} /> Reply
                  </a>
                  <ActionButton action={setMessageRead.bind(null, selected.id, !selected.read)} label={selected.read ? "Mark as unread" : "Mark as read"}>
                    {selected.read ? <EnvelopeSimple size={18} /> : <EnvelopeSimpleOpen size={18} />}
                  </ActionButton>
                  <ActionButton
                    action={setMessageArchived.bind(null, selected.id, !selected.archived)}
                    label={selected.archived ? "Move to inbox" : "Archive"}
                  >
                    {selected.archived ? <ArrowCounterClockwise size={18} /> : <Archive size={18} />}
                  </ActionButton>
                  <ActionButton action={deleteMessage.bind(null, selected.id)} label="Delete message" confirm="Delete forever?">
                    <Trash size={18} />
                  </ActionButton>
                </div>
              </div>
              <div className="mt-6 whitespace-pre-wrap border-t border-line pt-6 text-[15px] leading-relaxed text-fg/85">{selected.body}</div>
            </article>
          ) : (
            <div className="grid min-h-[320px] place-items-center p-6 text-sm text-muted">Select a message to read it.</div>
          )}
        </div>
      </div>
    </>
  );
}
