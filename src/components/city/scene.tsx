"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, Stars } from "@react-three/drei";
import { Bloom, EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import type { Content } from "@/lib/site";
import type { AvatarLook } from "./avatar";
import { Billboards, TrafficLights } from "./extras";
import { Landmarks } from "./landmarks";
import type { CityPlan } from "./layout";
import { Bits, Citizens, Traffic } from "./life";
import { CameraRig, Player, SunLight } from "./player";
import { Ground, LampLights, Lamps, NightContext, Towers, Trees } from "./props";
import { RuntimeContext, type Runtime } from "./runtime";

export type Quality = "high" | "low";

function World({ plan, content, look, seen, runtime }: { plan: CityPlan; content: Content; look: AvatarLook; seen: Set<string>; runtime: Runtime }) {
  return (
    <>
      <Ground plan={plan} />
      <Lamps plan={plan} />
      <LampLights plan={plan} player={{ current: runtime.player }} />
      <Trees plan={plan} />
      <Towers plan={plan} />
      <Landmarks plan={plan} content={content} seen={seen} />
      <Billboards plan={plan} />
      <TrafficLights />
      <Traffic plan={plan} />
      <Citizens plan={plan} />
      <Bits plan={plan} />
      <Player plan={plan} look={look} />
    </>
  );
}

export default function CityScene({
  plan,
  content,
  look,
  seen,
  runtime,
  night,
  quality,
  onReady,
}: {
  plan: CityPlan;
  content: Content;
  look: AvatarLook;
  seen: Set<string>;
  runtime: Runtime;
  night: boolean;
  quality: Quality;
  onReady: () => void;
}) {
  const sky = night ? "#0b1420" : "#9cc7d6";
  const fog = night ? "#101b26" : "#b7d3db";
  return (
    <Canvas
      shadows={quality === "high"}
      dpr={quality === "high" ? [1, 1.75] : [0.75, 1]}
      camera={{ fov: 50, near: 0.5, far: 420, position: [0, 14, 30] }}
      gl={{ antialias: quality === "low", powerPreference: "high-performance" }}
      onCreated={() => onReady()}
    >
      <RuntimeContext.Provider value={runtime}>
        <NightContext.Provider value={night}>
          <color attach="background" args={[sky]} />
          <fog attach="fog" args={[fog, 90, 260]} />
          <hemisphereLight args={[night ? "#6d8fb8" : "#cfe8ff", night ? "#1a2026" : "#5a6a5a", night ? 1.25 : 1.2]} />
          <ambientLight intensity={night ? 0.45 : 0.35} />
          <SunLight />
          {night ? <Stars radius={180} depth={40} count={2500} factor={5} saturation={0} fade speed={0.6} /> : null}
          <Suspense fallback={null}>
            <World plan={plan} content={content} look={look} seen={seen} runtime={runtime} />
          </Suspense>
          <CameraRig plan={plan} />
          {quality === "high" ? (
            <EffectComposer multisampling={4}>
              <Bloom mipmapBlur intensity={night ? 0.85 : 0.3} luminanceThreshold={night ? 0.72 : 0.92} luminanceSmoothing={0.25} radius={0.7} />
              <Vignette offset={0.28} darkness={night ? 0.7 : 0.45} />
              <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            </EffectComposer>
          ) : null}
          <AdaptiveDpr pixelated={false} />
        </NightContext.Provider>
      </RuntimeContext.Provider>
    </Canvas>
  );
}
