"use client";

import { useActionState, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowSquareOut,
  ArrowUp,
  Briefcase,
  Eye,
  EyeSlash,
  PencilSimple,
  Plus,
  Star,
  Trash,
} from "@phosphor-icons/react/dist/ssr";
import { deleteProject, moveProject, saveProject, toggleProject } from "@/app/dashboard/actions";
import { ProjectVisualView } from "@/components/sections/work-visuals";
import { projectVisuals, type Project } from "@/lib/site";
import { cn } from "@/lib/utils";
import { ActionButton, ActionStatus, EmptyState, Field, Modal, PageHeader, SubmitButton, Switch, inputClass } from "./ui";

function ProjectForm({ project, onSaved }: { project: Project | null; onSaved: () => void }) {
  const [state, action, pending] = useActionState(saveProject, null);
  useEffect(() => {
    if (state?.ok) onSaved();
  }, [state, onSaved]);

  return (
    <form action={action} className="grid gap-4">
      {project ? <input type="hidden" name="id" value={project.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
        <Field label="Title" htmlFor="p-title">
          <input id="p-title" name="title" required maxLength={80} defaultValue={project?.title} className={inputClass} />
        </Field>
        <Field label="Year" htmlFor="p-year">
          <input id="p-year" name="year" maxLength={10} defaultValue={project?.year ?? String(new Date().getFullYear())} className={inputClass} />
        </Field>
      </div>
      <Field label="Kicker" hint="A short line above the title, e.g. 'Mobile app · Healthcare'." htmlFor="p-kicker">
        <input id="p-kicker" name="kicker" maxLength={80} defaultValue={project?.kicker} className={inputClass} />
      </Field>
      <Field label="Description" htmlFor="p-desc">
        <textarea id="p-desc" name="description" rows={4} maxLength={600} defaultValue={project?.description} className={inputClass + " resize-y"} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Link" hint="GitHub repo or live demo." htmlFor="p-href">
          <input id="p-href" name="href" type="url" placeholder="https://" defaultValue={project?.href} className={inputClass} />
        </Field>
        <Field label="Tags" hint="Comma separated." htmlFor="p-tags">
          <input id="p-tags" name="tags" defaultValue={project?.tags.join(", ")} className={inputClass} />
        </Field>
      </div>
      <Field label="Illustration" htmlFor="p-visual">
        <select id="p-visual" name="visual" defaultValue={project?.visual ?? "none"} className={inputClass}>
          {projectVisuals.map((v) => (
            <option key={v} value={v}>
              {v === "none" ? "None" : v[0].toUpperCase() + v.slice(1)}
            </option>
          ))}
        </select>
      </Field>
      <div className="flex flex-wrap gap-6 pt-1">
        <Switch name="visible" defaultChecked={project?.visible ?? true} label="Visible on the site" />
        <Switch name="featured" defaultChecked={project?.featured ?? false} label="Featured (big tile)" />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 border-t border-line pt-5">
        <ActionStatus state={state} />
        <SubmitButton pending={pending}>{project ? "Save changes" : "Add project"}</SubmitButton>
      </div>
    </form>
  );
}

export function ProjectsManager({ projects, startNew }: { projects: Project[]; startNew: boolean }) {
  const [editing, setEditing] = useState<Project | "new" | null>(startNew ? "new" : null);
  const close = () => setEditing(null);

  return (
    <>
      <PageHeader
        title="Projects"
        description="What shows up in the Work grid and as kiosks in the World. Order here is the order on the site."
        actions={
          <button type="button" onClick={() => setEditing("new")} className="press inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-accent-ink">
            <Plus size={16} weight="bold" /> Add project
          </button>
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={22} />}
          title="No projects yet"
          body="Add your first project and it appears in the Work grid straight away."
          action={
            <button type="button" onClick={() => setEditing("new")} className="press inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-accent-ink">
              <Plus size={16} weight="bold" /> Add project
            </button>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {projects.map((p, i) => (
            <li
              key={p.id}
              className={cn(
                "flex flex-wrap items-center gap-4 rounded-3xl border border-line bg-surface p-4 transition-colors md:flex-nowrap md:p-5",
                !p.visible && "opacity-60",
              )}
            >
              <div className="hidden h-20 w-32 shrink-0 overflow-hidden rounded-2xl border border-line bg-bg p-2 sm:block">
                <div className="origin-top-left scale-[0.42] [width:240%]">
                  <ProjectVisualView visual={p.visual} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold tracking-tight">{p.title}</p>
                  {p.featured ? <span className="rounded-full bg-ember/15 px-2 py-0.5 text-[11px] font-medium text-ember">Featured</span> : null}
                  {!p.visible ? <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted">Hidden</span> : null}
                </div>
                <p className="mt-0.5 truncate text-sm text-muted">
                  {p.kicker || "No kicker"} · {p.year}
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <li key={t} className="rounded-full border border-line px-2 py-0.5 text-[11px] text-fg/70">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center gap-0.5">
                <ActionButton action={moveProject.bind(null, p.id, -1)} label="Move up" className={i === 0 ? "invisible" : ""}>
                  <ArrowUp size={16} />
                </ActionButton>
                <ActionButton action={moveProject.bind(null, p.id, 1)} label="Move down" className={i === projects.length - 1 ? "invisible" : ""}>
                  <ArrowDown size={16} />
                </ActionButton>
                <ActionButton action={toggleProject.bind(null, p.id, "featured")} label={p.featured ? "Unfeature" : "Feature"}>
                  <Star size={16} weight={p.featured ? "fill" : "regular"} className={p.featured ? "text-ember" : ""} />
                </ActionButton>
                <ActionButton action={toggleProject.bind(null, p.id, "visible")} label={p.visible ? "Hide from site" : "Show on site"}>
                  {p.visible ? <Eye size={16} /> : <EyeSlash size={16} />}
                </ActionButton>
                {p.href ? (
                  <a href={p.href} target="_blank" rel="noreferrer" aria-label="Open link" title="Open link" className="inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-fg">
                    <ArrowSquareOut size={16} />
                  </a>
                ) : null}
                <ActionButton action={async () => setEditing(p)} label="Edit">
                  <PencilSimple size={16} />
                </ActionButton>
                <ActionButton action={deleteProject.bind(null, p.id)} label="Delete" confirm="Delete?">
                  <Trash size={16} />
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={editing !== null} onClose={close} title={editing === "new" ? "Add a project" : "Edit project"}>
        {editing !== null ? <ProjectForm key={editing === "new" ? "new" : editing.id} project={editing === "new" ? null : editing} onSaved={close} /> : null}
      </Modal>
    </>
  );
}
