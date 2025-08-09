import React from "react";
import { Download } from "lucide-react";
import { useSigStore } from "../../store/sigStore";
import { useBaseballTexture } from "../../hooks/useBaseballTexture";

// Common accent-aware button style
const glassBtn = "px-3 py-2 rounded-xl border transition inline-flex items-center gap-2 btn-glass";


export default function ExportTextureButton(){
  const { signatures, shuffleSeed } = useSigStore();
  const { canvas } = useBaseballTexture(signatures, shuffleSeed);
  function downloadTexture(){ const url = canvas.toDataURL("image/png"); const a = document.createElement("a"); a.href = url; a.download = "baseball_signatures_texture.png"; a.click(); }
  return <button onClick={downloadTexture} className={glassBtn}><Download className="h-4 w-4"/> Export PNG</button>;
}
