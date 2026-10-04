"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Object3D, type Group, type InstancedMesh } from "three";
import { Avatar } from "./avatar";
import { HALF_MAP, loopPoint, type Car, type CityPlan, type Walker } from "./layout";
import { useNight } from "./props";
import { useRuntime } from "./runtime";

// ---------------------------------------------------------------- cars

function CarModel({ color }: { color: string }) {
  const night = useNight();
  return (
    <group>
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[1.9, 0.62, 4.2]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.5} />
      </mesh>
      <mesh position={[0, 1.18, -0.25]} castShadow>
        <boxGeometry args={[1.65, 0.55, 2.2]} />
        <meshStandardMaterial color="#0e1416" roughness={0.1} metalness={0.8} />
      </mesh>
      {[
        [-0.9, 1.3],
        [0.9, 1.3],
        [-0.9, -1.3],
        [0.9, -1.3],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.36, z]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.36, 0.36, 0.3, 12]} />
          <meshStandardMaterial color="#0b0e0f" roughness={0.9} />
        </mesh>
      ))}
      {[-0.62, 0.62].map((x) => (
        <mesh key={`h${x}`} position={[x, 0.68, 2.11]}>
          <boxGeometry args={[0.42, 0.16, 0.04]} />
          <meshStandardMaterial color="#ffffff" emissive="#fff4d6" emissiveIntensity={night ? 4 : 0.4} toneMapped={false} />
        </mesh>
      ))}
      {[-0.66, 0.66].map((x) => (
        <mesh key={`t${x}`} position={[x, 0.7, -2.11]}>
          <boxGeometry args={[0.4, 0.14, 0.04]} />
          <meshStandardMaterial color="#ff4d4d" emissive="#ff2a2a" emissiveIntensity={night ? 3 : 0.6} toneMapped={false} />
        </mesh>
      ))}
      {night ? (
        <mesh position={[0, 0.03, 5]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[2.6, 6]} />
          <meshBasicMaterial color="#fff1c8" transparent opacity={0.07} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  );
}

function MovingCar({ car }: { car: Car }) {
  const ref = useRef<Group>(null);
  const rt = useRuntime();
  const state = useRef({ s: car.offset - HALF_MAP, v: car.speed });
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const st = state.current;
    const p = rt.player;
    // brake for the player standing in the lane ahead
    const along = car.axis === "x" ? p.x : p.z;
    const across = car.axis === "x" ? p.z : p.x;
    const lanePos = car.line + car.lane;
    const ahead = (along - st.s) * car.dir;
    const blocked = Math.abs(across - lanePos) < 1.8 && ahead > 0 && ahead < 8;
    const target = blocked ? 0 : car.speed;
    st.v += (target - st.v) * Math.min(1, dt * (blocked ? 6 : 1.5));
    st.s += car.dir * st.v * dt;
    if (st.s > HALF_MAP + 10) st.s = -HALF_MAP - 10;
    if (st.s < -HALF_MAP - 10) st.s = HALF_MAP + 10;
    const g = ref.current;
    if (!g) return;
    if (car.axis === "x") g.position.set(st.s, 0, lanePos);
    else g.position.set(lanePos, 0, st.s);
    g.rotation.y = car.axis === "x" ? (car.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : car.dir > 0 ? 0 : Math.PI;
  });
  return (
    <group ref={ref}>
      <CarModel color={car.color} />
    </group>
  );
}

export function Traffic({ plan }: { plan: CityPlan }) {
  return (
    <group>
      {plan.cars.map((c, i) => (
        <MovingCar key={i} car={c} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------- pedestrians

function Citizen({ w }: { w: Walker }) {
  const ref = useRef<Group>(null);
  const rt = useRuntime();
  const speed = useRef(Math.abs(w.speed));
  const s = useRef(w.offset);
  const [talking, setTalking] = useState(false);
  const talkingRef = useRef(false);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const g = ref.current;
    if (!g) return;
    const p = rt.player;
    const dist = Math.hypot(g.position.x - p.x, g.position.z - p.z);
    const close = dist < 3.2 && !rt.paused;
    if (close !== talkingRef.current) {
      talkingRef.current = close;
      setTalking(close);
      if (close) rt.events.onTalk(w.id);
    }
    const moving = !close;
    speed.current = moving ? Math.abs(w.speed) : 0;
    if (moving) s.current += w.speed * dt;
    const pt = loopPoint(w.cx, w.cz, w.half, s.current);
    g.position.set(pt.x, 0.2, pt.z);
    const heading = close ? Math.atan2(p.x - pt.x, p.z - pt.z) : pt.heading + (w.speed < 0 ? Math.PI : 0);
    let diff = heading - g.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    g.rotation.y += diff * Math.min(1, dt * 8);
  });

  return (
    <group ref={ref}>
      <Avatar look={{ shirt: w.color, hair: w.hair, pants: "#3a4246", accessory: w.id % 4 === 0 ? "cap" : "none" }} speed={speed} />
      {talking ? (
        <Html position={[0, 2.9, 0]} center distanceFactor={14} zIndexRange={[20, 0]} pointerEvents="none">
          <div className="w-[220px] rounded-2xl border border-white/10 bg-[#0f1214]/90 px-3.5 py-2.5 text-[13px] leading-snug text-[#e8eeec] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur">
            {w.line}
          </div>
        </Html>
      ) : null}
    </group>
  );
}

export function Citizens({ plan }: { plan: CityPlan }) {
  return (
    <group>
      {plan.walkers.map((w) => (
        <Citizen key={w.id} w={w} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------- bits

const dummy = new Object3D();

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
