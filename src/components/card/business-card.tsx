"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowsClockwise, DownloadSimple, EnvelopeSimple, Globe, MapPin, Phone } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/layout/nav";
import type { BusinessCard } from "@/lib/site";
import { QrCode } from "./qr";

export function vcard(card: BusinessCard) {
  const [first, ...rest] = card.name.split(" ");
  const esc = (v: string) => v.replace(/[\;,]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${esc(rest.join(" "))};${esc(first ?? "")};;;`,
    `FN:${esc(card.name)}`,
    card.title ? `TITLE:${esc(card.title)}` : "",
    card.company ? `ORG:${esc(card.company)}` : "",
    card.email ? `EMAIL;TYPE=INTERNET:${card.email}` : "",
    card.phone ? `TEL;TYPE=CELL:${card.phone}` : "",
    card.website ? `URL:${card.website}` : "",
    card.location ? `ADR;TYPE=WORK:;;${esc(card.location)};;;;` : "",
    card.note ? `NOTE:${esc(card.note)}` : "",
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function BusinessCardView({ card, logoUrl, siteUrl }: { card: BusinessCard; logoUrl: string; siteUrl: string }) {
  const [flipped, setFlipped] = useState(false);
  const reduce = useReducedMotion();
  const qrTarget = card.website || siteUrl;
  const rows = [
    { icon: EnvelopeSimple, value: card.email, href: card.email ? `mailto:${card.email}` : "" },
    { icon: Phone, value: card.phone, href: card.phone ? `tel:${card.phone.replace(/\s/g, "")}` : "" },
    { icon: Globe, value: card.website.replace(/^https?:\/\//, "").replace(/\/$/, ""), href: card.website },
    { icon: MapPin, value: card.location, href: "" },
  ].filter((r) => r.value);

  const download = () => {
    const blob = new Blob([vcard(card)], { type: "text/vcard" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${card.name.replace(/\s+/g, "-").toLowerCase() || "contact"}.vcf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const face = "absolute inset-0 overflow-hidden rounded-[1.6rem] border border-white/10 [backface-visibility:hidden]";

  return (
    <div className="grid justify-items-center gap-5">
      <div className="w-full max-w-[520px] [perspective:1400px]">
        <motion.div
          className="relative aspect-[1.75/1] w-full [transform-style:preserve-3d]"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 18 }}
        >
          {/* front */}
          <div className={face} style={{ background: `radial-gradient(120% 140% at 0% 0%, ${card.accent}33, transparent 55%), linear-gradient(160deg, #141a1c, #0b0f10)` }}>
            <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:28px_28px]" />
            <div className="relative flex h-full flex-col justify-between p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <Logo name={card.name} logoUrl={logoUrl} className="size-11 text-[20px]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">{card.company || "Portfolio"}</span>
              </div>
              <div>
                <p className="text-[clamp(1.5rem,5vw,2.25rem)] font-semibold leading-none tracking-[-0.035em] text-white">{card.name}</p>
                <p className="mt-2 text-sm" style={{ color: card.accent }}>
                  {card.title}
                </p>
                <ul className="mt-4 grid gap-1.5 text-[13px] text-white/75 sm:grid-cols-2">
                  {rows.map(({ icon: Icon, value, href }) => (
                    <li key={value} className="flex min-w-0 items-center gap-2">
                      <Icon size={14} className="shrink-0 text-white/45" />
                      {href ? (
                        <a href={href} className="truncate hover:text-white" target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                          {value}
                        </a>
                      ) : (
                        <span className="truncate">{value}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          {/* back */}
          <div className={`${face} [transform:rotateY(180deg)]`} style={{ background: "linear-gradient(160deg, #0f1415, #090c0d)" }}>
            <div className="flex h-full items-center gap-6 p-6 sm:p-8">
              <div className="shrink-0 rounded-2xl bg-[#e8eeec] p-2.5">
                <QrCode value={qrTarget} className="size-24 text-[#090b0c] sm:size-32" />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/45">Scan to open</p>
                <p className="mt-2 text-lg font-medium leading-snug tracking-tight text-white">{card.note}</p>
                <p className="mt-3 truncate font-mono text-xs" style={{ color: card.accent }}>
                  {qrTarget.replace(/^https?:\/\//, "")}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" onClick={() => setFlipped((f) => !f)} className="press inline-flex h-11 items-center gap-2 rounded-full border border-line-strong px-5 text-sm hover:border-fg/30">
          <ArrowsClockwise size={16} /> Flip card
        </button>
        <button type="button" onClick={download} className="press inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-ink">
          <DownloadSimple size={16} weight="bold" /> Save contact
        </button>
      </div>
    </div>
  );
}
