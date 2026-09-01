import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useSigStore } from "../../store/sigStore";

// Per-sport geometry: footballs are prolate (long axis through the texture
// poles, so the UV pinch lands on the tips); each ball gets a natural tilt.
const BALL_SHAPES = {
  baseball: { scale: [1, 1, 1], tilt: [0.32, 0, -0.14] },
  basketball: { scale: [1.06, 1.06, 1.06], tilt: [0.16, 0, 0] },
  football: { scale: [0.68, 1.14, 0.68], tilt: [0.1, 0, -0.2] },
};

export default function SpinningBall({ texture }) {
  const meshRef = useRef();
  const floatRef = useRef();
  const { autoRotate, roughness, metalness, sport } = useSigStore();
  const shape = BALL_SHAPES[sport] || BALL_SHAPES.baseball;

  useFrame(({ clock }, delta) => {
    if (autoRotate && meshRef.current) meshRef.current.rotation.y += delta * 0.25;
    // Gentle float keeps the scene feeling alive even when rotation is paused
    if (floatRef.current) {
      floatRef.current.position.y = Math.sin(clock.elapsedTime * 0.7) * 0.035;
    }
  });

  return (
    <group ref={floatRef}>
      <group rotation={shape.tilt}>
        <mesh ref={meshRef} castShadow receiveShadow scale={shape.scale}>
          <sphereGeometry args={[1, 128, 128]} />
          {/* Clearcoat gives the leather a subtle finished sheen */}
          <meshPhysicalMaterial
            map={texture}
            roughness={roughness}
            metalness={metalness}
            clearcoat={0.25}
            clearcoatRoughness={0.55}
          />
        </mesh>
      </group>
    </group>
  );
}
