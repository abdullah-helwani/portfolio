"use client";

import { BusinessCardView } from "@/components/card/business-card";
import type { BusinessCard } from "@/lib/site";
import { ObjectEditor } from "./schema-editor";

export function CardEditor({ card, logoUrl, siteUrl }: { card: BusinessCard; logoUrl: string; siteUrl: string }) {
  return (
    <ObjectEditor target="card" initial={card} submitLabel="Save card">
      {(value) => (
        <div className="rounded-3xl border border-line bg-bg p-5 md:p-8">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Live preview</p>
          <BusinessCardView card={value as BusinessCard} logoUrl={logoUrl} siteUrl={siteUrl} />
        </div>
      )}
    </ObjectEditor>
  );
}
