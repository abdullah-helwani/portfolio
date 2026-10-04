"use client";

import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

export type AvatarLook = {
  shirt: string;
  pants?: string;
  hair?: string;
  skin?: string;
  accessory?: "cap" | "headphones" | "none";
};

function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, v + amount)).toString(16).padStart(2, "0");
  return `#${c((n >> 16) & 255)}${c((n >> 8) & 255)}${c(n & 255)}`;
}

/**
 * Blocky character. `speed` is a ref holding the current ground speed (units/s),
 * used to drive the walk cycle; `airborne` tucks the legs.
 */
export function Avatar({
  look,
  speed,
  airborne,
  scale = 1,
}: {
  look: AvatarLook;
  speed: RefObject<number>;
  airborne?: RefObject<boolean>;
  scale?: number;
}) {
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const body = useRef<Group>(null);
  const phase = useRef<number | null>(null);

  const skin = look.skin ?? "#c98b62";
  const hair = look.hair ?? "#2a1d17";
  const pants = look.pants ?? "#2d3a52";
  const sleeve = shade(look.shirt, -40);

  useFrame((_, dt) => {
    const v = speed.current ?? 0;
    const air = airborne?.current ?? false;
    if (phase.current === null) phase.current = Math.random() * 10;
    phase.current += dt * (2.2 + v * 1.25);
    const amp = air ? 0 : Math.min(1, v / 4) * 0.75;
    const swing = Math.sin(phase.current) * amp;
    if (legL.current) legL.current.rotation.x = air ? -0.5 : swing;
    if (legR.current) legR.current.rotation.x = air ? 0.3 : -swing;
    if (armL.current) armL.current.rotation.x = air ? -2.4 : -swing * 0.9;
    if (armR.current) armR.current.rotation.x = air ? -2.4 : swing * 0.9;
    if (body.current) body.current.position.y = air ? 0 : Math.abs(Math.cos(phase.current)) * amp * 0.08 + (v < 0.2 ? Math.sin(phase.current * 0.6) * 0.012 : 0);
  });

  return (
    <group scale={scale}>
      <group ref={body}>
        {/* legs (pivot at hip) */}
        {[
          [legL, -0.17],
          [legR, 0.17],
        ].map(([ref, x], i) => (
          <group key={i} ref={ref as RefObject<Group>} position={[x as number, 0.82, 0]}>
            <mesh position={[0, -0.36, 0]} castShadow>
              <boxGeometry args={[0.27, 0.72, 0.3]} />
              <meshStandardMaterial color={pants} roughness={0.85} />
            </mesh>
            <mesh position={[0, -0.76, 0.05]} castShadow>
              <boxGeometry args={[0.29, 0.12, 0.4]} />
              <meshStandardMaterial color="#e8eeec" roughness={0.6} />
            </mesh>
          </group>
        ))}
        {/* torso */}
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[0.72, 0.78, 0.42]} />
          <meshStandardMaterial color={look.shirt} roughness={0.75} />
        </mesh>
        <mesh position={[0, 1.02, 0.215]}>
          <boxGeometry args={[0.36, 0.2, 0.02]} />
          <meshStandardMaterial color={sleeve} roughness={0.8} />
        </mesh>
        {/* arms (pivot at shoulder) */}
        {[
          [armL, -0.48],
          [armR, 0.48],
        ].map(([ref, x], i) => (
          <group key={i} ref={ref as RefObject<Group>} position={[x as number, 1.52, 0]}>
            <mesh position={[0, -0.32, 0]} castShadow>
              <boxGeometry args={[0.22, 0.64, 0.26]} />
              <meshStandardMaterial color={sleeve} roughness={0.75} />
            </mesh>
            <mesh position={[0, -0.7, 0]} castShadow>
              <boxGeometry args={[0.2, 0.14, 0.22]} />
              <meshStandardMaterial color={skin} roughness={0.7} />
            </mesh>
          </group>
        ))}
        {/* head */}
        <group position={[0, 1.88, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.52, 0.52, 0.5]} />
            <meshStandardMaterial color={skin} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.22, -0.03]}>
            <boxGeometry args={[0.56, 0.14, 0.56]} />
            <meshStandardMaterial color={hair} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.05, -0.24]}>
            <boxGeometry args={[0.56, 0.36, 0.1]} />
            <meshStandardMaterial color={hair} roughness={0.9} />
          </mesh>
          {[-0.12, 0.12].map((x) => (
            <mesh key={x} position={[x, 0.02, 0.255]}>
              <boxGeometry args={[0.07, 0.09, 0.02]} />
              <meshStandardMaterial color="#101314" />
            </mesh>
          ))}
          {look.accessory === "cap" ? (
            <>
              <mesh position={[0, 0.3, -0.02]} castShadow>
                <boxGeometry args={[0.58, 0.14, 0.58]} />
                <meshStandardMaterial color={shade(look.shirt, -25)} roughness={0.7} />
              </mesh>
              <mesh position={[0, 0.25, 0.36]}>
                <boxGeometry args={[0.5, 0.05, 0.3]} />
                <meshStandardMaterial color={shade(look.shirt, -45)} roughness={0.7} />
              </mesh>
            </>
          ) : null}
          {look.accessory === "headphones" ? (
            <>
              <mesh position={[0, 0.33, 0]}>
                <boxGeometry args={[0.66, 0.07, 0.12]} />
                <meshStandardMaterial color="#e8eeec" roughness={0.4} />
              </mesh>
              {[-0.31, 0.31].map((x) => (
                <mesh key={x} position={[x, 0.02, 0]}>
                  <boxGeometry args={[0.1, 0.26, 0.24]} />
                  <meshStandardMaterial color="#1a1f22" roughness={0.4} emissive={look.shirt} emissiveIntensity={0.35} />
                </mesh>
              ))}
            </>
          ) : null}
        </group>
      </group>
    </group>
  );
}
