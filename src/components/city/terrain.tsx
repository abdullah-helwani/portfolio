"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, IcosahedronGeometry, Shape, type BufferGeometry, type Mesh, type MeshStandardMaterial } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { HALF_MAP, islandOutline, type CityPlan } from "./layout";
import { Bench, useNight } from "./props";

/** The city sits on an island: an irregular coastline, a ring of grass and sea all around. */
export function Island() {
  const night = useNight();
  const shape = useMemo(() => {
    const s = new Shape();
    // shape space y maps to world -z after the -90° X rotation, so flip to match the maps
    islandOutline().forEach(([x, z], i) => (i === 0 ? s.moveTo(x, -z) : s.lineTo(x, -z)));
    return s;
  }, []);
  const water = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const m = water.current?.material as MeshStandardMaterial | undefined;
    if (m) m.emissiveIntensity = (night ? 0.22 : 0.05) + Math.sin(clock.elapsedTime * 0.6) * 0.02;
  });
  const hills = useMemo(() => {
    const parts: BufferGeometry[] = [];
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 + Math.sin(i * 12.9) * 0.08;
      const r = 300 + Math.sin(i * 4.1) * 40;
      const s = 30 + Math.abs(Math.sin(i * 7.7)) * 45;
      parts.push(new IcosahedronGeometry(1, 1).scale(s * 1.6, s * 0.7, s).translate(Math.cos(a) * r, -s * 0.15, Math.sin(a) * r));
    }
    return mergeGeometries(parts, false);
  }, []);

  return (
    <group>
      <mesh ref={water} position={[0, -0.5, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[1600, 1600]} />
        <meshStandardMaterial color={night ? "#06141c" : "#2b6f86"} emissive={night ? "#0d3b4a" : "#3c8fa8"} emissiveIntensity={0.2} roughness={0.25} metalness={0.4} />
      </mesh>
      <mesh position={[0, -0.12, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial color={night ? "#1d2a1f" : "#5c7d4c"} roughness={1} side={DoubleSide} />
      </mesh>
      {/* sand edge, slightly larger and lower */}
      <mesh position={[0, -0.2, 0]} rotation-x={-Math.PI / 2} scale={1.04}>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial color={night ? "#3a3526" : "#cdbb8a"} roughness={1} side={DoubleSide} />
      </mesh>
      {hills ? (
        <mesh geometry={hills}>
          <meshStandardMaterial color={night ? "#101a1d" : "#5d7a6a"} flatShading roughness={1} />
        </mesh>
      ) : null}
      {/* city base, so asphalt stops at the edge of the streets */}
      <mesh position={[0, -0.04, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[HALF_MAP * 2 + 12, HALF_MAP * 2 + 12]} />
        <meshStandardMaterial color={night ? "#161d21" : "#3a4246"} roughness={0.95} />
      </mesh>
    </group>
  );
}

export function Ponds({ plan }: { plan: CityPlan }) {
  const night = useNight();
  return (
    <group>
      {plan.ponds.map((p) => (
        <group key={`${p.x},${p.z}`} position={[p.x, 0.22, p.z]}>
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
            <ringGeometry args={[p.r, p.r + 0.6, 40]} />
            <meshStandardMaterial color="#8b9794" roughness={0.9} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2}>
            <circleGeometry args={[p.r, 40]} />
            <meshStandardMaterial color={night ? "#0a2230" : "#3d8aa3"} emissive={night ? "#12465a" : "#000000"} emissiveIntensity={0.35} roughness={0.15} metalness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function ParkingLots({ plan }: { plan: CityPlan }) {
  return (
    <group>
      {plan.parking.map((p) => (
        <group key={`${p.x},${p.z}`} position={[p.x, 0.215, p.z]}>
          <mesh rotation-x={-Math.PI / 2}>
            <planeGeometry args={[p.w, p.d]} />
            <meshStandardMaterial color="#22292c" roughness={0.95} />
          </mesh>
          {Array.from({ length: 6 }, (_, c) => (
            <group key={c}>
              {[-4, 4].map((z) => (
                <mesh key={z} position={[-11.25 + c * 4.5, 0.01, z]} rotation-x={-Math.PI / 2}>
                  <planeGeometry args={[0.15, 4.4]} />
                  <meshBasicMaterial color="#c9d2d0" />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

export function Benches({ plan }: { plan: CityPlan }) {
  return (
    <group>
      {plan.benches.map((b, i) => (
        <Bench key={i} position={[b.x, 0.2, b.z]} rotation={b.rot} />
      ))}
    </group>
  );
}

/** Round plaza paving laid over the square block. */
export function PlazaDisc() {
  const night = useNight();
  return (
    <group position={[0, 0.215, 0]}>
      <mesh rotation-x={-Math.PI / 2}>
        <circleGeometry args={[13.5, 64]} />
        <meshStandardMaterial color={night ? "#2f3a3c" : "#a7b0ab"} roughness={0.9} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, 0]}>
        <ringGeometry args={[13.5, 14.6, 64]} />
        <meshStandardMaterial color={night ? "#1f4a35" : "#4f8f4a"} roughness={1} />
      </mesh>
    </group>
  );
}
