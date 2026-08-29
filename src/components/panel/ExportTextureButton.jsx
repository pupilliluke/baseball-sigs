import React from "react";
import { Download } from "lucide-react";
import { useSigStore } from "../../store/sigStore";

// Common accent-aware button style
const glassBtn = "px-3 py-2 rounded-xl border transition inline-flex items-center gap-2 btn-glass";

export default function ExportTextureButton({ canvas }) {
  const pushToast = useSigStore((s) => s.pushToast);

  function downloadTexture() {
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "baseball_signatures_texture.png";
    a.click();
    pushToast("Texture PNG downloaded");
  }

  return (
    <button onClick={downloadTexture} className={`${glassBtn} text-sm`} title="Download the ball texture as a PNG">
      <Download className="h-4 w-4" /> Export PNG
    </button>
  );
}
