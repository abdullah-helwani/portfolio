"use client";
/* eslint-disable react-hooks/immutability -- `runtime` is the game loop's mutable state (like a ref): input, camera and player data are written from events and read every frame without re-rendering. */

import { useRef } from "react";
import { motion } from "motion/react";
import { NavigationArrow, X } from "@phosphor-icons/react/dist/ssr";
import { cn, easeOut } from "@/lib/utils";
import { BLOCK, districtInfo, HALF_MAP, ROAD_LINES, type CityPlan, type District } from "./layout";
import type { Runtime } from "./runtime";

const blockFill: Record<District, string> = {
  plaza: "#1d3b37",
  about: "#3b2a22",
  academy: "#2a2f4a",
  park: "#1d3a26",
  news: "#3a3220",
  arcade: "#3a2238",
  post: "#1f3248",
  projects: "#16302d",
  downtown: "#1a2023",
};

export type Marker = { id: string; x: number; z: number; color: string; label: string; done: boolean };

function MapSvg({ plan, markers, player, heading, big, onTravel }: { plan: CityPlan; markers: Marker[]; player: { x: number; z: number }; heading: number; big?: boolean; onTravel?: (m: Marker) => void }) {
  const S = HALF_MAP + 6;
  return (
    <svg viewBox={`${-S} ${-S} ${S * 2} ${S * 2}`} className="h-full w-full" role="img" aria-label="City map">
      <rect x={-S} y={-S} width={S * 2} height={S * 2} fill="#0b0f11" />
      {ROAD_LINES.map((l) => (
        <g key={l}>
          <rect x={-S} y={l - 5} width={S * 2} height={10} fill="#151b1e" />
          <rect x={l - 5} y={-S} width={10} height={S * 2} fill="#151b1e" />
        </g>
      ))}
      {plan.blocks.map((b) => (
        <rect key={`${b.x},${b.z}`} x={b.x - BLOCK / 2} y={b.z - BLOCK / 2} width={BLOCK} height={BLOCK} rx={3} fill={blockFill[b.district]} />
      ))}
      {big
        ? plan.blocks
            .filter((b) => b.district !== "downtown")
            .map((b) => (
              <text key={`t${b.x},${b.z}`} x={b.x} y={b.z + BLOCK / 2 - 3} textAnchor="middle" fontSize={3.4} fill="#8b9794" fontFamily="var(--font-geist-mono)">
                {b.district === "projects" ? "PROJECTS" : districtInfo[b.district].name.toUpperCase()}
              </text>
            ))
        : null}
      {markers.map((m) => (
        <g key={m.id} onClick={onTravel ? () => onTravel(m) : undefined} className={onTravel ? "cursor-pointer" : undefined}>
          <circle cx={m.x} cy={m.z} r={big ? 3.4 : 4.2} fill={m.done ? "#0b0f11" : m.color} stroke={m.color} strokeWidth={1.4} />
          {big ? (
            <text x={m.x} y={m.z - 5.5} textAnchor="middle" fontSize={3.6} fill="#e8eeec" fontFamily="var(--font-geist-sans)">
              {m.label}
            </text>
          ) : null}
        </g>
      ))}
      <g transform={`translate(${player.x} ${player.z}) rotate(${(-heading * 180) / Math.PI + 180})`}>
        <circle r={big ? 9 : 11} fill="rgba(95,214,192,0.15)" />
        <path d="M0,-6 L4.6,5 L0,2.6 L-4.6,5 Z" fill="#e8eeec" stroke="#0b0f11" strokeWidth={1} />
      </g>
    </svg>
  );
}

export function Minimap({ plan, markers, player, heading, onOpen }: { plan: CityPlan; markers: Marker[]; player: { x: number; z: number }; heading: number; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Open the city map"
      className="group relative size-[112px] overflow-hidden rounded-3xl border border-white/10 bg-[#0b0f11]/80 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.9)] backdrop-blur-md sm:size-[150px] md:size-[180px]"
    >
      <div className="absolute inset-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105">
        <MapSvg plan={plan} markers={markers} player={player} heading={heading} />
      </div>
      <span className="absolute left-2.5 top-2.5 rounded-full bg-[#0b0f11]/80 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted">Map · M</span>
      <span className="absolute right-2.5 top-2.5 grid size-6 place-items-center rounded-full bg-[#0b0f11]/80 text-[10px] font-semibold text-muted">N</span>
    </button>
  );
}

export function FullMap({ plan, markers, player, heading, onClose, onTravel }: { plan: CityPlan; markers: Marker[]; player: { x: number; z: number }; heading: number; onClose: () => void; onTravel: (m: Marker) => void }) {
  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-center justify-center bg-[#05080a]/75 p-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="City map"
        initial={{ opacity: 0, transform: "scale(0.96)" }}
        animate={{ opacity: 1, transform: "scale(1)" }}
        transition={{ duration: 0.35, ease: easeOut }}
        className="grid w-full max-w-[980px] gap-4 rounded-[2rem] border border-white/10 bg-[#0d1113]/95 p-4 md:grid-cols-[1fr_260px] md:p-6"
      >
        <div className="aspect-square w-full overflow-hidden rounded-2xl border border-line">
          <MapSvg plan={plan} markers={markers} player={player} heading={heading} big onTravel={onTravel} />
        </div>
        <div className="flex flex-col">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">City map</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">Fast travel</h2>
            </div>
            <button type="button" onClick={onClose} aria-label="Close map" className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg">
              <X size={18} />
            </button>
          </div>
          <p className="mt-2 text-sm text-muted">Click a destination to jump straight there.</p>
          <ul className="mt-4 grid max-h-[46vh] gap-1 overflow-y-auto pr-1">
            {markers.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => onTravel(m)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2"
                >
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: m.color, opacity: m.done ? 0.35 : 1 }} />
                  <span className={cn("flex-1 truncate", m.done && "text-muted line-through")}>{m.label}</span>
                  <NavigationArrow size={14} className="text-muted" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Joystick({ runtime }: { runtime: Runtime }) {
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const R = 46;
  const move = (e: React.PointerEvent) => {
    const el = base.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy);
    if (d > R) {
      dx = (dx / d) * R;
      dy = (dy / d) * R;
    }
    runtime.joy.x = dx / R;
    runtime.joy.y = dy / R;
    runtime.sprint = d > R * 0.95;
    if (knob.current) knob.current.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  const end = () => {
    runtime.joy.x = 0;
    runtime.joy.y = 0;
    runtime.sprint = false;
    if (knob.current) knob.current.style.transform = "translate(0px, 0px)";
  };
  return (
    <div
      ref={base}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        e.stopPropagation();
        move(e);
      }}
      onPointerMove={(e) => e.buttons && move(e)}
      onPointerUp={end}
      onPointerCancel={end}
      className="relative grid size-[128px] touch-none place-items-center rounded-full border border-white/15 bg-[#0b0f11]/55 backdrop-blur-md"
      aria-label="Movement joystick"
      role="application"
    >
      <div ref={knob} className="size-14 rounded-full border border-white/20 bg-white/15 shadow-[0_8px_24px_-8px_rgb(0_0_0/0.8)] transition-transform duration-75" />
    </div>
  );
}
