"use client";

import { useActionState, useRef } from "react";
import { FilePdf, ImageSquare, Trash, UploadSimple } from "@phosphor-icons/react/dist/ssr";
import { clearFile, saveProfile, uploadFile } from "@/app/dashboard/actions";
import { Logo } from "@/components/layout/nav";
import type { Profile } from "@/lib/site";
import { ActionButton, ActionStatus, Card, Field, PageHeader, SubmitButton, Switch, inputClass } from "./ui";

function Upload({ target, current, label, accept, hint }: { target: "logoUrl" | "cvUrl"; current: string; label: string; accept: string; hint: string }) {
  const [state, action, pending] = useActionState(uploadFile, null);
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={action} className="flex flex-wrap items-center gap-4">
      <input type="hidden" name="target" value={target} />
      <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-line-strong bg-bg">
        {target === "logoUrl" ? (
          current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current} alt="Current logo" className="size-full object-contain p-2" />
          ) : (
            <ImageSquare size={28} className="text-muted" />
          )
        ) : (
          <FilePdf size={28} className={current ? "text-accent" : "text-muted"} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted">{hint}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className="press inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-line-strong px-4 text-sm hover:border-fg/30">
            <UploadSimple size={16} />
            {pending ? "Uploading" : current ? "Replace" : "Upload"}
            <input
              type="file"
              name="file"
              accept={accept}
              className="sr-only"
              onChange={() => formRef.current?.requestSubmit()}
            />
          </label>
          {current ? (
            <ActionButton action={clearFile.bind(null, target)} label="Remove" confirm="Remove?">
              <Trash size={16} />
            </ActionButton>
          ) : null}
          <ActionStatus state={state} />
        </div>
      </div>
    </form>
  );
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(saveProfile, null);

  return (
    <>
      <PageHeader title="Profile & logo" description="Who you are, how to reach you, and the brand marks used across the site." />

      <Card title="Brand" description="Your logo replaces the monogram in the navigation, character sheet and dashboard." className="mb-4">
        <div className="grid gap-6 md:grid-cols-2">
          <Upload target="logoUrl" current={profile.logoUrl} label="Logo" accept="image/png,image/jpeg,image/webp,image/gif" hint="Square PNG or WebP with a transparent background works best. Max 4 MB." />
          <Upload target="cvUrl" current={profile.cvUrl} label="CV / résumé" accept="application/pdf" hint="PDF, max 4 MB. Linked from the About house and contact area." />
        </div>
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-line bg-bg p-3 text-sm text-muted">
          <Logo name={profile.name} logoUrl={profile.logoUrl} className="size-9" />
          This is how your mark looks in the navigation.
        </div>
      </Card>

      <form key={`${profile.logoUrl}|${profile.cvUrl}`} action={action} className="grid gap-4">
        <Card title="Identity">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" htmlFor="f-first">
              <input id="f-first" name="firstName" required defaultValue={profile.firstName} className={inputClass} />
            </Field>
            <Field label="Last name" htmlFor="f-last">
              <input id="f-last" name="lastName" defaultValue={profile.lastName} className={inputClass} />
            </Field>
            <Field label="Role" hint="Shown in the hero status bar." htmlFor="f-role">
              <input id="f-role" name="role" defaultValue={profile.role} className={inputClass} />
            </Field>
            <Field label="Tagline" hint="One line, e.g. 'Full-stack developer · AI & ML engineer'." htmlFor="f-tagline">
              <input id="f-tagline" name="tagline" defaultValue={profile.tagline} className={inputClass} />
            </Field>
          </div>
        </Card>

        <Card title="Hero & about">
          <div className="grid gap-4">
            <Field label="Intro" hint="The paragraph under your name in the hero." htmlFor="f-intro">
              <textarea id="f-intro" name="intro" rows={2} defaultValue={profile.intro} className={inputClass + " resize-y"} />
            </Field>
            <Field label="Rotating words" hint="Comma separated. Cycles after “Currently into”." htmlFor="f-roles">
              <input id="f-roles" name="roles" defaultValue={profile.roles.join(", ")} className={inputClass} />
            </Field>
            <Field label="About statement" hint="The big scroll-revealed paragraph and the About house in the World." htmlFor="f-about">
              <textarea id="f-about" name="about" rows={4} defaultValue={profile.about} className={inputClass + " resize-y"} />
            </Field>
          </div>
        </Card>

        <Card title="Availability">
          <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-end">
            <Switch name="available" defaultChecked={profile.available} label="Available for work" />
            <Field label="Status line" htmlFor="f-status">
              <input id="f-status" name="status" defaultValue={profile.status} className={inputClass} />
            </Field>
          </div>
        </Card>

        <Card title="Contact & links" description="Leave a field empty to hide it on the site.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" htmlFor="f-email">
              <input id="f-email" name="email" type="email" defaultValue={profile.email} className={inputClass} />
            </Field>
            <Field label="Phone" htmlFor="f-phone">
              <input id="f-phone" name="phone" type="tel" defaultValue={profile.phone} className={inputClass} />
            </Field>
            <Field label="Location" htmlFor="f-location">
              <input id="f-location" name="location" placeholder="City, Country" defaultValue={profile.location} className={inputClass} />
            </Field>
            <Field label="GitHub" htmlFor="f-github">
              <input id="f-github" name="github" type="url" defaultValue={profile.github} className={inputClass} />
            </Field>
            <Field label="LinkedIn" htmlFor="f-linkedin">
              <input id="f-linkedin" name="linkedin" type="url" placeholder="https://linkedin.com/in/…" defaultValue={profile.linkedin} className={inputClass} />
            </Field>
            <Field label="X / Twitter" htmlFor="f-x">
              <input id="f-x" name="x" type="url" placeholder="https://x.com/…" defaultValue={profile.x} className={inputClass} />
            </Field>
            <Field label="Personal website" htmlFor="f-website">
              <input id="f-website" name="website" type="url" defaultValue={profile.website} className={inputClass} />
            </Field>
            <Field label="Site source code" htmlFor="f-url">
              <input id="f-url" name="url" type="url" defaultValue={profile.url} className={inputClass} />
            </Field>
            <Field label="Logo URL" hint="Set by the uploader above, or paste a link." htmlFor="f-logo">
              <input id="f-logo" name="logoUrl" defaultValue={profile.logoUrl} className={inputClass} />
            </Field>
            <Field label="CV URL" hint="Set by the uploader above, or paste a link." htmlFor="f-cv">
              <input id="f-cv" name="cvUrl" defaultValue={profile.cvUrl} className={inputClass} />
            </Field>
          </div>
        </Card>

        <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-full border border-line-strong bg-surface/90 py-2 pl-5 pr-2 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.8)] backdrop-blur-xl">
          <ActionStatus state={state} />
          <SubmitButton pending={pending}>Save profile</SubmitButton>
        </div>
      </form>
    </>
  );
}
