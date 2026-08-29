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
    <div className="relative h-[50vh] sm:h-[60vh] lg:h-[65vh] min-h-[400px] sm:min-h-[500px] lg:min-h-[560px] rounded-2xl panel border overflow-hidden">
      {/* Make Canvas fill the stage exactly */}
      <Canvas
        className="!absolute inset-0 h-full w-full"
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0.6, 2.4], fov: 45 }}
        // preserveDrawingBuffer keeps video capture reliable across browsers
        gl={{ preserveDrawingBuffer: true, antialias: true }}
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
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
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
        <ContactShadows position={[0, -1, 0]} opacity={0.3} scale={6} blur={2.5} far={2.5} />
        <OrbitControls enablePan={false} minDistance={1.6} maxDistance={4} />
        <AdaptiveDpr pixelated />
      </Canvas>

      {/* Info badges pinned inside the stage */}
      <div className="absolute left-2 sm:left-3 bottom-2 sm:bottom-3 flex flex-col gap-1 sm:gap-2 pointer-events-none">
        <div className="text-xs text-white/80 bg-black/40 px-2 py-1 rounded-md border border-white/10 backdrop-blur-sm w-fit">
          {preset.name} lighting
        </div>
        <div className="text-xs text-white/80 bg-black/40 px-2 py-1 rounded-md border border-white/10 backdrop-blur-sm w-fit">
          <span className="hidden sm:inline">Drag to orbit • Scroll to zoom</span>
          <span className="sm:hidden">Drag & pinch to navigate</span>
        </div>
      </div>
    </div>
  );
}
