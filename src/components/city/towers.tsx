"use client";
/* eslint-disable react-hooks/immutability -- shared materials are updated in place for day/night and the antenna blink. */

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { BoxGeometry, BufferAttribute, Color, CylinderGeometry, MeshStandardMaterial, SphereGeometry, type BufferGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { CityPlan, Tower } from "./layout";
import { useNight } from "./props";
import { facades, TILE } from "./textures";

// The whole downtown skyline in a handful of draw calls: one merged mesh per facade
// variant (UVs pre-scaled so windows tile per building, tint in vertex colours), one for
// roof clutter, one for antenna beacons.

function towerGeometry(t: Tower) {
  const g = new BoxGeometry(t.w, t.h, t.d);
  const uv = g.getAttribute("uv") as BufferAttribute;
  // face order: +x, -x, +y, -y, +z, -z (4 vertices each)
  for (let f = 0; f < 6; f++) {
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      if (f === 2 || f === 3) uv.setXY(i, 0.004, 0.004); // roof/floor: plain wall pixel
      else {
        const width = f < 2 ? t.d : t.w;
        uv.setXY(i, uv.getX(i) * (width / TILE), uv.getY(i) * (t.h / TILE));
      }
    }
  }
  const c = new Color(t.tint).multiplyScalar(5.2);
  const colors = new Float32Array(g.getAttribute("position").count * 3);
  for (let i = 0; i < colors.length; i += 3) {
    colors[i] = c.r;
    colors[i + 1] = c.g;
    colors[i + 2] = c.b;
  }
  g.setAttribute("color", new BufferAttribute(colors, 3));
  g.translate(t.x, (t.y0 ?? 0) + t.h / 2 + 0.2, t.z);
  return g;
}

function clutterGeometry(towers: Tower[]) {
  const parts: BufferGeometry[] = [];
  for (const t of towers) {
    const top = (t.y0 ?? 0) + t.h + 0.2;
    parts.push(new BoxGeometry(t.w + 0.3, 0.3, t.d + 0.3).translate(t.x, top + 0.1, t.z));
    if (t.w > 6) parts.push(new BoxGeometry(t.w * 0.3, 1.2, t.d * 0.3).translate(t.x + t.w * 0.2, top + 0.6, t.z - t.d * 0.15));
    if (t.antenna) parts.push(new CylinderGeometry(0.08, 0.12, 7, 5).translate(t.x - t.w * 0.2, top + 3.6, t.z + t.d * 0.1));
  }
  return parts.length ? mergeGeometries(parts.map((p) => p.toNonIndexed()), false) : null;
}

function beaconGeometry(towers: Tower[]) {
  const parts = towers.filter((t) => t.antenna).map((t) => new SphereGeometry(0.24, 8, 6).translate(t.x - t.w * 0.2, (t.y0 ?? 0) + t.h + 7.4, t.z + t.d * 0.1));
  return parts.length ? mergeGeometries(parts, false) : null;
}

export function MergedTowers({ plan }: { plan: CityPlan }) {
  const night = useNight();
  const built = useMemo(() => {
    const tex = facades();
    const byVariant = [0, 1, 2].map((v) => {
      const list = plan.towers.filter((t) => t.variant % 3 === v);
      if (!list.length) return null;
      const geometry = mergeGeometries(list.map(towerGeometry), false);
      const material = new MeshStandardMaterial({ vertexColors: true, map: tex[v].map, emissiveMap: tex[v].emissive, emissive: new Color("#ffffff"), emissiveIntensity: 1, roughness: 0.55, metalness: 0.25 });
      return geometry ? { geometry, material } : null;
    });
    const clutter = clutterGeometry(plan.towers);
    const beacons = beaconGeometry(plan.towers);
    return {
      byVariant,
      clutter,
      clutterMat: new MeshStandardMaterial({ color: "#2a3236", roughness: 0.8 }),
      beacons,
      beaconMat: new MeshStandardMaterial({ color: "#ff4d4d", emissive: "#ff3030", emissiveIntensity: 2, toneMapped: false }),
    };
  }, [plan.towers]);

  useEffect(() => {
    for (const v of built.byVariant) if (v) v.material.emissiveIntensity = night ? 1.5 : 0.08;
  }, [night, built]);

  useEffect(
    () => () => {
      built.byVariant.forEach((v) => {
        v?.geometry.dispose();
        v?.material.dispose();
      });
      built.clutter?.dispose();
      built.beacons?.dispose();
    },
    [built],
  );

  useFrame(({ clock }) => {
    built.beaconMat.emissiveIntensity = Math.sin(clock.elapsedTime * 3) > 0.55 ? 4 : 0.3;
  });

  return (
    <group>
      {built.byVariant.map((v, i) => (v ? <mesh key={i} geometry={v.geometry} material={v.material} castShadow receiveShadow /> : null))}
      {built.clutter ? <mesh geometry={built.clutter} material={built.clutterMat} castShadow /> : null}
      {built.beacons ? <mesh geometry={built.beacons} material={built.beaconMat} /> : null}
    </group>
  );
}
