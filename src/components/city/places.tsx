"use client";

import { Text } from "@react-three/drei";
import { TowerMesh, useNight } from "./props";
import { FONT, MONO, Neon, Pad, Window } from "./landmarks";
import type { CityPlan, PlaceBuilding } from "./layout";

function PlaceMesh({ b, seen }: { b: PlaceBuilding; seen: boolean }) {
  const night = useNight();
  const { place } = b;
  const color = place.color;
  const front = b.d / 2;
  if (place.kind === "tower") {
    return (
      <group>
        <TowerMesh t={{ x: b.x, z: b.z, w: b.w, d: b.d, h: b.h, variant: 1, tint: "#172024", antenna: b.h > 30 }} emissiveBoost={1.1} />
        <group position={[b.x, 0, b.z]}>
          <mesh position={[0, b.h + 0.5, 0]}>
            <boxGeometry args={[b.w + 0.4, 0.2, b.d + 0.4]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={night ? 2 : 0.4} toneMapped={false} />
          </mesh>
          <mesh position={[0, b.h - 2.2, front + 0.2]}>
            <boxGeometry args={[b.w - 0.8, 2.6, 0.25]} />
            <meshStandardMaterial color="#0b1012" roughness={0.4} />
          </mesh>
          <Neon text={place.name.toUpperCase()} color={color} size={Math.min(1.3, (b.w * 1.5) / Math.max(place.name.length, 6))} position={[0, b.h - 2.2, front + 0.36]} maxWidth={b.w - 1.4} />
          {/* elevator doors */}
          <mesh position={[0, 1.9, front + 0.05]}>
            <boxGeometry args={[3.4, 3.6, 0.1]} />
            <meshStandardMaterial color="#9aa6a4" metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[0, 1.9, front + 0.11]}>
            <boxGeometry args={[0.05, 3.6, 0.02]} />
            <meshBasicMaterial color="#0b1012" />
          </mesh>
          <mesh position={[0, 4.05, front + 0.12]}>
            <planeGeometry args={[1.4, 0.45]} />
            <meshStandardMaterial color="#0b1012" emissive={color} emissiveIntensity={night ? 1.4 : 0.4} />
          </mesh>
          <Text font={MONO} fontSize={0.26} position={[0, 4.05, front + 0.14]} anchorX="center" anchorY="middle">
            {"▲ LIFT"}
            <meshBasicMaterial color="#0b1012" toneMapped={false} />
          </Text>
          <Pad position={[0, 0.23, front + 2.6]} color={color} active={seen} />
        </group>
      </group>
    );
  }
  if (place.kind === "shop") {
    return (
      <group position={[b.x, 0.2, b.z]}>
        <mesh position={[0, b.h / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial color="#2a3134" roughness={0.8} />
        </mesh>
        <mesh position={[0, b.h + 0.15, 0]}>
          <boxGeometry args={[b.w + 0.3, 0.3, b.d + 0.3]} />
          <meshStandardMaterial color="#1c2326" />
        </mesh>
        {/* awning */}
        <mesh position={[0, 3.9, front + 0.9]} rotation-x={0.35} castShadow>
          <boxGeometry args={[b.w - 1, 0.12, 2]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        {[-3.4, 3.4].map((x) => (
          <Window key={x} position={[x, 2.2, front + 0.01]} size={[2.6, 2.4]} />
        ))}
        {/* door */}
        <mesh position={[0, 1.5, front + 0.02]}>
          <planeGeometry args={[1.8, 3]} />
          <meshStandardMaterial color="#3b2a22" roughness={0.7} />
        </mesh>
        <mesh position={[0.6, 1.5, front + 0.05]}>
          <sphereGeometry args={[0.08, 8, 6]} />
          <meshStandardMaterial color="#f6c177" metalness={0.9} roughness={0.2} />
        </mesh>
        <Neon text={place.name.toUpperCase()} color={color} size={Math.min(0.9, (b.w * 1.4) / Math.max(place.name.length, 6))} position={[0, b.h - 1.2, front + 0.06]} maxWidth={b.w - 1} />
        <Pad position={[0, 0.03, front + 2.6]} color={color} active={seen} />
      </group>
    );
  }
  return (
    <group position={[b.x, 0.2, b.z]}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[b.w, 2.2, b.d]} />
        <meshStandardMaterial color="#20282b" roughness={0.6} />
      </mesh>
      <mesh position={[0, 2.5, 0]} castShadow>
        <boxGeometry args={[b.w + 0.8, 0.2, b.d + 0.8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={night ? 1.4 : 0.3} toneMapped={false} />
      </mesh>
      <mesh position={[0, 1.4, front + 0.02]}>
        <planeGeometry args={[b.w - 0.6, 1.2]} />
        <meshStandardMaterial color="#0b1416" emissive={color} emissiveIntensity={night ? 0.9 : 0.2} />
      </mesh>
      <Text font={FONT} fontSize={0.34} position={[0, 1.4, front + 0.04]} anchorX="center" anchorY="middle" maxWidth={b.w - 0.8} textAlign="center">
        {place.name}
        <meshBasicMaterial color="#e8eeec" toneMapped={false} />
      </Text>
      <Pad position={[0, 0.03, front + 2.6]} color={color} active={seen} />
    </group>
  );
}

export function Places({ plan, seen }: { plan: CityPlan; seen: Set<string> }) {
  return (
    <group>
      {plan.places.map((b) => (
        <PlaceMesh key={b.place.id} b={b} seen={seen.has(`place-${b.place.id}`)} />
      ))}
    </group>
  );
}
