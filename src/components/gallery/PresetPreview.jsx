import React from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

function MiniBaseball({ preset }) {
  return (
    <mesh castShadow receiveShadow>
      <sphereGeometry args={[0.8, 64, 64]} />
      <meshStandardMaterial color="#f8f8f8" roughness={0.6} metalness={0.05} />
    </mesh>
  );
}

export default function PresetPreview({ preset, className = "" }) {
  return (
    <div className={`aspect-[4/3] rounded-xl overflow-hidden border border-white/10 ${className}`}>
      <Canvas
        shadows
        camera={{ position: [0, 0.4, 2], fov: 45 }}
        onCreated={({ gl }) => {
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
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
        
        <MiniBaseball preset={preset} />
        
        <Environment preset={preset.environment} />
        <ContactShadows position={[0, -0.8, 0]} opacity={0.3} scale={4} blur={2} far={2} />
      </Canvas>
    </div>
  );
}