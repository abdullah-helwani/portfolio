"use client";

import { useState } from "react";
import { ArrowSquareOut, ArrowsClockwise, DeviceMobile, Desktop, LockSimple } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/** The live project in a browser frame, with desktop/mobile widths. */
export function SitePreview({ url, title }: { url: string; title: string }) {
  const [mobile, setMobile] = useState(false);
  const [key, setKey] = useState(0);
  const [load, setLoad] = useState(false);
  const host = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-line-strong bg-[#0b0f10]">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-[#f0773f]/80" />
          <span className="size-2.5 rounded-full bg-[#f6c177]/80" />
          <span className="size-2.5 rounded-full bg-[#5fd6c0]/80" />
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-surface-2 px-3 py-1.5 font-mono text-[12px] text-muted">
          <LockSimple size={12} className="shrink-0 text-accent" />
          <span className="truncate">{host}</span>
        </span>
        <button type="button" aria-label="Desktop width" onClick={() => setMobile(false)} className={cn("hidden size-8 place-items-center rounded-full sm:grid", !mobile ? "bg-surface-2 text-fg" : "text-muted")}>
          <Desktop size={15} />
        </button>
        <button type="button" aria-label="Phone width" onClick={() => setMobile(true)} className={cn("hidden size-8 place-items-center rounded-full sm:grid", mobile ? "bg-surface-2 text-fg" : "text-muted")}>
          <DeviceMobile size={15} />
        </button>
        <button type="button" aria-label="Reload preview" onClick={() => setKey((k) => k + 1)} className="grid size-8 place-items-center rounded-full text-muted hover:text-fg">
          <ArrowsClockwise size={15} />
        </button>
        <a href={url} target="_blank" rel="noreferrer" aria-label="Open the site" className="grid size-8 place-items-center rounded-full text-muted hover:text-fg">
          <ArrowSquareOut size={15} />
        </a>
      </div>
      <div className="relative grid h-[min(72vh,720px)] place-items-center bg-[repeating-linear-gradient(45deg,#0d1112,#0d1112_10px,#0f1415_10px,#0f1415_20px)]">
        {load ? (
          <iframe
            key={key}
            src={url}
            title={`${title} live preview`}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            className={cn("h-full bg-white transition-[width] duration-300", mobile ? "w-[390px] max-w-full rounded-xl border border-line" : "w-full")}
          />
        ) : (
          <button type="button" onClick={() => setLoad(true)} className="press inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-accent-ink">
            Load the live site here
          </button>
        )}
      </div>
      <p className="border-t border-line px-4 py-2.5 text-xs text-muted">Blank preview? Some sites don&apos;t allow being shown inside other pages. Use the open button to visit it directly.</p>
    </div>
  );
}
