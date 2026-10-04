import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Box } from "./box";

type Key = { label: string; w?: number; codes?: string[]; hint?: boolean };

const U = 28; // key unit in px
const GAP = 4;

const rows: Key[][] = [
  [
    { label: "esc", codes: ["Escape"], hint: true },
    ..."1234567890".split("").map((c) => ({ label: c, codes: [`Digit${c}`] })),
    { label: "-" },
    { label: "=" },
    { label: "del", w: 2, codes: ["Backspace"] },
  ],
  [
    { label: "tab", w: 1.5, codes: ["Tab"] },
    ..."QWERTYUIOP".split("").map((c) => ({ label: c, codes: [`Key${c}`], hint: c === "W" || c === "P" })),
    { label: "[" },
    { label: "]" },
    { label: "\\", w: 1.5 },
  ],
  [
    { label: "caps", w: 1.75 },
    ..."ASDFGHJKL".split("").map((c) => ({ label: c, codes: [`Key${c}`], hint: c === "A" || c === "S" || c === "D" })),
    { label: ";" },
    { label: "'" },
    { label: "enter", w: 2.25, codes: ["Enter", "NumpadEnter"], hint: true },
  ],
  [
    { label: "shift", w: 2.25, codes: ["ShiftLeft"] },
    ..."ZXCVBNM,.".split("").map((c) => ({ label: c, codes: /[A-Z]/.test(c) ? [`Key${c}`] : [] })),
    { label: "shift", w: 1.75, codes: ["ShiftRight"] },
    { label: "↑", codes: ["ArrowUp"], hint: true },
    { label: "fn" },
  ],
  [
    { label: "ctrl", w: 1.25 },
    { label: "alt", w: 1.25 },
    { label: "", w: 7, codes: ["Space"], hint: true },
    { label: "alt", w: 1.25 },
    { label: "ctrl", w: 1.25 },
    { label: "←", codes: ["ArrowLeft"], hint: true },
    { label: "↓", codes: ["ArrowDown"], hint: true },
    { label: "→", codes: ["ArrowRight"], hint: true },
  ],
];

function Keyboard({ pressed }: { pressed: Set<string> }) {
  return (
    <div className="flex h-full w-full flex-col justify-center gap-1 rounded-[10px] bg-[#161c1f] p-[10px] shadow-[inset_0_2px_6px_rgb(0_0_0/0.6)]">
      {rows.map((row, r) => (
        <div key={r} className="flex" style={{ gap: GAP }}>
          {row.map((key, k) => {
            const units = key.w ?? 1;
            const down = key.codes?.some((c) => pressed.has(c)) ?? false;
            return (
              <span
                key={k}
                className={cn(
                  "grid shrink-0 place-items-center rounded-[5px] font-mono text-[9px] uppercase leading-none transition-[transform,background-color,box-shadow,color] duration-100",
                  down
                    ? "translate-y-[2px] bg-accent text-accent-ink shadow-[0_0_14px_2px_rgb(95_214_192/0.55)]"
                    : "bg-[#2b3438] text-fg/55 shadow-[0_3px_0_#0d1113]",
                  !down && key.hint && "text-accent",
                )}
                style={{ width: units * U + (units - 1) * GAP, height: U }}
              >
                {key.label}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function RetroPC({
  screen,
  pressed,
  power = true,
  mouseDown = false,
}: {
  screen: ReactNode;
  pressed: Set<string>;
  power?: boolean;
  mouseDown?: boolean;
}) {
  return (
    <div className="relative [transform-style:preserve-3d]">
      {/* desk shadow */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-[700px] w-[1100px] [backface-visibility:hidden]"
        style={{
          marginLeft: -550,
          marginTop: -350,
          transform: "translate3d(0, 203px, 90px) rotateX(90deg)",
          background:
            "radial-gradient(closest-side, rgb(95 214 192 / 0.10), transparent 70%), radial-gradient(50% 40% at 50% 45%, rgb(0 0 0 / 0.75), transparent 75%)",
        }}
      />

      {/* monitor tube (rear) */}
      <Box w={420} h={310} d={150} at={[0, -78, -112]} />

      {/* monitor shell */}
      <Box
        w={570}
        h={430}
        d={74}
        at={[0, -82, 0]}
        faces={{ front: "bg-[#1f272a] rounded-[18px]" }}
        front={
          <div className="flex h-full w-full flex-col rounded-[18px] border border-white/5 bg-gradient-to-b from-[#273034] to-[#1a2124] p-[30px] pb-0 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]">
            <div className="relative h-[330px] w-full overflow-hidden rounded-[22px/28px] bg-[#020a08] shadow-[inset_0_0_0_6px_#0d1214,inset_0_0_30px_8px_rgb(0_0_0/0.9)]">
              {screen}
              {/* CRT glass */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-50 mix-blend-multiply [background:repeating-linear-gradient(to_bottom,transparent_0px,transparent_2px,rgb(0_0_0/0.45)_3px)]"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 [background:radial-gradient(120%_100%_at_50%_50%,transparent_55%,rgb(0_0_0/0.75)_100%)]"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 [background:linear-gradient(140deg,rgb(255_255_255/0.10)_0%,transparent_32%)]"
              />
            </div>
            <div className="flex flex-1 items-center justify-between px-2">
              <span className="font-mono text-[11px] tracking-[0.3em] text-fg/40">AH-86</span>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span key={i} className="h-3 w-[3px] rounded-full bg-black/40" />
                ))}
              </div>
              <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-fg/30">
                pwr
                <span
                  className={cn(
                    "size-2 rounded-full transition-[background-color,box-shadow] duration-500",
                    power ? "bg-accent shadow-[0_0_10px_2px_rgb(95_214_192/0.7)]" : "bg-[#0d1113]",
                  )}
                />
              </span>
            </div>
          </div>
        }
      />

      {/* stand */}
      <Box w={130} h={52} d={92} at={[0, 159, -22]} />
      <Box w={330} h={18} d={240} at={[0, 194, -16]} faces={{ top: "bg-[#2d373b]" }} />

      {/* keyboard */}
      <Box
        w={540}
        h={22}
        d={196}
        at={[-10, 192, 232]}
        faces={{ top: "bg-[#262f33] rounded-[12px]", front: "bg-[#1a2124]" }}
        top={<Keyboard pressed={pressed} />}
      />

      {/* mouse */}
      <Box
        w={58}
        h={18}
        d={92}
        at={[318, 194, 240]}
        faces={{ top: cn("rounded-[24px_24px_18px_18px]", mouseDown ? "bg-accent/80" : "bg-[#2f393d]") }}
        top={<div className="mx-auto mt-3 h-6 w-px bg-black/50" />}
      />
    </div>
  );
}
