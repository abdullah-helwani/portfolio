"use client";
/* eslint-disable react-hooks/immutability -- three.js materials are updated in place when day/night changes. */

import { createContext, useContext, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, InstancedMesh, MeshStandardMaterial, Object3D, type Mesh, type PointLight } from "three";
import { BLOCK, ROAD_LINES, type CityPlan, type Tower } from "./layout";
import { faceTextures } from "./textures";

export const NightContext = createContext(true);
export const useNight = () => useContext(NightContext);

const dummy = new Object3D();

function useInstances(ref: React.RefObject<InstancedMesh | null>, items: { x: number; y: number; z: number; sx?: number; sy?: number; sz?: number; ry?: number }[]) {
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    items.forEach((it, i) => {
      dummy.position.set(it.x, it.y, it.z);
      dummy.rotation.set(0, it.ry ?? 0, 0);
      dummy.scale.set(it.sx ?? 1, it.sy ?? 1, it.sz ?? 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [ref, items]);
}

export function Ground({ plan }: { plan: CityPlan }) {
  const night = useNight();
  const dashRef = useRef<InstancedMesh>(null);
  const zebraRef = useRef<InstancedMesh>(null);

  const dashes = useMemo(() => {
    const out: { x: number; y: number; z: number; ry?: number }[] = [];
    for (const line of ROAD_LINES) {
      for (let p = -116; p <= 116; p += 6) {
        if (ROAD_LINES.some((l) => Math.abs(l - p) < 7)) continue;
        out.push({ x: p, y: 0.02, z: line });
        out.push({ x: line, y: 0.02, z: p, ry: Math.PI / 2 });
      }
    }
    return out;
  }, []);

  const zebras = useMemo(() => {
    const out: { x: number; y: number; z: number; ry?: number }[] = [];
    for (const lx of ROAD_LINES) {
      for (const lz of ROAD_LINES) {
        for (let k = -3; k <= 3; k++) {
          out.push({ x: lx + k * 1.2, y: 0.025, z: lz - 6.4 });
          out.push({ x: lx + k * 1.2, y: 0.025, z: lz + 6.4 });
          out.push({ x: lx - 6.4, y: 0.025, z: lz + k * 1.2, ry: Math.PI / 2 });
          out.push({ x: lx + 6.4, y: 0.025, z: lz + k * 1.2, ry: Math.PI / 2 });
        }
      }
    }
    return out;
  }, []);

  useInstances(dashRef, dashes);
  useInstances(zebraRef, zebras);

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[420, 420]} />
        <meshStandardMaterial color={night ? "#161d21" : "#3a4246"} roughness={0.95} />
      </mesh>
      {plan.blocks.map((b) => {
        const color =
          b.district === "park"
            ? night
              ? "#16281d"
              : "#4f7a4a"
            : b.district === "plaza"
              ? night
                ? "#2c3437"
                : "#9aa3a0"
              : night
                ? "#262e31"
                : "#7d8784";
        return (
          <group key={`${b.x},${b.z}`} position={[b.x, 0, b.z]}>
            <mesh position={[0, 0.1, 0]} receiveShadow>
              <boxGeometry args={[BLOCK, 0.2, BLOCK]} />
              <meshStandardMaterial color={night ? "#343d41" : "#8f9996"} roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.205, 0]} rotation-x={-Math.PI / 2} receiveShadow>
              <planeGeometry args={[BLOCK - 5, BLOCK - 5]} />
              <meshStandardMaterial color={color} roughness={0.95} />
            </mesh>
          </group>
        );
      })}
      <instancedMesh ref={dashRef} args={[undefined, undefined, dashes.length]} receiveShadow>
        <boxGeometry args={[2.4, 0.02, 0.2]} />
        <meshStandardMaterial color="#c9b56a" emissive="#c9b56a" emissiveIntensity={night ? 0.15 : 0} roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={zebraRef} args={[undefined, undefined, zebras.length]} receiveShadow>
        <boxGeometry args={[0.6, 0.02, 2.6]} />
        <meshStandardMaterial color="#d9dedc" roughness={0.7} />
      </instancedMesh>
    </group>
  );
}

export function Lamps({ plan }: { plan: CityPlan }) {
  const night = useNight();
  const poleRef = useRef<InstancedMesh>(null);
  const headRef = useRef<InstancedMesh>(null);
  const poles = useMemo(() => plan.lamps.map((l) => ({ x: l.x, y: 2.6, z: l.z })), [plan.lamps]);
  const heads = useMemo(() => plan.lamps.map((l) => ({ x: l.x, y: 5.25, z: l.z })), [plan.lamps]);
  useInstances(poleRef, poles);
  useInstances(headRef, heads);
  return (
    <group>
      <instancedMesh ref={poleRef} args={[undefined, undefined, poles.length]} castShadow>
        <cylinderGeometry args={[0.09, 0.13, 5.2, 6]} />
        <meshStandardMaterial color="#2b3337" roughness={0.6} metalness={0.4} />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[undefined, undefined, heads.length]}>
        <boxGeometry args={[0.55, 0.28, 0.55]} />
        <meshStandardMaterial color="#fff1d6" emissive="#ffd59a" emissiveIntensity={night ? 3.2 : 0.2} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

/** A handful of real point lights that follow the player between nearby lamps. */
export function LampLights({ plan, player }: { plan: CityPlan; player: React.RefObject<{ x: number; z: number }> }) {
  const night = useNight();
  const lights = useRef<(PointLight | null)[]>([]);
  const timer = useRef(0);
  useFrame((_, dt) => {
    timer.current -= dt;
    if (timer.current > 0) return;
    timer.current = 0.4;
    const p = player.current;
    if (!p) return;
    const nearest = [...plan.lamps].sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z)).slice(0, 4);
    nearest.forEach((l, i) => lights.current[i]?.position.set(l.x, 4.9, l.z));
  });
  if (!night) return null;
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <pointLight key={i} ref={(el) => void (lights.current[i] = el)} color="#ffd59a" intensity={30} distance={16} decay={2} />
      ))}
    </>
  );
}

export function Trees({ plan }: { plan: CityPlan }) {
  const night = useNight();
  const trunkRef = useRef<InstancedMesh>(null);
  const crownRef = useRef<InstancedMesh>(null);
  const trunks = useMemo(() => plan.trees.map((t) => ({ x: t.x, y: 1.1 * t.s + 0.2, z: t.z, sx: t.s, sy: t.s, sz: t.s })), [plan.trees]);
  const crowns = useMemo(() => plan.trees.map((t, i) => ({ x: t.x, y: 3.1 * t.s + 0.2, z: t.z, sx: t.s, sy: t.s * 1.15, sz: t.s, ry: i })), [plan.trees]);
  useInstances(trunkRef, trunks);
  useInstances(crownRef, crowns);
  useLayoutEffect(() => {
    const mesh = crownRef.current;
    if (!mesh) return;
    const greens = night ? ["#1f4a35", "#245a3e", "#1b3f2e"] : ["#4f8f4a", "#5ea152", "#3f7d43"];
    plan.trees.forEach((_, i) => mesh.setColorAt(i, new Color(greens[i % greens.length])));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [plan.trees, night]);
  return (
    <group>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, trunks.length]} castShadow>
        <cylinderGeometry args={[0.18, 0.26, 2.2, 6]} />
        <meshStandardMaterial color="#4a3526" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={crownRef} args={[undefined, undefined, crowns.length]} castShadow>
        <icosahedronGeometry args={[1.7, 0]} />
        <meshStandardMaterial flatShading roughness={0.85} />
      </instancedMesh>
    </group>
  );
}

export function TowerMesh({ t, emissiveBoost = 1 }: { t: Tower; emissiveBoost?: number }) {
  const night = useNight();
  const blink = useRef<Mesh>(null);
  const materials = useMemo(() => {
    const front = faceTextures(t.variant, t.w, t.h);
    const side = faceTextures(t.variant, t.d, t.h);
    const make = (tex: ReturnType<typeof faceTextures>) =>
      new MeshStandardMaterial({
        color: new Color(t.tint).multiplyScalar(5.2),
        map: tex.map,
        emissiveMap: tex.emissive,
        emissive: new Color("#ffffff"),
        emissiveIntensity: 1,
        roughness: 0.55,
        metalness: 0.25,
      });
    const roof = new MeshStandardMaterial({ color: "#1c2326", roughness: 0.9 });
    const fm = make(front);
    const sm = make(side);
    return { list: [sm, sm, roof, roof, fm, fm], lit: [fm, sm] };
  }, [t]);

  useLayoutEffect(() => {
    for (const m of materials.lit) m.emissiveIntensity = (night ? 1.5 : 0.08) * emissiveBoost;
  }, [night, materials, emissiveBoost]);

  useFrame(({ clock }) => {
    if (blink.current) (blink.current.material as MeshStandardMaterial).emissiveIntensity = Math.sin(clock.elapsedTime * 3 + t.x) > 0.6 ? 4 : 0.3;
  });

  return (
    <group position={[t.x, 0, t.z]}>
      <mesh position={[0, t.h / 2 + 0.2, 0]} material={materials.list} castShadow receiveShadow>
        <boxGeometry args={[t.w, t.h, t.d]} />
      </mesh>
      {/* roof clutter */}
      <mesh position={[t.w * 0.2, t.h + 0.8, -t.d * 0.15]} castShadow>
        <boxGeometry args={[t.w * 0.3, 1.2, t.d * 0.3]} />
        <meshStandardMaterial color="#2a3236" roughness={0.8} />
      </mesh>
      <mesh position={[0, t.h + 0.3, 0]}>
        <boxGeometry args={[t.w + 0.3, 0.3, t.d + 0.3]} />
        <meshStandardMaterial color="#2f383c" roughness={0.7} />
      </mesh>
      {t.antenna ? (
        <>
          <mesh position={[-t.w * 0.2, t.h + 4, t.d * 0.1]}>
            <cylinderGeometry args={[0.08, 0.12, 7, 5]} />
            <meshStandardMaterial color="#8b9794" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh ref={blink} position={[-t.w * 0.2, t.h + 7.6, t.d * 0.1]}>
            <sphereGeometry args={[0.22, 8, 8]} />
            <meshStandardMaterial color="#ff4d4d" emissive="#ff3030" emissiveIntensity={2} toneMapped={false} />
          </mesh>
        </>
      ) : null}
    </group>
  );
}

export function Towers({ plan }: { plan: CityPlan }) {
  return (
    <group>
      {plan.towers.map((t, i) => (
        <TowerMesh key={i} t={t} />
      ))}
    </group>
  );
}

export function Bench({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[2, 0.12, 0.6]} />
        <meshStandardMaterial color="#6e5338" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.85, -0.27]} castShadow>
        <boxGeometry args={[2, 0.5, 0.08]} />
        <meshStandardMaterial color="#6e5338" roughness={0.8} />
      </mesh>
      {[-0.85, 0.85].map((x) => (
        <mesh key={x} position={[x, 0.25, 0]}>
          <boxGeometry args={[0.1, 0.5, 0.5]} />
          <meshStandardMaterial color="#2b3337" />
        </mesh>
      ))}
    </group>
  );
}
