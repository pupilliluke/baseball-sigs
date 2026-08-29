import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { useSigStore } from "../../store/sigStore";

// Plain-colored stand-in for the active sport's ball
const MINI_BALLS = {
  baseball: { color: "#f8f5ec", scale: [1, 1, 1] },
  basketball: { color: "#d96f26", scale: [1.05, 1.05, 1.05] },
  football: { color: "#6d4123", scale: [0.62, 1.05, 0.62] },
};

function MiniBall() {
  const sport = useSigStore((s) => s.sport);
  const { color, scale } = MINI_BALLS[sport] || MINI_BALLS.baseball;
  return (
    <mesh castShadow receiveShadow scale={scale} rotation={[0.15, 0, -0.1]}>
      <sphereGeometry args={[0.8, 48, 48]} />
      <meshStandardMaterial color={color} roughness={0.6} metalness={0.05} />
    </mesh>
  );
}

export default function PresetPreview({ preset, className = "" }) {
  return (
    <div className={`aspect-[4/3] rounded-xl overflow-hidden border border-white/10 ${className}`}>
      {/* Static scene: render on demand so six previews don't burn GPU time */}
      <Canvas
        shadows
        frameloop="demand"
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.4, 2], fov: 45 }}
        gl={{ powerPreference: "low-power" }}
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
          shadow-mapSize-width={256}
          shadow-mapSize-height={256}
        />

        <MiniBall />

        <Suspense fallback={null}>
          <Environment preset={preset.environment} />
        </Suspense>
        <ContactShadows position={[0, -0.8, 0]} opacity={0.3} scale={4} blur={2} far={2} />
      </Canvas>
    </div>
  );
}
