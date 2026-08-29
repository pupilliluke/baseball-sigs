import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useSigStore } from "../../store/sigStore";

export default function SpinningBaseball({ texture }) {
  const meshRef = useRef();
  const { autoRotate, roughness, metalness } = useSigStore();

  useFrame((_, delta) => {
    if (autoRotate && meshRef.current) meshRef.current.rotation.y += delta * 0.25;
  });

  return (
    // Slight tilt so the seams sweep diagonally instead of sitting level
    <group rotation={[0.32, 0, -0.14]}>
      <mesh ref={meshRef} castShadow receiveShadow>
        <sphereGeometry args={[1, 128, 128]} />
        <meshStandardMaterial map={texture} roughness={roughness} metalness={metalness} />
      </mesh>
    </group>
  );
}
