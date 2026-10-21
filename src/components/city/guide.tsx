"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import type { Group, Mesh } from "three";
import type { GuideConfig } from "@/lib/site";
import { Avatar } from "./avatar";
import { FONT, MONO } from "./landmarks";
import { useRuntime } from "./runtime";

/** The site owner standing in the plaza, turning to face visitors who come close. */
export function Guide({ guide, at, met }: { guide: GuideConfig; at: { x: number; z: number; heading: number }; met: boolean }) {
  const rt = useRuntime();
  const group = useRef<Group>(null);
  const marker = useRef<Mesh>(null);
  const speed = useRef(0);
  useFrame(({ clock }, dt) => {
    const g = group.current;
    if (!g) return;
    const p = rt.player;
    const d = Math.hypot(p.x - at.x, p.z - at.z);
    const target = d < 9 ? Math.atan2(p.x - at.x, p.z - at.z) : at.heading;
    let diff = target - g.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    g.rotation.y += diff * Math.min(1, dt * 5);
    if (marker.current) marker.current.position.y = 3.25 + Math.sin(clock.elapsedTime * 3) * 0.12;
  });
  return (
    <group position={[at.x, 0.2, at.z]}>
      <group ref={group} rotation-y={at.heading}>
        <Avatar look={{ shirt: guide.shirt, pants: guide.pants, hair: guide.hair, skin: guide.skin, accessory: guide.accessory }} speed={speed} scale={1.08} />
      </group>
      <mesh position={[0, 0.03, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.9, 1.15, 40]} />
        <meshStandardMaterial color="#5fd6c0" emissive="#5fd6c0" emissiveIntensity={2} toneMapped={false} transparent opacity={0.8} />
      </mesh>
      <Billboard position={[0, 2.75, 0]}>
        <Text font={FONT} fontSize={0.32} anchorX="center" anchorY="bottom" position={[0, 0.06, 0]}>
          {guide.name}
          <meshBasicMaterial color="#e8eeec" toneMapped={false} />
        </Text>
        <Text font={MONO} fontSize={0.15} anchorX="center" anchorY="top" letterSpacing={0.18} position={[0, 0, 0]}>
          CITY GUIDE · PRESS E
          <meshBasicMaterial color="#5fd6c0" toneMapped={false} />
        </Text>
      </Billboard>
      {!met ? (
        <mesh ref={marker} position={[0, 3.25, 0]}>
          <octahedronGeometry args={[0.18, 0]} />
          <meshStandardMaterial color="#f6c177" emissive="#f6c177" emissiveIntensity={3} toneMapped={false} />
        </mesh>
      ) : null}
    </group>
  );
}
