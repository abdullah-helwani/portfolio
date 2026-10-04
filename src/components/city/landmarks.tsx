"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import { Shape, type Group, type Mesh, type MeshStandardMaterial } from "three";
import type { Content } from "@/lib/site";
import type { CityPlan, Monument, Orb, ProjectTower } from "./layout";
import { Bench, TowerMesh, useNight } from "./props";

export const FONT = "/fonts/Geist-SemiBold.ttf";
export const MONO = "/fonts/GeistMono-Medium.ttf";

function Neon({ text, color, size, position, rotation, flicker = false, maxWidth }: { text: string; color: string; size: number; position: [number, number, number]; rotation?: [number, number, number]; flicker?: boolean; maxWidth?: number }) {
  const night = useNight();
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (!flicker || !ref.current) return;
    const t = clock.elapsedTime;
    const off = Math.sin(t * 13) > 0.97 || (t % 7 > 6.7 && Math.sin(t * 40) > 0);
    (ref.current.material as MeshStandardMaterial).emissiveIntensity = off ? 0.3 : night ? 2.6 : 0.6;
  });
  return (
    <Text ref={ref} font={FONT} fontSize={size} position={position} rotation={rotation} anchorX="center" anchorY="middle" maxWidth={maxWidth} textAlign="center" letterSpacing={-0.02}>
      {text}
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={night ? 2.6 : 0.6} toneMapped={false} />
    </Text>
  );
}

function Prism({ width, height, depth, color, position }: { width: number; height: number; depth: number; color: string; position: [number, number, number] }) {
  const shape = useMemo(() => {
    const s = new Shape();
    s.moveTo(-width / 2, 0);
    s.lineTo(width / 2, 0);
    s.lineTo(0, height);
    s.closePath();
    return s;
  }, [width, height]);
  return (
    <mesh position={[position[0], position[1], position[2] - depth / 2]} castShadow>
      <extrudeGeometry args={[shape, { depth, bevelEnabled: false }]} />
      <meshStandardMaterial color={color} roughness={0.8} flatShading />
    </mesh>
  );
}

function Window({ position, size, warm = true }: { position: [number, number, number]; size: [number, number]; warm?: boolean }) {
  const night = useNight();
  return (
    <mesh position={position}>
      <planeGeometry args={size} />
      <meshStandardMaterial color={night ? "#ffd59a" : "#9fc6cf"} emissive={warm ? "#ffc27a" : "#9ff0e0"} emissiveIntensity={night ? 1.6 : 0.05} toneMapped={!night} />
    </mesh>
  );
}

function Pad({ position, color, active }: { position: [number, number, number]; color: string; active: boolean }) {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const s = 1 + Math.sin(clock.elapsedTime * 3) * 0.06;
    ref.current.scale.set(s, s, 1);
  });
  return (
    <mesh ref={ref} position={position} rotation-x={-Math.PI / 2}>
      <ringGeometry args={[1.3, 1.6, 40]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 0.8 : 2.4} toneMapped={false} transparent opacity={active ? 0.5 : 0.95} />
    </mesh>
  );
}

// ---------------------------------------------------------------- Plaza

export function Plaza({ name, tagline }: { name: string; tagline: string }) {
  const night = useNight();
  const ring = useRef<Group>(null);
  const water = useRef<Mesh>(null);
  useFrame(({ clock }, dt) => {
    if (ring.current) ring.current.rotation.y += dt * 0.4;
    if (water.current) water.current.scale.y = 1 + Math.sin(clock.elapsedTime * 4) * 0.08;
  });
  return (
    <group>
      <mesh position={[0, 0.22, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[12.5, 48]} />
        <meshStandardMaterial color={night ? "#2b3335" : "#b9c0bc"} roughness={0.8} />
      </mesh>
      {[5, 9, 12.3].map((r, i) => (
        <mesh key={r} position={[0, 0.23, 0]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[r, r + (i === 2 ? 0.08 : 0.05), 96]} />
          <meshStandardMaterial color="#5fd6c0" emissive="#5fd6c0" emissiveIntensity={night ? 0.7 : 0.15} />
        </mesh>
      ))}
      {/* fountain */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[3.3, 3.5, 0.8, 32]} />
        <meshStandardMaterial color="#59656a" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.98, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[3.05, 32]} />
        <meshStandardMaterial color="#1f6f73" emissive="#2fa59a" emissiveIntensity={night ? 0.7 : 0.1} roughness={0.15} metalness={0.3} />
      </mesh>
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.5, 1.8, 12]} />
        <meshStandardMaterial color="#6d797e" roughness={0.6} />
      </mesh>
      <mesh ref={water} position={[0, 2.8, 0]}>
        <sphereGeometry args={[0.7, 16, 12]} />
        <meshStandardMaterial color="#bdf6ea" emissive="#5fd6c0" emissiveIntensity={night ? 0.6 : 0.15} transparent opacity={0.45} />
      </mesh>
      {/* hologram */}
      <group position={[0, 6.2, 0]}>
        <group ref={ring}>
          {[0, 1].map((i) => (
            <mesh key={i} rotation-x={Math.PI / 2 + i * 0.4}>
              <torusGeometry args={[3.6 - i * 0.6, 0.035, 8, 96]} />
              <meshStandardMaterial color="#5fd6c0" emissive="#5fd6c0" emissiveIntensity={1.4} toneMapped={false} />
            </mesh>
          ))}
        </group>
        <Billboard>
          <Text font={FONT} fontSize={1.25} anchorX="center" anchorY="bottom" letterSpacing={-0.04} position={[0, 0.2, 0]}>
            {name.toUpperCase()}
            <meshStandardMaterial color="#e8eeec" emissive="#9ff0e0" emissiveIntensity={night ? 1.5 : 0.4} toneMapped={false} />
          </Text>
          <Text font={MONO} fontSize={0.42} anchorX="center" anchorY="top" letterSpacing={0.18} position={[0, -0.1, 0]}>
            {tagline.toUpperCase()}
            <meshStandardMaterial color="#5fd6c0" emissive="#5fd6c0" emissiveIntensity={1.6} toneMapped={false} />
          </Text>
        </Billboard>
      </group>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return <Bench key={i} position={[Math.cos(a) * 7.2, 0.2, Math.sin(a) * 7.2]} rotation={-a - Math.PI / 2} />;
      })}
    </group>
  );
}

// ---------------------------------------------------------------- About house

export function AboutHouse({ seen }: { seen: boolean }) {
  return (
    <group position={[-40, 0.2, -3]}>
      <mesh position={[0, 3.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[14, 7.2, 10]} />
        <meshStandardMaterial color="#d6cbb8" roughness={0.85} />
      </mesh>
      <Prism width={15.6} height={4.6} depth={11} color="#9b4a2a" position={[0, 7.2, 0]} />
      <mesh position={[4, 10, -1]} castShadow>
        <boxGeometry args={[1.4, 3, 1.4]} />
        <meshStandardMaterial color="#7a3c24" roughness={0.9} />
      </mesh>
      {[-4.6, 4.6].map((x) =>
        [2.2, 5.4].map((y) => <Window key={`${x}${y}`} position={[x, y, 5.01]} size={[2.2, 1.8]} />),
      )}
      <Window position={[0, 5.4, 5.01]} size={[2.2, 1.8]} />
      <mesh position={[0, 1.4, 5.05]}>
        <boxGeometry args={[2, 2.8, 0.1]} />
        <meshStandardMaterial color="#4a3526" roughness={0.8} />
      </mesh>
      <mesh position={[0, 3.2, 5.6]} castShadow>
        <boxGeometry args={[3.4, 0.2, 1.4]} />
        <meshStandardMaterial color="#7a3c24" />
      </mesh>
      <Neon text="ABOUT ME" color="#f0773f" size={0.9} position={[0, 7.9, 5.2]} />
      {/* fence */}
      {Array.from({ length: 13 }).map((_, i) => (
        <mesh key={i} position={[-12 + i * 2, 0.45, 9.5]} castShadow>
          <boxGeometry args={[0.15, 0.9, 0.15]} />
          <meshStandardMaterial color="#e8e0d0" />
        </mesh>
      ))}
      <mesh position={[-7, 0.7, 9.5]}>
        <boxGeometry args={[10, 0.12, 0.08]} />
        <meshStandardMaterial color="#e8e0d0" />
      </mesh>
      <mesh position={[7, 0.7, 9.5]}>
        <boxGeometry args={[10, 0.12, 0.08]} />
        <meshStandardMaterial color="#e8e0d0" />
      </mesh>
      <Pad position={[0, 0.03, 7]} color="#f0773f" active={seen} />
    </group>
  );
}

// ---------------------------------------------------------------- Academy + orbs

function OrbMesh({ orb, taken }: { orb: Orb; taken: boolean }) {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = 2.1 + Math.sin(clock.elapsedTime * 2 + orb.x) * 0.18;
    ref.current.rotation.y += 0.01;
  });
  return (
    <group position={[orb.x, 0.2, orb.z]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.7, 1, 8]} />
        <meshStandardMaterial color="#3a4448" roughness={0.6} />
      </mesh>
      <mesh ref={ref} position={[0, 2.1, 0]}>
        <icosahedronGeometry args={[taken ? 0.35 : 0.6, 1]} />
        <meshStandardMaterial color={orb.color} emissive={orb.color} emissiveIntensity={taken ? 0.4 : 3} toneMapped={false} flatShading />
      </mesh>
      <Billboard position={[0, 3.3, 0]}>
        <Text font={MONO} fontSize={0.32} anchorX="center" letterSpacing={0.08}>
          {`${orb.skill.name.toUpperCase()} · LV ${orb.skill.level}`}
          <meshBasicMaterial color={taken ? "#8b9794" : "#e8eeec"} toneMapped={false} />
        </Text>
      </Billboard>
    </group>
  );
}

export function Academy({ orbs, taken }: { orbs: Orb[]; taken: Set<string> }) {
  const night = useNight();
  return (
    <group>
      <group position={[40, 0.2, -9]}>
        <mesh position={[0, 0.4, 0]} receiveShadow>
          <boxGeometry args={[20, 0.8, 11]} />
          <meshStandardMaterial color="#b8b4ab" roughness={0.8} />
        </mesh>
        <mesh position={[0, 4.4, -0.8]} castShadow receiveShadow>
          <boxGeometry args={[18, 7.2, 8]} />
          <meshStandardMaterial color="#e4dfd4" roughness={0.75} />
        </mesh>
        {Array.from({ length: 7 }).map((_, i) => (
          <mesh key={i} position={[-7.5 + i * 2.5, 4.4, 4]} castShadow>
            <cylinderGeometry args={[0.45, 0.5, 7.2, 12]} />
            <meshStandardMaterial color="#f1ece2" roughness={0.6} />
          </mesh>
        ))}
        <Prism width={19} height={3} depth={9.4} color="#d8d2c6" position={[0, 8, 0]} />
        <mesh position={[0, 11, -0.8]} castShadow>
          <sphereGeometry args={[3, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#6f86b8" roughness={0.35} metalness={0.4} />
        </mesh>
        <Window position={[0, 3, 3.21]} size={[14, 4.5]} warm={false} />
        <Neon text="SKILL ACADEMY" color="#a9b8ff" size={1} position={[0, 9.3, 4.75]} />
      </group>
      {/* courtyard ring */}
      <mesh position={[40, 0.22, 3]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[7.2, 7.4, 64]} />
        <meshStandardMaterial color="#a9b8ff" emissive="#a9b8ff" emissiveIntensity={night ? 1.5 : 0.2} toneMapped={false} />
      </mesh>
      {orbs.map((o) => (
        <OrbMesh key={o.id} orb={o} taken={taken.has(o.id)} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------- Project towers

export function ProjectTowerMesh({ tower, seen }: { tower: ProjectTower; seen: boolean }) {
  const night = useNight();
  const title = tower.project.title.toUpperCase();
  const size = Math.min(1.6, (tower.w * 1.6) / Math.max(title.length, 6));
  return (
    <group>
      <TowerMesh t={tower} emissiveBoost={1.1} />
      <group position={[tower.x, 0, tower.z]}>
        {/* neon edges */}
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * (tower.w / 2 + 0.06), tower.h / 2 + 0.2, tower.d / 2 + 0.06]}>
            <boxGeometry args={[0.14, tower.h, 0.14]} />
            <meshStandardMaterial color={tower.color} emissive={tower.color} emissiveIntensity={night ? 2.4 : 0.5} toneMapped={false} />
          </mesh>
        ))}
        <mesh position={[0, tower.h + 0.55, 0]}>
          <boxGeometry args={[tower.w + 0.5, 0.25, tower.d + 0.5]} />
          <meshStandardMaterial color={tower.color} emissive={tower.color} emissiveIntensity={night ? 2 : 0.4} toneMapped={false} />
        </mesh>
        {/* sign board */}
        <mesh position={[0, tower.h - 2.4, tower.d / 2 + 0.25]}>
          <boxGeometry args={[tower.w - 1, 3, 0.3]} />
          <meshStandardMaterial color="#0b1012" roughness={0.4} />
        </mesh>
        <Neon text={title} color={tower.color} size={size} position={[0, tower.h - 2.3, tower.d / 2 + 0.42]} maxWidth={tower.w - 1.6} />
        <Text font={MONO} fontSize={0.36} position={[0, tower.h - 3.5, tower.d / 2 + 0.42]} anchorX="center" letterSpacing={0.16}>
          {`${tower.project.year} · ${tower.project.tags.slice(0, 3).join(" · ").toUpperCase()}`}
          <meshBasicMaterial color="#e8eeec" toneMapped={false} />
        </Text>
        {/* entrance */}
        <mesh position={[0, 3.6, tower.d / 2 + 1.4]} castShadow>
          <boxGeometry args={[5.4, 0.3, 2.8]} />
          <meshStandardMaterial color="#20282b" roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.8, tower.d / 2 + 0.03]}>
          <planeGeometry args={[3.2, 3.2]} />
          <meshStandardMaterial color="#0b1416" emissive={tower.color} emissiveIntensity={night ? 0.9 : 0.15} />
        </mesh>
        <Pad position={[0, 0.23, tower.d / 2 + 3]} color={tower.color} active={seen} />
        {/* street-level display */}
        <group position={[-5, 0.2, tower.d / 2 + 3.6]} rotation-y={0.3} scale={1.35}>
          <mesh position={[0, 0.7, 0]} castShadow>
            <boxGeometry args={[0.18, 1.4, 0.18]} />
            <meshStandardMaterial color="#2b3337" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[0, 2.3, 0]} castShadow>
            <boxGeometry args={[3.8, 2, 0.16]} />
            <meshStandardMaterial color="#0b1012" roughness={0.3} metalness={0.3} />
          </mesh>
          <mesh position={[-1.75, 2.3, 0.09]}>
            <planeGeometry args={[0.06, 1.7]} />
            <meshStandardMaterial color={tower.color} emissive={tower.color} emissiveIntensity={2} toneMapped={false} />
          </mesh>
          <Text font={FONT} fontSize={0.34} position={[-1.5, 2.85, 0.1]} anchorX="left" anchorY="top" maxWidth={3.2} lineHeight={1.05}>
            {tower.project.title}
            <meshBasicMaterial color="#e8eeec" toneMapped={false} />
          </Text>
          <Text font={MONO} fontSize={0.15} position={[-1.5, 1.95, 0.1]} anchorX="left" anchorY="top" maxWidth={3.2} letterSpacing={0.08}>
            {tower.project.kicker.toUpperCase()}
            <meshBasicMaterial color={tower.color} toneMapped={false} />
          </Text>
          <Text font={MONO} fontSize={0.13} position={[-1.5, 1.55, 0.1]} anchorX="left" anchorY="top" letterSpacing={0.18}>
            {"STEP ON THE PAD · PRESS E"}
            <meshBasicMaterial color="#8b9794" toneMapped={false} />
          </Text>
        </group>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------- Journey park

function MonumentMesh({ m, seen }: { m: Monument; seen: boolean }) {
  const night = useNight();
  return (
    <group position={[m.x, 0.2, m.z]}>
      <mesh position={[0, 1.3, 0]} castShadow>
        <boxGeometry args={[1.2, 2.6, 1.2]} />
        <meshStandardMaterial color="#7e8a86" roughness={0.7} flatShading />
      </mesh>
      <mesh position={[0, 0.04, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[1.2, 1.45, 32]} />
        <meshStandardMaterial color="#8fd16b" emissive="#8fd16b" emissiveIntensity={seen ? 0.4 : night ? 2.4 : 0.6} toneMapped={false} />
      </mesh>
      <Billboard position={[0, 3.6, 0]}>
        <Text font={MONO} fontSize={0.3} anchorX="center" anchorY="bottom" letterSpacing={0.14} position={[0, 0.5, 0]}>
          {m.milestone.date.toUpperCase()}
          <meshBasicMaterial color="#8fd16b" toneMapped={false} />
        </Text>
        <Text font={FONT} fontSize={0.48} anchorX="center" anchorY="bottom" maxWidth={6} textAlign="center" position={[0, 0, 0]}>
          {m.milestone.title}
          <meshBasicMaterial color="#e8eeec" toneMapped={false} />
        </Text>
      </Billboard>
    </group>
  );
}

export function Park({ monuments, seen }: { monuments: Monument[]; seen: Set<string> }) {
  const night = useNight();
  const path = useMemo(() => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      pts.push([Math.sin(t * Math.PI * 1.6) * 8, 40 - 13 + t * 26]);
    }
    return pts;
  }, []);
  return (
    <group>
      {path.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.215, z]} rotation-x={-Math.PI / 2} receiveShadow>
          <circleGeometry args={[1.6, 12]} />
          <meshStandardMaterial color={night ? "#3a3a30" : "#c9b98f"} roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[-8, 0.22, 47]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[3.6, 32]} />
        <meshStandardMaterial color="#1c5a63" emissive="#2fa59a" emissiveIntensity={night ? 0.35 : 0.05} roughness={0.1} metalness={0.4} />
      </mesh>
      {monuments.map((m) => (
        <MonumentMesh key={m.id} m={m} seen={seen.has(m.id)} />
      ))}
      <Neon text="JOURNEY PARK" color="#8fd16b" size={0.8} position={[0, 3.2, 26.2]} />
      <mesh position={[-4.4, 1.6, 26.2]} castShadow>
        <boxGeometry args={[0.3, 3.2, 0.3]} />
        <meshStandardMaterial color="#3a4448" />
      </mesh>
      <mesh position={[4.4, 1.6, 26.2]} castShadow>
        <boxGeometry args={[0.3, 3.2, 0.3]} />
        <meshStandardMaterial color="#3a4448" />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------- Newsroom, Arcade, Post office

function Ticker({ text, chars, position, color }: { text: string; chars: number; position: [number, number, number]; color: string }) {
  const [offset, setOffset] = useState(0);
  const acc = useRef(0);
  const loop = `${text}   ///   `;
  useFrame((_, dt) => {
    acc.current += dt;
    if (acc.current > 0.14) {
      acc.current = 0;
      setOffset((o) => (o + 1) % loop.length);
    }
  });
  const visible = (loop + loop).slice(offset, offset + chars);
  return (
    <Text font={MONO} fontSize={0.42} anchorX="center" anchorY="middle" position={position}>
      {visible}
      <meshBasicMaterial color={color} toneMapped={false} />
    </Text>
  );
}

export function Newsroom({ content, seen }: { content: Content; seen: boolean }) {
  const night = useNight();
  const posts = content.posts.filter((p) => p.published).slice(0, 3);
  const statusColor = { shipped: "#5fd6c0", building: "#f6c177", planned: "#a9b8ff" } as const;
  return (
    <group position={[-40, 0.2, 37]}>
      <mesh position={[0, 4, 0]} castShadow receiveShadow>
        <boxGeometry args={[16, 8, 10]} />
        <meshStandardMaterial color="#2a2f33" roughness={0.7} />
      </mesh>
      <mesh position={[0, 5, 5.05]}>
        <planeGeometry args={[13, 5.2]} />
        <meshStandardMaterial color="#05090a" emissive="#0b1d1a" emissiveIntensity={night ? 1 : 0.3} />
      </mesh>
      <Neon text="DAILY LOG" color="#f6c177" size={0.9} position={[0, 8.9, 5.1]} />
      {posts.map((p, i) => (
        <group key={p.id} position={[-5.9, 6.7 - i * 1.15, 5.1]}>
          <mesh position={[0.2, 0, 0]}>
            <circleGeometry args={[0.15, 12]} />
            <meshBasicMaterial color={statusColor[p.status]} toneMapped={false} />
          </mesh>
          <Text font={FONT} fontSize={0.5} anchorX="left" anchorY="middle" position={[0.6, 0, 0]} maxWidth={11} whiteSpace="nowrap" clipRect={[0, -1, 11.4, 1]}>
            {p.title}
            <meshBasicMaterial color="#e8eeec" toneMapped={false} />
          </Text>
        </group>
      ))}
      <mesh position={[0, 2.9, 5.08]}>
        <planeGeometry args={[13, 0.8]} />
        <meshBasicMaterial color="#1a1406" />
      </mesh>
      <Ticker
        text={posts.map((p) => `${p.status.toUpperCase()}: ${p.title}`).join("   ///   ") || "NO NEWS IS GOOD NEWS"}
        chars={48}
        position={[0, 2.9, 5.12]}
        color="#f6c177"
      />
      <Pad position={[0, 0.03, 7.5]} color="#f6c177" active={seen} />
    </group>
  );
}

export function Arcade({ seen }: { seen: boolean }) {
  const night = useNight();
  const snake = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!snake.current) return;
    const step = Math.floor(clock.elapsedTime * 6);
    snake.current.children.forEach((c, i) => {
      c.position.x = (((step + i) % 16) - 8) * 0.5;
    });
  });
  return (
    <group position={[40, 0.2, 37]}>
      <mesh position={[0, 4.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[16, 9.2, 11]} />
        <meshStandardMaterial color="#251c3a" roughness={0.6} />
      </mesh>
      {[0.6, 8.6].map((y) => (
        <mesh key={y} position={[0, y, 5.56]}>
          <boxGeometry args={[16, 0.18, 0.1]} />
          <meshStandardMaterial color="#e58fb6" emissive="#e58fb6" emissiveIntensity={night ? 2.6 : 0.5} toneMapped={false} />
        </mesh>
      ))}
      <Neon text="ARCADE" color="#e58fb6" size={2} position={[0, 6.6, 5.6]} flicker />
      <group ref={snake} position={[0, 4.4, 5.6]}>
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={i}>
            <boxGeometry args={[0.42, 0.42, 0.1]} />
            <meshStandardMaterial color="#5fd6c0" emissive="#5fd6c0" emissiveIntensity={2} toneMapped={false} />
          </mesh>
        ))}
      </group>
      <mesh position={[3.4, 4.4, 5.6]}>
        <boxGeometry args={[0.42, 0.42, 0.1]} />
        <meshStandardMaterial color="#f0773f" emissive="#f0773f" emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
      <mesh position={[0, 1.6, 5.53]}>
        <planeGeometry args={[3.2, 3]} />
        <meshStandardMaterial color="#120a1f" emissive="#e58fb6" emissiveIntensity={night ? 0.6 : 0.1} />
      </mesh>
      <Pad position={[0, 0.03, 8]} color="#e58fb6" active={seen} />
    </group>
  );
}

export function PostOffice({ seen }: { seen: boolean }) {
  const night = useNight();
  const flag = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (flag.current) flag.current.rotation.y = Math.sin(clock.elapsedTime * 3) * 0.25;
  });
  return (
    <group position={[0, 0.2, 76]}>
      <mesh position={[0, 4, 0]} castShadow receiveShadow>
        <boxGeometry args={[16, 8, 10]} />
        <meshStandardMaterial color="#2f4d6b" roughness={0.7} />
      </mesh>
      <mesh position={[0, 8.2, 0]}>
        <boxGeometry args={[16.6, 0.4, 10.6]} />
        <meshStandardMaterial color="#e8eeec" />
      </mesh>
      {[-5, 5].map((x) => (
        <Window key={x} position={[x, 4, 5.01]} size={[3.4, 3]} />
      ))}
      <mesh position={[0, 1.6, 5.03]}>
        <planeGeometry args={[3, 3.2]} />
        <meshStandardMaterial color="#0b1416" emissive="#7cc7ff" emissiveIntensity={night ? 0.7 : 0.1} />
      </mesh>
      <Neon text="POST OFFICE" color="#7cc7ff" size={1.1} position={[0, 6.6, 5.1]} />
      {/* big mailbox */}
      <group position={[3.6, 0, 7.4]}>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[0.2, 1.2, 0.2]} />
          <meshStandardMaterial color="#2b3337" />
        </mesh>
        <mesh position={[0, 1.6, 0]} castShadow>
          <boxGeometry args={[1, 1, 1.4]} />
          <meshStandardMaterial color="#c94f4f" roughness={0.5} />
        </mesh>
        <mesh ref={flag} position={[0.6, 2.1, 0.2]}>
          <boxGeometry args={[0.06, 0.4, 0.6]} />
          <meshStandardMaterial color={seen ? "#5fd6c0" : "#f6c177"} emissive={seen ? "#5fd6c0" : "#f6c177"} emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
      </group>
      <Pad position={[0, 0.03, 8]} color="#7cc7ff" active={seen} />
    </group>
  );
}

export function Landmarks({ plan, content, seen }: { plan: CityPlan; content: Content; seen: Set<string> }) {
  return (
    <group>
      <Plaza name={content.profile.name} tagline={content.profile.tagline || content.profile.role} />
      <AboutHouse seen={seen.has("about")} />
      <Academy orbs={plan.orbs} taken={seen} />
      {plan.projectTowers.map((t) => (
        <ProjectTowerMesh key={t.project.id} tower={t} seen={seen.has(`kiosk-${t.project.id}`)} />
      ))}
      <Park monuments={plan.monuments} seen={seen} />
      <Newsroom content={content} seen={seen.has("log")} />
      <Arcade seen={seen.has("arcade")} />
      <PostOffice seen={seen.has("contact")} />
    </group>
  );
}
