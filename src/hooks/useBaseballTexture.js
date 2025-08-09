import { useEffect, useRef } from "react";
import * as THREE from "three";
import { drawBaseballTexture } from "../lib/drawBaseballTexture";

export function useBaseballTexture(signatures, seedStr) {
  const canvasRef = useRef(null);
  const textureRef = useRef(null);

  if (!canvasRef.current) {
    const c = document.createElement("canvas");
    c.width = 2048; c.height = 1024; // 2:1 UV
    canvasRef.current = c;
  }

  useEffect(() => {
    drawBaseballTexture(canvasRef.current, signatures, seedStr);
    if (!textureRef.current) {
      const tex = new THREE.CanvasTexture(canvasRef.current);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      tex.wrapS = THREE.ClampToEdgeWrapping; tex.wrapT = THREE.ClampToEdgeWrapping;
      textureRef.current = tex;
    } else {
      textureRef.current.needsUpdate = true;
    }
  }, [signatures, seedStr]);

  return { texture: textureRef.current, canvas: canvasRef.current };
}
