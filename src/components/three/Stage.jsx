import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, AdaptiveDpr, Html } from "@react-three/drei";
import * as THREE from "three";
import SpinningBaseball from "./SpinningBaseball";
import { useSigStore, LIGHTING_PRESETS } from "../../store/sigStore";

export default function Stage({ texture }) {
  const { currentPreset } = useSigStore();
  const preset = LIGHTING_PRESETS[currentPreset];
  
  return (
    // Give the stage a real, predictable height
    <div className="relative h-[65vh] min-h-[560px] rounded-2xl panel border overflow-hidden">
      {/* Make Canvas fill the stage exactly */}
      <Canvas
        className="!absolute inset-0 h-full w-full"
        shadows
        camera={{ position: [0, 0.6, 2.4], fov: 45 }}
        onCreated={({ gl }) => {
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
          <SpinningBaseball texture={texture} />
        ) : (
          <Html center>
            <div className="px-4 py-2 rounded-xl bg-black/60 border border-white/10">
              Generating texture…
            </div>
          </Html>
        )}

        <Environment preset={preset.environment} />
        <ContactShadows position={[0, -1, 0]} opacity={0.3} scale={6} blur={2.5} far={2.5} />
        <OrbitControls enablePan={false} minDistance={1.6} maxDistance={4} />
        <AdaptiveDpr pixelated />
      </Canvas>

      {/* Info badges pinned inside the stage */}
      <div className="absolute left-3 bottom-3 flex flex-col gap-2">
        <div className="text-xs text-white/70 bg-black/40 px-2 py-1 rounded-md border border-white/10">
          Preset: {preset.name}
        </div>
        <div className="text-xs text-white/70 bg-black/40 px-2 py-1 rounded-md border border-white/10">
          Drag to orbit • Scroll to zoom
        </div>
      </div>
    </div>
  );
}
