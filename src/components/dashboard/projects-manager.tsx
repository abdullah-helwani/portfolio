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
import { UploadButton, type UploadKind } from "./upload";

function UrlUpload({ name, label, hint, defaultValue, kind }: { name: string; label: string; hint?: string; defaultValue?: string; kind: UploadKind }) {
  const [value, setValue] = useState(defaultValue ?? "");
  return (
    <Field label={label} hint={hint} htmlFor={`p-${name}`}>
      <span className="flex items-start gap-2">
        <input id={`p-${name}`} name={name} value={value} onChange={(e) => setValue(e.target.value)} placeholder="https://" className={inputClass} />
        <UploadButton kind={kind} onUploaded={setValue} />
      </span>
    </Field>
  );
}

function ProjectForm({ project, onSaved, demos }: { project: Project | null; onSaved: () => void; demos: { id: string; title: string }[] }) {
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
      <Field label="Full write-up" hint="Shown on the project's own page. Leave a blank line between paragraphs." htmlFor="p-details">
        <textarea id="p-details" name="details" rows={6} maxLength={12000} defaultValue={project?.details} className={inputClass + " resize-y leading-relaxed"} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your role" htmlFor="p-role">
          <input id="p-role" name="role" maxLength={120} defaultValue={project?.role} placeholder="e.g. Lead developer" className={inputClass} />
        </Field>
        <Field label="Tags" hint="Comma separated." htmlFor="p-tags">
          <input id="p-tags" name="tags" defaultValue={project?.tags.join(", ")} className={inputClass} />
        </Field>
      </div>
      <Field label="Highlights" hint="One per line. Shown as a checklist on the project page." htmlFor="p-highlights">
        <textarea id="p-highlights" name="highlights" rows={3} defaultValue={project?.highlights.join("\n")} className={inputClass + " resize-y"} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Live website" hint="The real, running site or app. Visitors can preview it." htmlFor="p-liveUrl">
          <input id="p-liveUrl" name="liveUrl" placeholder="https://" defaultValue={project?.liveUrl} className={inputClass} />
        </Field>
        <Field label="GitHub / source" htmlFor="p-href">
          <input id="p-href" name="href" placeholder="https://github.com/…" defaultValue={project?.href} className={inputClass} />
        </Field>
        <UrlUpload name="presentationUrl" label="Presentation" hint="Upload a PDF deck, or paste a Google Slides / Canva link." defaultValue={project?.presentationUrl} kind="pdf" />
        <UrlUpload name="coverUrl" label="Cover image" hint="Screenshot or artwork. Replaces the illustration." defaultValue={project?.coverUrl} kind="image" />
        <Field label="Video" hint="YouTube or Vimeo link, or a video from your Videos page." htmlFor="p-videoUrl">
          <input id="p-videoUrl" name="videoUrl" placeholder="https://youtube.com/…" defaultValue={project?.videoUrl} className={inputClass} />
        </Field>
        <Field label="Try-it demo" hint="Attach an AI Lab demo to this project." htmlFor="p-demo">
          <select id="p-demo" name="demoId" defaultValue={project?.demoId ?? ""} className={inputClass}>
            <option value="">None</option>
            {demos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Illustration" hint="Used when there's no cover image." htmlFor="p-visual">
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

export function ProjectsManager({ projects, startNew, demos }: { projects: Project[]; startNew: boolean; demos: { id: string; title: string }[] }) {
  const [editing, setEditing] = useState<Project | "new" | null>(startNew ? "new" : null);
  const close = () => setEditing(null);

  return (
    <>
      <PageHeader
        title="Projects"
        description="Each project gets a tile in the Work grid, its own page with the live site, GitHub and presentation, and a tower in the City. Order here is the order on the site."
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
                {p.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.coverUrl} alt="" className="-m-2 h-[calc(100%+1rem)] w-[calc(100%+1rem)] max-w-none object-cover" />
                ) : (
                  <div className="origin-top-left scale-[0.42] [width:240%]">
                    <ProjectVisualView visual={p.visual} />
                  </div>
                )}
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

      <Modal wide open={editing !== null} onClose={close} title={editing === "new" ? "Add a project" : "Edit project"}>
        {editing !== null ? <ProjectForm key={editing === "new" ? "new" : editing.id} project={editing === "new" ? null : editing} onSaved={close} demos={demos} /> : null}
      </Modal>
    </>
  );
}
