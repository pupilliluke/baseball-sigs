import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, AdaptiveDpr, Html } from "@react-three/drei";
import * as THREE from "three";
import SpinningBall from "./SpinningBaseball";
import { useSigStore, LIGHTING_PRESETS } from "../../store/sigStore";

export default function Stage({ texture }) {
  const { currentPreset } = useSigStore();
  const preset = LIGHTING_PRESETS[currentPreset];

  return (
    // Give the stage a real, predictable height
    <div className="relative h-[52vh] sm:h-[62vh] lg:h-[66vh] min-h-[400px] sm:min-h-[500px] lg:min-h-[560px] rounded-3xl border overflow-hidden panel-elevated">
      {/* Product-shot backdrop: always dark so the lit ball carries the frame */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(115% 85% at 50% 18%, hsl(224 16% 20%) 0%, hsl(224 22% 7%) 78%)" }}
      />

      {/* Make Canvas fill the stage exactly */}
      <Canvas
        className="!absolute inset-0 h-full w-full"
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0.45, 3.1], fov: 42 }}
        // preserveDrawingBuffer keeps video capture reliable across browsers
        gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <ambientLight intensity={preset.ambientIntensity} />
        <directionalLight
          position={preset.directionalPosition}
          intensity={preset.directionalIntensity}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        {texture ? (
          <SpinningBall texture={texture} />
        ) : (
          <Html center>
            <div className="px-4 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-sm whitespace-nowrap">
              Generating texture…
            </div>
          </Html>
        )}

        <Suspense fallback={null}>
          <Environment preset={preset.environment} />
        </Suspense>
        <ContactShadows position={[0, -1.05, 0]} opacity={0.45} scale={7} blur={2.8} far={2.8} color="#000000" />
        <OrbitControls enablePan={false} minDistance={1.7} maxDistance={4.5} />
        <AdaptiveDpr pixelated />
      </Canvas>

      {/* One hint that fades away once you've seen it */}
      <div className="absolute inset-x-0 bottom-3 flex justify-center pointer-events-none fade-hint">
        <div className="text-xs text-white/70 bg-black/35 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
          <span className="hidden sm:inline">Drag to orbit • Scroll to zoom</span>
          <span className="sm:hidden">Drag & pinch to navigate</span>
        </div>
      </div>
    </div>
  );
}
