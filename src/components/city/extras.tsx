"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { Color, Object3D, type InstancedMesh } from "three";
import { FONT, MONO } from "./landmarks";
import { ROAD_LINES, type CityPlan } from "./layout";
import { useNight } from "./props";

export function Billboards({ plan }: { plan: CityPlan }) {
  const night = useNight();
  return (
    <group>
      {plan.billboards.map((b, i) => (
        <group key={i} position={[b.x, b.y, b.z]} rotation-y={b.rot}>
          {[-3, 3].map((x) => (
            <mesh key={x} position={[x, 1.4, 0]}>
              <boxGeometry args={[0.2, 2.8, 0.2]} />
              <meshStandardMaterial color="#2b3337" metalness={0.5} />
            </mesh>
          ))}
          <mesh position={[0, 3.6, 0]}>
            <boxGeometry args={[8.4, 3, 0.25]} />
            <meshStandardMaterial color="#070b0d" roughness={0.4} />
          </mesh>
          <mesh position={[0, 3.6, 0.14]}>
            <planeGeometry args={[8.1, 2.7]} />
            <meshStandardMaterial color="#0b1012" emissive={b.color} emissiveIntensity={night ? 0.12 : 0.02} />
          </mesh>
          <Text font={FONT} fontSize={1.05} maxWidth={7.6} anchorX="center" anchorY="middle" position={[0, 3.85, 0.16]} letterSpacing={-0.02}>
            {b.text}
            <meshStandardMaterial color={b.color} emissive={b.color} emissiveIntensity={night ? 2.4 : 0.5} toneMapped={false} />
          </Text>
          <Text font={MONO} fontSize={0.28} anchorX="center" anchorY="middle" position={[0, 2.8, 0.16]} letterSpacing={0.2}>
            {b.sub}
            <meshBasicMaterial color="#e8eeec" toneMapped={false} />
          </Text>
        </group>
      ))}
    </group>
  );
}

const dummy = new Object3D();
const RED = new Color("#ff3b3b").multiplyScalar(3);
const GREEN = new Color("#3bff9a").multiplyScalar(2.4);

/** Traffic lights on two corners of every intersection, alternating every few seconds. */
export function TrafficLights() {
  const poles = useRef<InstancedMesh>(null);
  const heads = useRef<InstancedMesh>(null);
  const items = useMemo(() => {
    const out: { x: number; z: number; axis: "x" | "z" }[] = [];
    for (const lx of ROAD_LINES) {
      for (const lz of ROAD_LINES) {
        out.push({ x: lx - 6, z: lz - 6, axis: "x" });
        out.push({ x: lx + 6, z: lz + 6, axis: "z" });
      }
    }
    return out;
  }, []);

  useLayoutEffect(() => {
    items.forEach((it, i) => {
      dummy.position.set(it.x, 1.8, it.z);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      poles.current?.setMatrixAt(i, dummy.matrix);
      dummy.position.set(it.x, 3.75, it.z);
      dummy.updateMatrix();
      heads.current?.setMatrixAt(i, dummy.matrix);
    });
    if (poles.current) poles.current.instanceMatrix.needsUpdate = true;
    if (heads.current) heads.current.instanceMatrix.needsUpdate = true;
  }, [items]);

  const phase = useRef(-1);
  useFrame(({ clock }) => {
    const p = Math.floor(clock.elapsedTime / 6) % 2;
    if (p === phase.current || !heads.current) return;
    phase.current = p;
    items.forEach((it, i) => heads.current?.setColorAt(i, (it.axis === "x") === (p === 0) ? GREEN : RED));
    if (heads.current.instanceColor) heads.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={poles} args={[undefined, undefined, items.length]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 3.6, 6]} />
        <meshStandardMaterial color="#20272a" metalness={0.5} roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, items.length]}>
        <boxGeometry args={[0.36, 0.36, 0.36]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
