// Field definitions shared by the dashboard editors (client) and the server actions that
// validate what they send. One definition drives both the form and the sanitiser.

import {
  accessories,
  builtinDemos,
  demoInputs,
  demoKinds,
  placeKinds,
  rewardKinds,
  watermarkCorners,
} from "./site";

export type FieldType = "text" | "textarea" | "url" | "number" | "select" | "switch" | "color" | "lines";

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  max?: number;
  min?: number;
  step?: number;
  options?: readonly string[];
  placeholder?: string;
  help?: string;
  wide?: boolean;
  rows?: number;
  /** Show an upload button next to a url field. */
  upload?: "image" | "pdf" | "media";
  /** Value for newly added items. */
  initial?: unknown;
};

export type ListSchema = { kind: "list"; fields: FieldDef[]; title: (item: Record<string, unknown>) => string; max: number; idPrefix: string };
export type ObjectSchema = { kind: "object"; fields: FieldDef[] };

const t = (key: string, label: string, extra: Partial<FieldDef> = {}): FieldDef => ({ key, label, type: "text", max: 200, ...extra });
const area = (key: string, label: string, extra: Partial<FieldDef> = {}): FieldDef => ({ key, label, type: "textarea", max: 4000, wide: true, rows: 4, ...extra });
const url = (key: string, label: string, extra: Partial<FieldDef> = {}): FieldDef => ({ key, label, type: "url", max: 600, ...extra });
const sw = (key: string, label: string, extra: Partial<FieldDef> = {}): FieldDef => ({ key, label, type: "switch", ...extra });
const num = (key: string, label: string, min: number, max: number, extra: Partial<FieldDef> = {}): FieldDef => ({ key, label, type: "number", min, max, ...extra });
const sel = (key: string, label: string, options: readonly string[], extra: Partial<FieldDef> = {}): FieldDef => ({ key, label, type: "select", options, ...extra });
const color = (key: string, label: string): FieldDef => ({ key, label, type: "color" });
const lines = (key: string, label: string, extra: Partial<FieldDef> = {}): FieldDef => ({ key, label, type: "lines", max: 40, wide: true, rows: 5, ...extra });

const s = (v: unknown) => String(v ?? "");

export const schemas = {
  experience: {
    kind: "list",
    idPrefix: "exp",
    max: 40,
    title: (i) => [s(i.role), s(i.org)].filter(Boolean).join(" · ") || "New role",
    fields: [t("role", "Role"), t("org", "Company / team"), t("place", "Place"), t("start", "Start", { placeholder: "Jan 2025" }), t("end", "End", { placeholder: "Present" }), area("body", "What you did")],
  },
  education: {
    kind: "list",
    idPrefix: "edu",
    max: 20,
    title: (i) => s(i.degree) || "New education",
    fields: [t("degree", "Degree"), t("school", "School / university"), t("start", "Start"), t("end", "End"), area("body", "Notes", { rows: 3 })],
  },
  certifications: {
    kind: "list",
    idPrefix: "cert",
    max: 60,
    title: (i) => s(i.name) || "New certification",
    fields: [t("name", "Certificate"), t("issuer", "Issued by"), t("date", "Date", { placeholder: "Mar 2026" }), t("credentialId", "Credential ID"), url("url", "Verify link or file", { upload: "pdf", wide: true })],
  },
  courses: {
    kind: "list",
    idPrefix: "course",
    max: 80,
    title: (i) => s(i.name) || "New course",
    fields: [t("name", "Course"), t("provider", "Provider"), t("date", "Date"), url("url", "Link")],
  },
  languages: {
    kind: "list",
    idPrefix: "lang",
    max: 12,
    title: (i) => s(i.name) || "New language",
    fields: [t("name", "Language"), t("level", "Level", { placeholder: "Native, fluent, B2…" })],
  },
  journey: {
    kind: "list",
    idPrefix: "m",
    max: 30,
    title: (i) => [s(i.date), s(i.title)].filter(Boolean).join(" · ") || "New milestone",
    fields: [t("date", "Date"), t("title", "Title"), area("body", "Body", { rows: 2, max: 400 })],
  },
  focus: {
    kind: "list",
    idPrefix: "f",
    max: 12,
    title: (i) => s(i.title) || "New service",
    fields: [t("title", "Title"), area("body", "Body", { rows: 2, max: 400 })],
  },
  places: {
    kind: "list",
    idPrefix: "place",
    max: 16,
    title: (i) => s(i.name) || "New place",
    fields: [
      t("name", "Name"),
      sel("kind", "Building", placeKinds, { help: "Tower: tall building with an elevator. Shop: low building with a door. Kiosk: a street stand." }),
      area("description", "What visitors read", { rows: 2, max: 600 }),
      url("url", "Opens this link", { placeholder: "https://…", help: "Visitors ride the elevator or walk through the door, then this opens." }),
      color("color", "Neon colour"),
      num("height", "Height (towers)", 8, 60, { initial: 26 }),
      sw("visible", "Show in the city"),
    ],
  },
  demos: {
    kind: "list",
    idPrefix: "demo",
    max: 24,
    title: (i) => s(i.title) || "New demo",
    fields: [
      t("title", "Title"),
      sel("kind", "Type", demoKinds, { help: "Built-in runs in the browser. API calls your own model server. Embed shows a Hugging Face Space, Gradio or Streamlit app." }),
      area("description", "Description", { rows: 2, max: 600 }),
      sel("builtin", "Built-in model", builtinDemos),
      url("endpoint", "API endpoint (POST)", { help: "The site sends {\"input\": …} as JSON and shows the response.", wide: true }),
      t("token", "API token (optional)", { help: "Sent as a Bearer token from the server only. Leave as is to keep the saved one." }),
      sel("inputType", "Input type", demoInputs),
      t("inputLabel", "Input label"),
      t("placeholder", "Example input", { wide: true, max: 600 }),
      t("outputPath", "Response field to show", { placeholder: "e.g. result.label" }),
      url("embedUrl", "Embed URL", { wide: true }),
      t("projectId", "Linked project id", { placeholder: "e.g. fuzzy-logic" }),
      sw("visible", "Visible"),
    ],
  },
  rewards: {
    kind: "list",
    idPrefix: "reward",
    max: 20,
    title: (i) => s(i.title) || "New reward",
    fields: [
      t("title", "Title"),
      area("description", "How it's described", { rows: 2, max: 400 }),
      num("xp", "XP needed", 0, 5000, { help: "0 = unlock every achievement first.", initial: 300 }),
      sel("kind", "What they get", rewardKinds, {
        help: "message: a note from you · link: a secret link · code: a code to copy · certificate: a downloadable certificate · cosmetic: gold, neon or crown for their City character",
      }),
      area("payload", "Message, link, code or cosmetic id", { rows: 2, max: 1000 }),
      sw("enabled", "Enabled"),
    ],
  },
  copy: {
    kind: "object",
    fields: [
      t("heroKicker", "Hero label"),
      t("heroPrimaryCta", "Main button"),
      t("heroCityCta", "City button"),
      sw("introEnabled", "Opening animation", { help: "The code-rain intro visitors see in the first second." }),
      t("introLine", "Intro terminal line"),
      sw("rainEnabled", "Code rain background"),
      t("footerHeadline", "Footer headline", { help: "Wrap words in *asterisks* to colour them.", wide: true }),
      t("footerNote", "Footer note", { wide: true }),
      area("contactNote", "Extra contact note", { rows: 2, max: 400 }),
    ],
  },
  card: {
    kind: "object",
    fields: [
      sw("enabled", "Business card is live", { help: "Off: nobody can see it. On: it appears at /card and as a button on the site." }),
      sw("showInNav", "Show a Card button in the navigation"),
      t("name", "Name"),
      t("title", "Title"),
      t("company", "Company"),
      t("email", "Email"),
      t("phone", "Phone"),
      url("website", "Website"),
      t("location", "Location"),
      t("note", "Line on the back", { wide: true }),
      color("accent", "Accent colour"),
    ],
  },
  guide: {
    kind: "object",
    fields: [
      sw("enabled", "Guide stands in the plaza"),
      t("name", "Guide name"),
      color("shirt", "Shirt"),
      color("pants", "Trousers"),
      color("hair", "Hair"),
      color("skin", "Skin"),
      sel("accessory", "Accessory", accessories),
      lines("intro", "Welcome dialogue", { help: "One line per step. Shown the first time someone enters the city.", rows: 7 }),
      lines("idle", "When they talk to you again", { rows: 3 }),
    ],
  },
  citySettings: {
    kind: "object",
    fields: [
      sw("traffic", "Cars on the roads"),
      num("citizens", "Citizens walking around", 0, 24),
      sw("startAtNight", "Start at night"),
      lines("citizenLines", "Things citizens say", { rows: 6 }),
      lines("billboards", "Extra billboard slogans", { rows: 3, help: "Shown on rooftop billboards next to your skills." }),
    ],
  },
  branding: {
    kind: "object",
    fields: [
      sw("intro", "Logo card at the start"),
      sw("outro", "Logo card at the end"),
      sw("watermark", "Logo watermark in the corner"),
      sel("corner", "Watermark corner", watermarkCorners),
      num("opacity", "Watermark opacity %", 10, 100),
      num("cardSeconds", "Logo card length (seconds)", 1, 6, { step: 0.5 }),
    ],
  },
  resumeMeta: {
    kind: "object",
    fields: [area("summary", "Summary", { rows: 4, max: 1200 }), lines("interests", "Interests", { rows: 3 })],
  },
} satisfies Record<string, ListSchema | ObjectSchema>;

export type SchemaName = keyof typeof schemas;

function sanitizeField(def: FieldDef, value: unknown): unknown {
  switch (def.type) {
    case "switch":
      return value === true || value === "true" || value === "on";
    case "number": {
      const n = Number(value);
      const min = def.min ?? 0;
      const max = def.max ?? 100000;
      return Math.min(max, Math.max(min, Number.isFinite(n) ? n : min));
    }
    case "select": {
      const v = String(value ?? "");
      return def.options?.includes(v) ? v : (def.options?.[0] ?? "");
    }
    case "color": {
      const v = String(value ?? "");
      return /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : "#5fd6c0";
    }
    case "url":
      return safeUrl(String(value ?? "").trim().slice(0, def.max ?? 600));
    case "lines": {
      const arr = Array.isArray(value) ? value : String(value ?? "").split("\n");
      return arr
        .map((x) => String(x).trim().slice(0, 600))
        .filter(Boolean)
        .slice(0, def.max ?? 40);
    }
    default:
      return String(value ?? "")
        .replace(/\r\n/g, "\n")
        .trim()
        .slice(0, def.max ?? 200);
  }
}

export function safeUrl(value: string) {
  if (!value) return "";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:" || u.protocol === "mailto:" || u.protocol === "tel:" ? u.toString() : "";
  } catch {
    return "";
  }
}

export function sanitizeObject(fields: FieldDef[], raw: unknown): Record<string, unknown> {
  const src = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const f of fields) out[f.key] = sanitizeField(f, src[f.key]);
  return out;
}

export function sanitizeList(schema: ListSchema, raw: unknown, makeId: () => string): Record<string, unknown>[] {
  const arr = Array.isArray(raw) ? raw.slice(0, schema.max) : [];
  const seen = new Set<string>();
  return arr.map((item) => {
    const clean = sanitizeObject(schema.fields, item);
    let id = String((item as Record<string, unknown>)?.id ?? "").replace(/[^\w-]/g, "").slice(0, 40);
    if (!id || seen.has(id)) id = `${schema.idPrefix}-${makeId()}`;
    seen.add(id);
    return { id, ...clean };
  });
}

export function blankFor(fields: FieldDef[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.initial !== undefined) out[f.key] = f.initial;
    else if (f.type === "switch") out[f.key] = true;
    else if (f.type === "number") out[f.key] = f.min ?? 0;
    else if (f.type === "select") out[f.key] = f.options?.[0] ?? "";
    else if (f.type === "color") out[f.key] = "#5fd6c0";
    else if (f.type === "lines") out[f.key] = [];
    else out[f.key] = "";
  }
  return out;
}
