"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowSquareOut, Eye, EyeSlash, Notebook, PencilSimple, Plus, PushPin, Trash } from "@phosphor-icons/react/dist/ssr";
import { deletePost, savePost, togglePost } from "@/app/dashboard/actions";
import { formatDate, StatusPill, statusMeta } from "@/components/log/status";
import { postStatuses, type Post, type PostStatus } from "@/lib/site";
import { cn } from "@/lib/utils";
import { ActionButton, ActionStatus, EmptyState, Field, Modal, PageHeader, SubmitButton, Switch, inputClass } from "./ui";

function PostForm({ post, onSaved }: { post: Post | null; onSaved: () => void }) {
  const [state, action, pending] = useActionState(savePost, null);
  const [status, setStatus] = useState<PostStatus>(post?.status ?? "shipped");
  useEffect(() => {
    if (state?.ok) onSaved();
  }, [state, onSaved]);

  return (
    <form action={action} className="grid gap-4">
      {post ? <input type="hidden" name="id" value={post.id} /> : null}
      <input type="hidden" name="status" value={status} />
      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-fg/85">What kind of entry is this?</legend>
        <div className="grid grid-cols-3 gap-2">
          {postStatuses.map((s) => {
            const meta = statusMeta[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                aria-pressed={status === s}
                className={cn(
                  "press rounded-2xl border p-3 text-left transition-colors",
                  status === s ? meta.className : "border-line text-muted hover:border-line-strong",
                )}
              >
                <meta.Icon size={18} weight={status === s ? "fill" : "regular"} />
                <p className="mt-2 text-sm font-medium">{meta.label}</p>
                <p className="text-[11px] opacity-75">{s === "shipped" ? "Something you've done" : s === "building" ? "Work in progress" : "What you want to do"}</p>
              </button>
            );
          })}
        </div>
      </fieldset>
      <Field label="Title" htmlFor="e-title">
        <input id="e-title" name="title" required maxLength={120} defaultValue={post?.title} className={inputClass} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date" htmlFor="e-date">
          <input id="e-date" name="date" type="date" required defaultValue={post?.date ?? new Date().toISOString().slice(0, 10)} className={inputClass + " h-11 py-0 [color-scheme:dark]"} />
        </Field>
        <Field label="Address" hint="Leave empty to generate it from the title." htmlFor="e-slug">
          <div className="flex h-11 items-center rounded-xl border border-line-strong bg-bg pl-3 text-sm text-muted focus-within:border-accent">
            /log/
            <input id="e-slug" name="slug" defaultValue={post?.slug} className="w-full bg-transparent py-2.5 pr-3 text-fg focus:outline-none" />
          </div>
        </Field>
      </div>
      <Field label="Summary" hint="One or two sentences shown on cards." htmlFor="e-summary">
        <textarea id="e-summary" name="summary" rows={2} maxLength={300} defaultValue={post?.summary} className={inputClass + " resize-y"} />
      </Field>
      <Field label="Body" hint="Blank line = new paragraph. Supports **bold**, `code`, [links](https://…), '- ' bullets and '## ' headings." htmlFor="e-body">
        <textarea id="e-body" name="body" rows={9} defaultValue={post?.body} className={inputClass + " resize-y font-mono text-[13px] leading-relaxed"} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tags" hint="Comma separated." htmlFor="e-tags">
          <input id="e-tags" name="tags" defaultValue={post?.tags.join(", ")} className={inputClass} />
        </Field>
        <Field label="Link" hint="Optional: repo, demo or article." htmlFor="e-link">
          <input id="e-link" name="link" type="url" placeholder="https://" defaultValue={post?.link} className={inputClass} />
        </Field>
      </div>
      <div className="flex flex-wrap gap-6 pt-1">
        <Switch name="published" defaultChecked={post?.published ?? true} label="Published" />
        <Switch name="pinned" defaultChecked={post?.pinned ?? false} label="Pin to top" />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 border-t border-line pt-5">
        <ActionStatus state={state} />
        <SubmitButton pending={pending}>{post ? "Save changes" : "Publish entry"}</SubmitButton>
      </div>
    </form>
  );
}

export function PostsManager({ posts, startNew }: { posts: Post[]; startNew: boolean }) {
  const [editing, setEditing] = useState<Post | "new" | null>(startNew ? "new" : null);
  const [filter, setFilter] = useState<PostStatus | "all">("all");
  const close = () => setEditing(null);
  const shown = filter === "all" ? posts : posts.filter((p) => p.status === filter);

  return (
    <>
      <PageHeader
        title="Build log"
        description="Publish what you've shipped, what you're building and what you plan to do next."
        actions={
          <button type="button" onClick={() => setEditing("new")} className="press inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-accent-ink">
            <Plus size={16} weight="bold" /> New entry
          </button>
        }
      />

      <div className="mb-5 inline-flex rounded-full border border-line bg-surface p-1">
        {(["all", ...postStatuses] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilter(t)}
            className={cn("rounded-full px-4 py-1.5 text-sm transition-colors", filter === t ? "bg-fg text-bg" : "text-muted hover:text-fg")}
          >
            {t === "all" ? "All" : statusMeta[t].label}{" "}
            <span className="opacity-60">{t === "all" ? posts.length : posts.filter((p) => p.status === t).length}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={<Notebook size={22} />}
          title="Nothing here yet"
          body="Write a quick entry about something you finished, something you're building, or something you want to try."
          action={
            <button type="button" onClick={() => setEditing("new")} className="press inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-accent-ink">
              <Plus size={16} weight="bold" /> New entry
            </button>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {shown.map((p) => (
            <li key={p.id} className={cn("flex flex-wrap items-center gap-4 rounded-3xl border border-line bg-surface p-5 md:flex-nowrap", !p.published && "border-dashed")}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={p.status} />
                  <span className="font-mono text-xs text-muted">{formatDate(p.date)}</span>
                  {p.pinned ? <PushPin size={14} weight="fill" className="text-ember" aria-label="Pinned" /> : null}
                  {!p.published ? <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted">Draft</span> : null}
                </div>
                <p className="mt-2 font-semibold tracking-tight">{p.title}</p>
                <p className="mt-0.5 line-clamp-1 text-sm text-muted">{p.summary}</p>
              </div>
              <div className="flex items-center gap-0.5">
                <ActionButton action={togglePost.bind(null, p.id, "pinned")} label={p.pinned ? "Unpin" : "Pin"}>
                  <PushPin size={16} weight={p.pinned ? "fill" : "regular"} className={p.pinned ? "text-ember" : ""} />
                </ActionButton>
                <ActionButton action={togglePost.bind(null, p.id, "published")} label={p.published ? "Unpublish" : "Publish"}>
                  {p.published ? <Eye size={16} /> : <EyeSlash size={16} />}
                </ActionButton>
                {p.published ? (
                  <Link href={`/log/${p.slug}`} target="_blank" aria-label="View on site" title="View on site" className="inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-fg">
                    <ArrowSquareOut size={16} />
                  </Link>
                ) : null}
                <ActionButton action={async () => setEditing(p)} label="Edit">
                  <PencilSimple size={16} />
                </ActionButton>
                <ActionButton action={deletePost.bind(null, p.id)} label="Delete" confirm="Delete?">
                  <Trash size={16} />
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={editing !== null} onClose={close} title={editing === "new" ? "New log entry" : "Edit entry"} wide>
        {editing !== null ? <PostForm key={editing === "new" ? "new" : editing.id} post={editing === "new" ? null : editing} onSaved={close} /> : null}
      </Modal>
    </>
  );
}
