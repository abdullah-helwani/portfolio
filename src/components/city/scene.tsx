"use client";

import { memo, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor, Stars } from "@react-three/drei";
import { Bloom, EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import type { Content } from "@/lib/site";
import type { AvatarLook } from "./avatar";
import { Billboards, TrafficLights } from "./extras";
import { Guide } from "./guide";
import { Landmarks } from "./landmarks";
import type { CityPlan } from "./layout";
import { Bits, Citizens, Traffic } from "./life";
import { Places } from "./places";
import { CameraRig, Player, SunLight } from "./player";
import { Ground, LampLights, Lamps, NightContext, Trees } from "./props";
import { RuntimeContext, type Runtime } from "./runtime";
import { Benches, Island, ParkingLots, PlazaDisc, Ponds } from "./terrain";
import { MergedTowers } from "./towers";

export type Quality = "high" | "balanced" | "low";
export const qualityOrder: Quality[] = ["low", "balanced", "high"];

type SceneProps = {
  plan: CityPlan;
  content: Content;
  look: AvatarLook;
  seen: Set<string>;
  runtime: Runtime;
  night: boolean;
  quality: Quality;
  guideMet: boolean;
  onReady: () => void;
  onSlow: () => void;
};

function World({ plan, content, look, seen, runtime, quality, night, guideMet }: Omit<SceneProps, "onReady" | "onSlow">) {
  return (
    <>
      <Island />
      <Ground plan={plan} />
      <PlazaDisc />
      <Ponds plan={plan} />
      <ParkingLots plan={plan} />
      <Benches plan={plan} />
      <Lamps plan={plan} />
      <LampLights plan={plan} player={{ current: runtime.player }} count={quality === "high" ? 3 : 0} />
      <Trees plan={plan} />
      <MergedTowers plan={plan} />
      <Landmarks plan={plan} content={content} seen={seen} />
      <Places plan={plan} seen={seen} />
      <Billboards plan={plan} />
      <TrafficLights />
      <Traffic plan={plan} />
      <Citizens plan={plan} />
      <Bits plan={plan} />
      {plan.guide ? <Guide guide={content.city.guide} at={plan.guide} met={guideMet} /> : null}
      <Player plan={plan} look={look} light={night && quality !== "low"} />
    </>
  );
}

function CityScene({ plan, content, look, seen, runtime, night, quality, guideMet, onReady, onSlow }: SceneProps) {
  const sky = night ? "#0b1420" : "#9cc7d6";
  const fog = night ? "#101b26" : "#b7d3db";
  const low = quality === "low";
  return (
    <Canvas
      shadows={quality === "high"}
      dpr={quality === "high" ? [1, 1.5] : quality === "balanced" ? [1, 1.25] : [0.7, 1]}
      camera={{ fov: 50, near: 0.5, far: 520, position: [0, 14, 30] }}
      gl={{ antialias: quality !== "high", powerPreference: "high-performance", stencil: false }}
      onCreated={({ gl }) => {
        // expose the renderer in development so draw calls can be inspected from the console
        if (process.env.NODE_ENV !== "production") (window as unknown as { __gl?: unknown }).__gl = gl;
        onReady();
      }}
    >
      <PerformanceMonitor onDecline={onSlow} flipflops={1} />
      <RuntimeContext.Provider value={runtime}>
        <NightContext.Provider value={night}>
          <color attach="background" args={[sky]} />
          <fog attach="fog" args={[fog, low ? 70 : 110, low ? 230 : 380]} />
          <hemisphereLight args={[night ? "#6d8fb8" : "#cfe8ff", night ? "#1a2026" : "#5a6a5a", night ? 1.25 : 1.2]} />
          <ambientLight intensity={night ? 0.45 : 0.35} />
          <SunLight shadows={quality === "high"} />
          {night ? <Stars radius={240} depth={40} count={low ? 800 : 2000} factor={5} saturation={0} fade speed={0.6} /> : null}
          <Suspense fallback={null}>
            <World plan={plan} content={content} look={look} seen={seen} runtime={runtime} quality={quality} night={night} guideMet={guideMet} />
          </Suspense>
          <CameraRig plan={plan} />
          {quality === "high" ? (
            <EffectComposer multisampling={2}>
              <Bloom mipmapBlur intensity={night ? 0.85 : 0.3} luminanceThreshold={night ? 0.72 : 0.92} luminanceSmoothing={0.25} radius={0.7} />
              <Vignette offset={0.28} darkness={night ? 0.7 : 0.45} />
              <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            </EffectComposer>
          ) : quality === "balanced" ? (
            <EffectComposer multisampling={0} resolutionScale={0.5}>
              <Bloom mipmapBlur intensity={night ? 0.7 : 0.25} luminanceThreshold={night ? 0.75 : 0.93} luminanceSmoothing={0.25} radius={0.6} />
              <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            </EffectComposer>
          ) : null}
          <AdaptiveDpr pixelated={false} />
        </NightContext.Provider>
      </RuntimeContext.Provider>
    </Canvas>
  );
}

export default memo(CityScene);
