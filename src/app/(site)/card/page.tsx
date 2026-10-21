import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { BusinessCardView } from "@/components/card/business-card";
import { getContent } from "@/lib/store";

export const metadata: Metadata = { title: "Business card", robots: { index: false } };

export default async function CardPage() {
  const { card, profile } = await getContent();
  if (!card.enabled) notFound();
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const siteUrl = host ? `${host.startsWith("localhost") ? "http" : "https"}://${host}` : profile.url;
  return (
    <main className="grid min-h-[100dvh] place-items-center px-5 pb-16 pt-32">
      <div className="w-full max-w-[560px]">
        <p className="mb-6 text-center font-mono text-xs uppercase tracking-[0.2em] text-muted">
          <span className="text-accent">Card</span> / Tap flip for the QR code
        </p>
        <BusinessCardView card={card} logoUrl={profile.logoUrl} siteUrl={siteUrl} />
      </div>
    </main>
  );
}
