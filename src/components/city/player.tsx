"use client";
/* eslint-disable react-hooks/immutability -- the player controller writes into the shared game runtime every frame, by design. */

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3, type DirectionalLight, type Group } from "three";
import { Avatar, type AvatarLook } from "./avatar";
import { HALF_MAP, districtAt, interactiveKinds, type CityPlan } from "./layout";
import { useNight } from "./props";
import { useRuntime } from "./runtime";

const WALK = 7.5;
const RUN = 13.5;
const GRAVITY = 26;
const JUMP = 9.5;
const RADIUS = 0.55;

export function Player({ plan, look, light = true }: { plan: CityPlan; look: AvatarLook; light?: boolean }) {
  const rt = useRuntime();
  const group = useRef<Group>(null);
  const speed = useRef(0);
  const air = useRef(false);
  const vel = useRef({ x: 0, z: 0 });
  const districtTick = useRef(0);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const p = rt.player;
    const k = rt.keys;

    let ix = (k.has("right") ? 1 : 0) - (k.has("left") ? 1 : 0) + rt.joy.x;
    let iz = (k.has("back") ? 1 : 0) - (k.has("forward") ? 1 : 0) + rt.joy.y;
    const len = Math.hypot(ix, iz);
    if (len > 1) {
      ix /= len;
      iz /= len;
    }
    if (rt.paused) {
      ix = 0;
      iz = 0;
      rt.jumpQueued = false;
    }

    // camera-relative directions
    const yaw = rt.cam.yaw;
    const fx = -Math.sin(yaw);
    const fz = -Math.cos(yaw);
    const rx = Math.cos(yaw);
    const rz = -Math.sin(yaw);
    const mx = rx * ix + fx * -iz;
    const mz = rz * ix + fz * -iz;
    const top = rt.sprint || k.has("sprint") ? RUN : WALK;

    vel.current.x += (mx * top - vel.current.x) * Math.min(1, dt * 10);
    vel.current.z += (mz * top - vel.current.z) * Math.min(1, dt * 10);

    let nx = p.x + vel.current.x * dt;
    let nz = p.z + vel.current.z * dt;

    // collide against building footprints (push out along the shallow axis)
    for (const b of plan.colliders) {
      const hw = b.w / 2 + RADIUS;
      const hd = b.d / 2 + RADIUS;
      const dx = nx - b.x;
      const dz = nz - b.z;
      if (Math.abs(dx) < hw && Math.abs(dz) < hd && p.y < 6) {
        const px = hw - Math.abs(dx);
        const pz = hd - Math.abs(dz);
        if (px < pz) nx += Math.sign(dx || 1) * px;
        else nz += Math.sign(dz || 1) * pz;
      }
    }
    // cars are solid too
    for (const c of rt.cars) {
      if (!c.hw) continue;
      const hw = c.hw + RADIUS;
      const hd = c.hd + RADIUS;
      const dx = nx - c.x;
      const dz = nz - c.z;
      if (Math.abs(dx) < hw && Math.abs(dz) < hd && p.y < 1.8) {
        const px = hw - Math.abs(dx);
        const pz = hd - Math.abs(dz);
        if (px < pz) {
          nx += Math.sign(dx || 1) * px;
          vel.current.x = 0;
        } else {
          nz += Math.sign(dz || 1) * pz;
          vel.current.z = 0;
        }
      }
    }
    p.x = Math.max(-HALF_MAP, Math.min(HALF_MAP, nx));
    p.z = Math.max(-HALF_MAP, Math.min(HALF_MAP, nz));

    if (rt.jumpQueued && !p.airborne) {
      p.vy = JUMP;
      p.airborne = true;
    }
    rt.jumpQueued = false;
    p.vy -= GRAVITY * dt;
    p.y += p.vy * dt;
    if (p.y <= 0) {
      p.y = 0;
      p.vy = 0;
      p.airborne = false;
    }

    const groundSpeed = Math.hypot(vel.current.x, vel.current.z);
    p.speed = groundSpeed;
    speed.current = groundSpeed;
    air.current = p.airborne;
    if (groundSpeed > 0.3) {
      const target = Math.atan2(vel.current.x, vel.current.z);
      let diff = target - p.heading;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      p.heading += diff * Math.min(1, dt * 12);
    }

    const g = group.current;
    if (g) {
      g.position.set(p.x, 0.2 + p.y, p.z);
      g.rotation.y = p.heading;
    }

    if (rt.paused) return;

    // ---- pickups & triggers ----
    const chest = p.y + 1;
    for (const b of plan.bits) {
      if (rt.bits.has(b.id)) continue;
      if (Math.abs(b.x - p.x) < 1.2 && Math.abs(b.z - p.z) < 1.2 && Math.abs(b.y - chest) < 1.5) {
        rt.bits.add(b.id);
        rt.events.onBit(b.id);
      }
    }
    for (const o of plan.orbs) {
      if (rt.taken.has(o.id)) continue;
      if (Math.hypot(o.x - p.x, o.z - p.z) < 1.6) {
        rt.taken.add(o.id);
        rt.events.onOrb(o.id);
      }
    }
    for (const m of plan.monuments) {
      if (rt.taken.has(m.id)) continue;
      if (Math.hypot(m.x - p.x, m.z - p.z) < 4) {
        rt.taken.add(m.id);
        rt.events.onMonument(m.id);
      }
    }

    let near = null;
    for (const s of plan.stations) {
      if (!interactiveKinds.has(s.kind)) continue;
      if (Math.hypot(s.x - p.x, s.z - p.z) < 3.4) near = s;
    }
    if (near !== rt.near) {
      rt.near = near;
      rt.events.onNear(near);
    }

    districtTick.current -= dt;
    if (districtTick.current <= 0) {
      districtTick.current = 0.3;
      const d = districtAt(plan, p.x, p.z);
      if (d !== rt.district) {
        rt.district = d;
        rt.events.onDistrict(d);
      }
    }
  });

  return (
    <group ref={group}>
      <Avatar look={look} speed={speed} airborne={air} />
      {/* soft personal light so the character always reads */}
      {light ? <pointLight position={[0, 3, 1.5]} intensity={6} distance={8} color="#bfeee4" /> : null}
    </group>
  );
}

const camTarget = new Vector3();
const camPos = new Vector3();

export function CameraRig({ plan }: { plan: CityPlan }) {
  const rt = useRuntime();
  const { camera } = useThree();
  const look = useRef(new Vector3(0, 1.6, 9));
  const first = useRef(true);
  const reach = useRef(1);
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const p = rt.player;
    const { yaw, dist, pitch } = rt.cam;
    camTarget.set(p.x, 2.6 + p.y * 0.4, p.z);
    camPos.set(
      p.x + Math.sin(yaw) * Math.cos(pitch) * dist,
      2.6 + Math.sin(pitch) * dist,
      p.z + Math.cos(yaw) * Math.cos(pitch) * dist,
    );
    // pull the camera in when a building sits between it and the player
    let hit = 1;
    for (let t = 0.12; t <= 1; t += 0.04) {
      const x = camTarget.x + (camPos.x - camTarget.x) * t;
      const y = camTarget.y + (camPos.y - camTarget.y) * t;
      const z = camTarget.z + (camPos.z - camTarget.z) * t;
      let blocked = false;
      for (const b of plan.colliders) {
        if (y < b.h + 0.8 && Math.abs(x - b.x) < b.w / 2 + 0.6 && Math.abs(z - b.z) < b.d / 2 + 0.6) {
          blocked = true;
          break;
        }
      }
      if (blocked) {
        hit = Math.max(0.18, t - 0.06);
        break;
      }
    }
    reach.current += (hit - reach.current) * Math.min(1, dt * (hit < reach.current ? 14 : 2.5));
    camPos.lerpVectors(camTarget, camPos, reach.current);
    if (first.current) {
      camera.position.copy(camPos);
      look.current.copy(camTarget);
      first.current = false;
    }
    camera.position.lerp(camPos, Math.min(1, dt * 5));
    look.current.lerp(camTarget, Math.min(1, dt * 8));
    camera.lookAt(look.current);
  });
  return null;
}

export function SunLight({ shadows = true }: { shadows?: boolean }) {
  const rt = useRuntime();
  const night = useNight();
  const ref = useRef<DirectionalLight>(null);
  useFrame(() => {
    const l = ref.current;
    if (!l) return;
    const p = rt.player;
    l.position.set(p.x + 30, 60, p.z + 22);
    l.target.position.set(p.x, 0, p.z);
    l.target.updateMatrixWorld();
  });
  return (
    <directionalLight
      ref={ref}
      castShadow={shadows}
      intensity={night ? 1.3 : 2.4}
      color={night ? "#b4c6ff" : "#fff3e0"}
      shadow-mapSize={[1024, 1024]}
      shadow-camera-left={-38}
      shadow-camera-right={38}
      shadow-camera-top={38}
      shadow-camera-bottom={-38}
      shadow-camera-near={1}
      shadow-camera-far={160}
      shadow-bias={-0.0004}
      shadow-normalBias={0.04}
    />
  );
}
