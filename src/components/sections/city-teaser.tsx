"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, GameController } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/animations/reveal";
import { MapSvg } from "@/components/city/hud";
import { buildCity, cityMarkers, districtInfo } from "@/components/city/layout";
import type { Content } from "@/lib/site";
import { SectionHeader, type SectionProps } from "./section-header";

export function CityTeaser({ content, section, index }: { content: Content } & SectionProps) {
  const plan = useMemo(() => buildCity(content), [content]);
  const markers = useMemo(() => cityMarkers(plan, new Set()), [plan]);
  const districts = Array.from(new Set(plan.blocks.map((b) => b.district))).filter((d) => d !== "downtown");

  return (
    <section id="city" className="mx-auto max-w-[1400px] px-5 py-28 md:px-10 md:py-36">
      <SectionHeader section={section} index={index} />
      <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
        <Reveal className="lg:col-span-7">
          <Link href="/world" aria-label="Enter the City" className="group relative block overflow-hidden rounded-[2rem] border border-line-strong bg-[#0b0f11]">
            <div className="aspect-square transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]">
              <MapSvg plan={plan} markers={markers} player={{ x: 0, z: 9 }} heading={Math.PI} big />
            </div>
            <span className="absolute bottom-5 left-5 inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-ink shadow-[0_20px_40px_-20px_rgb(0_0_0/0.8)]">
              <GameController size={16} weight="fill" /> Enter the City
            </span>
          </Link>
        </Reveal>
        <div className="grid gap-3 lg:col-span-5">
          {districts.map((d, i) => (
            <Reveal key={d} delay={i * 0.04} className="flex items-start gap-4 rounded-2xl border border-line bg-surface/50 p-4 backdrop-blur">
              <span className="mt-1 size-3 shrink-0 rounded-full" style={{ background: districtInfo[d].color }} />
              <div>
                <p className="font-medium tracking-tight">{districtInfo[d].name}</p>
                <p className="text-sm text-muted">{districtInfo[d].hint}</p>
              </div>
            </Reveal>
          ))}
          <Link href="/world" className="group mt-2 inline-flex items-center gap-2 text-sm text-muted hover:text-fg">
            Make a character and meet {content.city.guide.name || content.profile.firstName} in the plaza
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
