"use client";

import { useActionState, useId, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowUp, CaretDown, Plus, Trash } from "@phosphor-icons/react/dist/ssr";
import { saveList, saveObject, type ActionResult } from "@/app/dashboard/actions";
import { blankFor, schemas, type FieldDef, type ListSchema } from "@/lib/schemas";
import { cn, easeOut } from "@/lib/utils";
import { ActionStatus, Field, inputClass, SubmitButton, Switch } from "./ui";
import { UploadButton } from "./upload";

type Item = Record<string, unknown>;

export function FieldInput({ def, value, onChange }: { def: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const id = useId();
  if (def.type === "switch") {
    return (
      <div className={cn("flex flex-col justify-end gap-1.5", def.wide && "sm:col-span-2")}>
        <Switch label={def.label} checked={Boolean(value)} onChange={onChange} />
        {def.help ? <p className="text-xs text-muted">{def.help}</p> : null}
      </div>
    );
  }
  let control: React.ReactNode;
  switch (def.type) {
    case "textarea":
      control = <textarea id={id} rows={def.rows ?? 4} maxLength={def.max} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder={def.placeholder} className={cn(inputClass, "resize-y leading-relaxed")} />;
      break;
    case "lines":
      control = (
        <textarea
          id={id}
          rows={def.rows ?? 5}
          value={Array.isArray(value) ? value.join("\n") : String(value ?? "")}
          onChange={(e) => onChange(e.target.value.split("\n"))}
          placeholder={def.placeholder ?? "One per line"}
          className={cn(inputClass, "resize-y leading-relaxed")}
        />
      );
      break;
    case "number":
      control = (
        <input
          id={id}
          type="number"
          min={def.min}
          max={def.max}
          step={def.step ?? 1}
          value={Number(value ?? 0)}
          onChange={(e) => onChange(e.target.valueAsNumber)}
          className={cn(inputClass, "tabular-nums")}
        />
      );
      break;
    case "select":
      control = (
        <select id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={inputClass}>
          {def.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
      break;
    case "color":
      control = (
        <span className="flex items-center gap-2">
          <input id={id} type="color" value={String(value || "#5fd6c0")} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border border-line-strong bg-bg p-1" />
          <input aria-label={`${def.label} hex`} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={cn(inputClass, "font-mono")} />
        </span>
      );
      break;
    case "url":
      control = (
        <span className="flex items-start gap-2">
          <input id={id} type="text" inputMode="url" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder={def.placeholder ?? "https://"} className={inputClass} />
          {def.upload ? <UploadButton kind={def.upload} onUploaded={(url) => onChange(url)} /> : null}
        </span>
      );
      break;
    default:
      control = <input id={id} type="text" maxLength={def.max} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder={def.placeholder} className={inputClass} />;
  }
  return (
    <Field label={def.label} hint={def.help} htmlFor={id} className={cn(def.wide && "sm:col-span-2")}>
      {control}
    </Field>
  );
}

export function FieldGrid({ fields, value, onChange, hide = [] }: { fields: FieldDef[]; value: Item; onChange: (v: Item) => void; hide?: string[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields
        .filter((f) => !hide.includes(f.key))
        .map((f) => (
          <FieldInput key={f.key} def={f} value={value[f.key]} onChange={(v) => onChange({ ...value, [f.key]: v })} />
        ))}
    </div>
  );
}

type ListTarget = Parameters<typeof saveList>[0];
type ObjectTarget = Parameters<typeof saveObject>[0];

/** Hide fields that don't apply to the current item (e.g. API settings on a built-in demo). */
function hiddenFor(target: ListTarget, item: Item): string[] {
  if (target === "demos") {
    if (item.kind === "builtin") return ["endpoint", "token", "outputPath", "embedUrl", "inputType", "placeholder", "inputLabel"];
    if (item.kind === "api") return ["builtin", "embedUrl"];
    return ["builtin", "endpoint", "token", "outputPath", "inputType", "inputLabel", "placeholder"];
  }
  if (target === "places" && item.kind !== "tower") return ["height"];
  return [];
}

export function ListEditor({ target, initial, addLabel = "Add", emptyText }: { target: ListTarget; initial: Item[]; addLabel?: string; emptyText?: string }) {
  const schema = schemas[target] as ListSchema;
  const action = useMemo(() => saveList.bind(null, target), [target]);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);
  const [items, setItems] = useState<Item[]>(initial);
  const [open, setOpen] = useState<number | null>(initial.length ? null : null);
  const [dirty, setDirty] = useState(false);

  const update = (next: Item[]) => {
    setItems(next);
    setDirty(true);
  };
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    update(next);
    setOpen(open === i ? j : open === j ? i : open);
  };

  return (
    <form
      action={(fd) => {
        setDirty(false);
        return formAction(fd);
      }}
      className="grid gap-3"
    >
      <input type="hidden" name="json" value={JSON.stringify(items)} />
      {items.length === 0 ? <p className="rounded-2xl border border-dashed border-line-strong px-5 py-8 text-center text-sm text-muted">{emptyText ?? "Nothing here yet."}</p> : null}
      <ul className="grid gap-2">
        {items.map((item, i) => {
          const expanded = open === i;
          return (
            <li key={String(item.id ?? i)} className="overflow-hidden rounded-2xl border border-line bg-bg/40">
              <div className="flex items-center gap-1 pl-4 pr-1.5">
                <button type="button" onClick={() => setOpen(expanded ? null : i)} aria-expanded={expanded} className="flex min-w-0 flex-1 items-center gap-2.5 py-3 text-left">
                  <CaretDown size={14} className={cn("shrink-0 text-muted transition-transform duration-200", expanded && "rotate-180")} />
                  <span className="truncate text-sm font-medium">{schema.title(item)}</span>
                  {item.visible === false || item.enabled === false ? <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted">hidden</span> : null}
                </button>
                <button type="button" aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0} className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-30">
                  <ArrowUp size={14} />
                </button>
                <button type="button" aria-label="Move down" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-30">
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  aria-label="Remove"
                  onClick={() => {
                    update(items.filter((_, k) => k !== i));
                    setOpen(null);
                  }}
                  className="grid size-9 place-items-center rounded-full text-muted hover:bg-ember/15 hover:text-ember"
                >
                  <Trash size={14} />
                </button>
              </div>
              <AnimatePresence initial={false}>
                {expanded ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={{ duration: 0.2, ease: easeOut }} className="border-t border-line p-4">
                    <FieldGrid fields={schema.fields} value={item} hide={hiddenFor(target, item)} onChange={(v) => update(items.map((x, k) => (k === i ? v : x)))} />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
      <div className="sticky bottom-3 z-10 mt-2 flex flex-wrap items-center gap-3 rounded-full border border-line bg-surface/90 py-2 pl-2 pr-4 backdrop-blur">
        <button
          type="button"
          disabled={items.length >= schema.max}
          onClick={() => {
            update([...items, { id: "", ...blankFor(schema.fields) }]);
            setOpen(items.length);
          }}
          className="press inline-flex h-10 items-center gap-2 rounded-full border border-line-strong px-4 text-sm hover:border-fg/30 disabled:opacity-40"
        >
          <Plus size={15} />
          {addLabel}
        </button>
        <SubmitButton pending={pending}>Save changes</SubmitButton>
        {dirty ? <span className="text-xs text-muted">Unsaved changes</span> : <ActionStatus state={state} />}
      </div>
    </form>
  );
}

export function ObjectEditor({ target, initial, submitLabel = "Save changes", children }: { target: ObjectTarget; initial: Item; submitLabel?: string; children?: (value: Item) => React.ReactNode }) {
  const fields = schemas[target].fields;
  const action = useMemo(() => saveObject.bind(null, target), [target]);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);
  const [value, setValue] = useState<Item>(initial);
  return (
    <form action={formAction} className="grid gap-5">
      <input type="hidden" name="json" value={JSON.stringify(value)} />
      <FieldGrid fields={fields} value={value} onChange={setValue} />
      {children?.(value)}
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
        <ActionStatus state={state} />
      </div>
    </form>
  );
}
