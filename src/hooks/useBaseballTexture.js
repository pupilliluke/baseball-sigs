import { useEffect, useState } from "react";
import * as THREE from "three";
import { drawBallTexture, SIGNATURE_FONT_PROBES } from "../lib/drawBaseballTexture";

export function useBallTexture(signatures, seedStr, sport) {
  // Canvas + texture are created once, eagerly, so the texture is available on
  // the very first render (a ref-based texture would never trigger a re-render).
  const [{ canvas, texture }] = useState(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 1024; // 2:1 equirectangular UV
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return { canvas, texture };
  });

  // The signature fonts are web fonts; redraw once they finish loading so the
  // first paint (with fallback fonts) gets replaced.
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    let active = true;
    if (!document.fonts?.load) {
      setFontsReady(true);
      return;
    }
    Promise.all(SIGNATURE_FONT_PROBES.map((f) => document.fonts.load(f)))
      .catch(() => {})
      .finally(() => active && setFontsReady(true));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    drawBallTexture(canvas, signatures, seedStr, sport);
    texture.needsUpdate = true;
  }, [canvas, texture, signatures, seedStr, sport, fontsReady]);

  return { texture, canvas };
}
