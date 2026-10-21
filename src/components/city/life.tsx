"use client";
/* eslint-disable react-hooks/immutability -- traffic and crowd state lives in refs and the shared runtime, updated every frame without React renders. */

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Color, Euler, Matrix4, Object3D, Quaternion, Vector3, type Group, type InstancedMesh } from "three";
import { HALF_MAP, loopPoint, type CityPlan } from "./layout";
import { useNight } from "./props";
import { useRuntime } from "./runtime";

// Everything that moves is instanced: all cars share ~6 draw calls and all citizens ~10,
// instead of a dozen meshes each. Matrices are composed by hand every frame.

const tmpM = new Matrix4();
const tmpP = new Matrix4();
const tmpQ = new Quaternion();
const tmpE = new Euler();
const tmpV = new Vector3();
const tmpS = new Vector3(1, 1, 1);
const ZERO = new Matrix4().makeScale(0, 0, 0);
const dummy = new Object3D();
const scratch = new Matrix4();

/** Root transform at (x, y, z) facing `heading` (rotation about Y). */
function root(out: Matrix4, x: number, y: number, z: number, heading: number) {
  tmpQ.setFromEuler(tmpE.set(0, heading, 0));
  return out.compose(tmpV.set(x, y, z), tmpQ, tmpS.set(1, 1, 1));
}

/** parent × translate(pivot) × rotateX(angle) × translate(offset) */
function limb(out: Matrix4, parent: Matrix4, px: number, py: number, pz: number, angle: number, ox: number, oy: number, oz: number) {
  tmpQ.setFromEuler(tmpE.set(angle, 0, 0));
  tmpM.compose(tmpV.set(px, py, pz), tmpQ, tmpS.set(1, 1, 1));
  out.multiplyMatrices(parent, tmpM);
  tmpM.makeTranslation(ox, oy, oz);
  return out.multiply(tmpM);
}

// ---------------------------------------------------------------- traffic

type CarState = { s: number; v: number };
const CAR_HALF_LEN = 2.2;
const CAR_HALF_W = 1.05;

export function Traffic({ plan }: { plan: CityPlan }) {
  const rt = useRuntime();
  const night = useNight();
  const cars = plan.cars;
  const parked = useMemo(() => plan.parking.flatMap((p) => p.cars), [plan.parking]);
  const total = cars.length + parked.length;
  const state = useRef<CarState[]>(cars.map((c) => ({ s: c.offset - HALF_MAP, v: c.speed })));
  const body = useRef<InstancedMesh>(null);
  const cabin = useRef<InstancedMesh>(null);
  const wheels = useRef<InstancedMesh>(null);
  const heads = useRef<InstancedMesh>(null);
  const tails = useRef<InstancedMesh>(null);
  const beams = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const c = new Color();
    [...cars.map((x) => x.color), ...parked.map((x) => x.color)].forEach((col, i) => body.current?.setColorAt(i, c.set(col)));
    if (body.current?.instanceColor) body.current.instanceColor.needsUpdate = true;
    rt.cars = Array.from({ length: total }, () => ({ x: 0, z: 0, hw: 0, hd: 0 }));
  }, [cars, parked, total, rt]);

  const write = (i: number, x: number, z: number, heading: number) => {
    root(tmpP, x, 0, z, heading);
    const m = scratch;
    body.current?.setMatrixAt(i, m.multiplyMatrices(tmpP, tmpM.makeTranslation(0, 0.62, 0)));
    cabin.current?.setMatrixAt(i, m.multiplyMatrices(tmpP, tmpM.makeTranslation(0, 1.18, -0.25)));
    let k = 0;
    for (const [wx, wz] of [
      [-0.9, 1.3],
      [0.9, 1.3],
      [-0.9, -1.3],
      [0.9, -1.3],
    ]) {
      tmpQ.setFromEuler(tmpE.set(0, 0, Math.PI / 2));
      tmpM.compose(tmpV.set(wx, 0.36, wz), tmpQ, tmpS.set(1, 1, 1));
      wheels.current?.setMatrixAt(i * 4 + k++, m.multiplyMatrices(tmpP, tmpM));
    }
    for (const [j, sx] of [
      [0, -0.62],
      [1, 0.62],
    ]) {
      heads.current?.setMatrixAt(i * 2 + j, m.multiplyMatrices(tmpP, tmpM.makeTranslation(sx, 0.68, 2.11)));
      tails.current?.setMatrixAt(i * 2 + j, m.multiplyMatrices(tmpP, tmpM.makeTranslation(sx * 1.06, 0.7, -2.11)));
    }
    if (beams.current) {
      tmpQ.setFromEuler(tmpE.set(-Math.PI / 2, 0, 0));
      tmpM.compose(tmpV.set(0, 0.03, 5), tmpQ, tmpS.set(1, 1, 1));
      beams.current.setMatrixAt(i, m.multiplyMatrices(tmpP, tmpM));
    }
    const box = rt.cars[i];
    if (box) {
      const alongX = Math.abs(Math.sin(heading)) > 0.5;
      box.x = x;
      box.z = z;
      box.hw = alongX ? CAR_HALF_LEN : CAR_HALF_W;
      box.hd = alongX ? CAR_HALF_W : CAR_HALF_LEN;
    }
  };

  // parked cars never move: place them once
  useLayoutEffect(() => {
    parked.forEach((p, j) => write(cars.length + j, p.x, p.z, p.rot));
    for (const r of [body, cabin, wheels, heads, tails, beams]) if (r.current) r.current.instanceMatrix.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parked, cars.length]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const p = rt.player;
    const st = state.current;
    cars.forEach((car, i) => {
      const me = st[i];
      const lanePos = car.line + car.lane;
      const along = car.axis === "x" ? p.x : p.z;
      const across = car.axis === "x" ? p.z : p.x;
      // stop for the player anywhere in front of the bumper, and for the car ahead in the same lane
      const ahead = (along - me.s) * car.dir;
      let blocked = Math.abs(across - lanePos) < 2.6 && ahead > -1.5 && ahead < 10;
      if (!blocked) {
        for (let j = 0; j < cars.length; j++) {
          if (j === i) continue;
          const o = cars[j];
          if (o.axis !== car.axis || o.line !== car.line || o.lane !== car.lane) continue;
          const gap = (st[j].s - me.s) * car.dir;
          if (gap > 0 && gap < 8) {
            blocked = true;
            break;
          }
        }
      }
      const target = blocked ? 0 : car.speed;
      me.v += (target - me.v) * Math.min(1, dt * (blocked ? 7 : 1.4));
      if (me.v < 0.05 && blocked) me.v = 0;
      me.s += car.dir * me.v * dt;
      if (me.s > HALF_MAP + 10) me.s = -HALF_MAP - 10;
      if (me.s < -HALF_MAP - 10) me.s = HALF_MAP + 10;
      const x = car.axis === "x" ? me.s : lanePos;
      const z = car.axis === "x" ? lanePos : me.s;
      const heading = car.axis === "x" ? (car.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : car.dir > 0 ? 0 : Math.PI;
      write(i, x, z, heading);
    });
    if (cars.length) for (const r of [body, cabin, wheels, heads, tails, beams]) if (r.current) r.current.instanceMatrix.needsUpdate = true;
  });

  if (!total) return null;
  return (
    <group>
      <instancedMesh ref={body} args={[undefined, undefined, total]} castShadow frustumCulled={false}>
        <boxGeometry args={[1.9, 0.62, 4.2]} />
        <meshStandardMaterial roughness={0.35} metalness={0.5} />
      </instancedMesh>
      <instancedMesh ref={cabin} args={[undefined, undefined, total]} frustumCulled={false}>
        <boxGeometry args={[1.65, 0.55, 2.2]} />
        <meshStandardMaterial color="#0e1416" roughness={0.1} metalness={0.8} />
      </instancedMesh>
      <instancedMesh ref={wheels} args={[undefined, undefined, total * 4]} frustumCulled={false}>
        <cylinderGeometry args={[0.36, 0.36, 0.3, 10]} />
        <meshStandardMaterial color="#0b0e0f" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, total * 2]} frustumCulled={false}>
        <boxGeometry args={[0.42, 0.16, 0.04]} />
        <meshStandardMaterial color="#ffffff" emissive="#fff4d6" emissiveIntensity={night ? 4 : 0.4} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={tails} args={[undefined, undefined, total * 2]} frustumCulled={false}>
        <boxGeometry args={[0.4, 0.14, 0.04]} />
        <meshStandardMaterial color="#ff4d4d" emissive="#ff2a2a" emissiveIntensity={night ? 3 : 0.6} toneMapped={false} />
      </instancedMesh>
      {night ? (
        <instancedMesh ref={beams} args={[undefined, undefined, cars.length || 1]} frustumCulled={false}>
          <planeGeometry args={[2.6, 6]} />
          <meshBasicMaterial color="#fff1c8" transparent opacity={0.07} depthWrite={false} />
        </instancedMesh>
      ) : null}
    </group>
  );
}

// ---------------------------------------------------------------- pedestrians

function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, v + amount)).toString(16).padStart(2, "0");
  return `#${c((n >> 16) & 255)}${c((n >> 8) & 255)}${c(n & 255)}`;
}

const SKINS = ["#c98b62", "#a86b4a", "#e0b48c", "#7a4e35", "#d9a074"];

type Part = { key: string; size: [number, number, number]; perCitizen: number; color: (i: number) => string; rough?: number; shadow?: boolean };

export function Citizens({ plan }: { plan: CityPlan }) {
  const rt = useRuntime();
  const walkers = plan.walkers;
  const n = walkers.length;
  const meshes = useRef<Record<string, InstancedMesh | null>>({});
  const sim = useRef(walkers.map((w) => ({ s: w.offset, phase: w.id * 1.7, x: 0, z: 0, heading: 0, talking: false })));
  const [talking, setTalking] = useState(-1);
  const bubble = useRef<Group>(null);

  const parts: Part[] = useMemo(
    () => [
      { key: "leg", size: [0.27, 0.72, 0.3], perCitizen: 2, color: () => "#3a4246", shadow: true },
      { key: "shoe", size: [0.29, 0.12, 0.4], perCitizen: 2, color: () => "#e8eeec" },
      { key: "torso", size: [0.72, 0.78, 0.42], perCitizen: 1, color: (i) => walkers[i].color, shadow: true },
      { key: "arm", size: [0.22, 0.64, 0.26], perCitizen: 2, color: (i) => shade(walkers[Math.floor(i / 2)].color, -40), shadow: true },
      { key: "hand", size: [0.2, 0.14, 0.22], perCitizen: 2, color: (i) => SKINS[Math.floor(i / 2) % SKINS.length] },
      { key: "head", size: [0.52, 0.52, 0.5], perCitizen: 1, color: (i) => SKINS[i % SKINS.length], shadow: true },
      { key: "hairTop", size: [0.56, 0.14, 0.56], perCitizen: 1, color: (i) => walkers[i].hair, rough: 0.9 },
      { key: "hairBack", size: [0.56, 0.36, 0.1], perCitizen: 1, color: (i) => walkers[i].hair, rough: 0.9 },
      { key: "eye", size: [0.07, 0.09, 0.02], perCitizen: 2, color: () => "#101314" },
      { key: "cap", size: [0.58, 0.14, 0.58], perCitizen: 1, color: (i) => shade(walkers[i].color, -25) },
    ],
    [walkers],
  );

  useLayoutEffect(() => {
    const c = new Color();
    for (const part of parts) {
      const mesh = meshes.current[part.key];
      if (!mesh) continue;
      for (let i = 0; i < n * part.perCitizen; i++) mesh.setColorAt(i, c.set(part.color(part.perCitizen === 2 && part.key !== "arm" && part.key !== "hand" ? Math.floor(i / 2) : i)));
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  }, [parts, n]);

  const base = useMemo(() => new Matrix4(), []);
  const out = useMemo(() => new Matrix4(), []);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const p = rt.player;
    const M = meshes.current;
    let nowTalking = -1;
    walkers.forEach((w, i) => {
      const me = sim.current[i];
      const dist = Math.hypot(me.x - p.x, me.z - p.z);
      const close = dist < 3.2 && !rt.paused;
      if (close && nowTalking < 0) nowTalking = i;
      if (close && !me.talking) rt.events.onTalk(w.id);
      me.talking = close;
      const speed = close ? 0 : Math.abs(w.speed);
      if (!close) me.s += w.speed * dt;
      const pt = loopPoint(w.cx, w.cz, w.half, me.s);
      me.x = pt.x;
      me.z = pt.z;
      const target = close ? Math.atan2(p.x - pt.x, p.z - pt.z) : pt.heading + (w.speed < 0 ? Math.PI : 0);
      let diff = target - me.heading;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      me.heading += diff * Math.min(1, dt * 8);
      me.phase += dt * (2.2 + speed * 1.25);
      const amp = Math.min(1, speed / 4) * 0.75;
      const swing = Math.sin(me.phase) * amp;
      const bob = Math.abs(Math.cos(me.phase)) * amp * 0.08;

      // far away citizens are hidden entirely
      const far = dist > 110;
      root(base, pt.x, 0.2 + bob, pt.z, me.heading);
      const set = (key: string, k: number, m: Matrix4) => M[key]?.setMatrixAt(k, far ? ZERO : m);
      [-1, 1].forEach((side, j) => {
        const leg = side < 0 ? swing : -swing;
        set("leg", i * 2 + j, limb(out, base, side * 0.17, 0.82, 0, leg, 0, -0.36, 0));
        set("shoe", i * 2 + j, limb(out, base, side * 0.17, 0.82, 0, leg, 0, -0.76, 0.05));
        const arm = side < 0 ? -swing * 0.9 : swing * 0.9;
        set("arm", i * 2 + j, limb(out, base, side * 0.48, 1.52, 0, arm, 0, -0.32, 0));
        set("hand", i * 2 + j, limb(out, base, side * 0.48, 1.52, 0, arm, 0, -0.7, 0));
        set("eye", i * 2 + j, limb(out, base, 0, 1.88, 0, 0, side * 0.12, 0.02, 0.255));
      });
      set("torso", i, limb(out, base, 0, 1.2, 0, 0, 0, 0, 0));
      set("head", i, limb(out, base, 0, 1.88, 0, 0, 0, 0, 0));
      set("hairTop", i, limb(out, base, 0, 1.88, 0, 0, 0, 0.22, -0.03));
      set("hairBack", i, limb(out, base, 0, 1.88, 0, 0, 0, 0.05, -0.24));
      M.cap?.setMatrixAt(i, far || w.id % 4 !== 0 ? ZERO : limb(out, base, 0, 1.88, 0, 0, 0, 0.3, -0.02));
    });
    for (const part of parts) {
      const mesh = M[part.key];
      if (mesh) mesh.instanceMatrix.needsUpdate = true;
    }
    rt.talking = nowTalking >= 0 ? walkers[nowTalking].id : -1;
    if (nowTalking !== talking) setTalking(nowTalking);
    if (bubble.current && nowTalking >= 0) {
      const me = sim.current[nowTalking];
      bubble.current.position.set(me.x, 2.9, me.z);
    }
  });

  if (!n) return null;
  return (
    <group>
      {parts.map((part) => (
        <instancedMesh key={part.key} ref={(m) => void (meshes.current[part.key] = m)} args={[undefined, undefined, n * part.perCitizen]} castShadow={part.shadow} frustumCulled={false}>
          <boxGeometry args={part.size} />
          <meshStandardMaterial roughness={part.rough ?? 0.75} />
        </instancedMesh>
      ))}
      <group ref={bubble}>
        {talking >= 0 ? (
          <Html center distanceFactor={14} zIndexRange={[20, 0]} pointerEvents="none">
            <div className="w-[220px] rounded-2xl border border-white/10 bg-[#0f1214]/90 px-3.5 py-2.5 text-[13px] leading-snug text-[#e8eeec] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur">
              {walkers[talking].line}
            </div>
          </Html>
        ) : null}
      </group>
    </group>
  );
}

// ---------------------------------------------------------------- bits

export function Bits({ plan }: { plan: CityPlan }) {
  const ref = useRef<InstancedMesh>(null);
  const rt = useRuntime();
  const bits = useMemo(() => plan.bits, [plan.bits]);

  useLayoutEffect(() => {
    if (ref.current) ref.current.count = bits.length;
  }, [bits.length]);

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = clock.elapsedTime;
    bits.forEach((b, i) => {
      const gone = rt.bits.has(b.id);
      dummy.position.set(b.x, b.y + Math.sin(t * 2 + b.id) * 0.18, b.z);
      dummy.rotation.set(0, t * 1.5 + b.id, Math.PI / 4);
      const s = gone ? 0 : 1;
      dummy.scale.set(s, s * 1.4, s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, bits.length]} frustumCulled={false}>
      <octahedronGeometry args={[0.32, 0]} />
      <meshStandardMaterial color="#9ff0e0" emissive="#5fd6c0" emissiveIntensity={3} toneMapped={false} />
    </instancedMesh>
  );
}
