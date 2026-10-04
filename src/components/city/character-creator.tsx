"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { motion } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { Group } from "three";
import { cn, easeOut } from "@/lib/utils";
import { Avatar, type AvatarLook } from "./avatar";

export type Character = { name: string; color: string; accessory: "cap" | "headphones" | "none"; hair?: string };

const CHAR_KEY = "ah-world-char";
export const hoodieColors = ["#5fd6c0", "#f0773f", "#a9b8ff", "#f6c177", "#e58fb6", "#e8eeec"];
const hairColors = ["#2a1d17", "#101314", "#5a3a22", "#c9a26b"];

export function loadCharacter(): Character | null {
  try {
    const raw = window.localStorage.getItem(CHAR_KEY);
    return raw ? (JSON.parse(raw) as Character) : null;
  } catch {
    return null;
  }
}

export function lookFor(c: Character | null): AvatarLook {
  return { shirt: c?.color ?? "#5fd6c0", accessory: c?.accessory ?? "cap", hair: c?.hair ?? "#2a1d17" };
}

function Turntable({ look }: { look: AvatarLook }) {
  const ref = useRef<Group>(null);
  const speed = useRef(3.2);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.7;
  });
  return (
    <group ref={ref} position={[0, -1.15, 0]}>
      <Avatar look={look} speed={speed} />
    </group>
  );
}

function Preview({ look }: { look: AvatarLook }) {
  return (
    <Canvas camera={{ position: [0, 0.4, 4.2], fov: 35 }} dpr={[1, 2]} style={{ width: 220, height: 260 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} />
      <pointLight position={[-3, 1, -2]} intensity={10} color={look.shirt} />
      <Turntable look={look} />
      <mesh position={[0, -1.17, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[1.1, 48]} />
        <meshStandardMaterial color="#1a2124" />
      </mesh>
    </Canvas>
  );
}

export function CharacterCreator({
  initial,
  onDone,
  onCancel,
}: {
  initial: Character | null;
  onDone: (c: Character) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? hoodieColors[0]);
  const [hair, setHair] = useState(initial?.hair ?? hairColors[0]);
  const [accessory, setAccessory] = useState<Character["accessory"]>(initial?.accessory ?? "cap");
  const char: Character = { name: name.trim().slice(0, 16) || "Visitor", color, accessory, hair };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      window.localStorage.setItem(CHAR_KEY, JSON.stringify(char));
    } catch {}
    onDone(char);
  };

  return (
    <motion.div
      className="absolute inset-0 z-30 grid place-items-center overflow-y-auto bg-[#05080a]/70 p-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
    >
      <motion.form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="creator-title"
        initial={{ opacity: 0, transform: "translateY(20px) scale(0.97)" }}
        animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
        transition={{ duration: 0.5, ease: easeOut }}
        className="grid w-full max-w-[760px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d1113]/95 shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9)] md:grid-cols-[280px_1fr]"
      >
        <div className="relative grid place-items-center border-b border-line bg-[radial-gradient(circle_at_50%_60%,rgb(95_214_192/0.22),transparent_65%)] p-4 md:border-b-0 md:border-r">
          <Preview look={lookFor(char)} />
          <p className="-mt-2 text-lg font-semibold tracking-tight">{char.name}</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Lv 1 · Explorer</p>
        </div>
        <div className="p-6 md:p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">New game · The City</p>
          <h2 id="creator-title" className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
            Create your character
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            An open city built from my portfolio. Walk into project towers, collect class orbs at the Academy, chat with
            the locals and send me a letter from the Post Office.
          </p>

          <label className="mt-6 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted" htmlFor="char-name">
            Name
          </label>
          <input
            id="char-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={16}
            placeholder="Visitor"
            autoFocus
            className="mt-2 h-12 w-full rounded-xl border border-line-strong bg-bg px-4 text-[15px] focus:border-accent focus:outline-none"
          />

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <fieldset>
              <legend className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Hoodie</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {hoodieColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`Hoodie colour ${c}`}
                    aria-pressed={color === c}
                    className={cn("press size-9 rounded-xl border-2 transition-transform duration-150", color === c ? "scale-110 border-fg" : "border-transparent")}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Hair</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {hairColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setHair(c)}
                    aria-label={`Hair colour ${c}`}
                    aria-pressed={hair === c}
                    className={cn("press size-9 rounded-xl border-2 transition-transform duration-150", hair === c ? "scale-110 border-fg" : "border-line-strong")}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </fieldset>
          </div>

          <fieldset className="mt-5">
            <legend className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Gear</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["none", "cap", "headphones"] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAccessory(a)}
                  aria-pressed={accessory === a}
                  className={cn(
                    "press h-10 rounded-xl border px-4 text-sm capitalize transition-colors duration-150",
                    accessory === a ? "border-accent bg-accent/10 text-fg" : "border-line-strong text-muted hover:text-fg",
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-8 flex items-center gap-3">
            <button type="submit" className="press inline-flex h-12 items-center gap-2 rounded-full bg-accent pl-6 pr-5 text-sm font-medium text-accent-ink">
              {initial ? "Save character" : "Enter the city"}
              <ArrowRight size={16} weight="bold" />
            </button>
            {onCancel ? (
              <button type="button" onClick={onCancel} className="h-12 rounded-full px-4 text-sm text-muted hover:text-fg">
                Cancel
              </button>
            ) : null}
          </div>
        </div>
      </motion.form>
    </motion.div>
  );
}
