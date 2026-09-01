import React from "react";
import { Download } from "lucide-react";
import { useSigStore } from "../../store/sigStore";

const ghost = "btn-ghost px-2.5 py-2 text-sm inline-flex items-center gap-1.5";

export default function ExportTextureButton({ canvas }) {
  const pushToast = useSigStore((s) => s.pushToast);
  const sport = useSigStore((s) => s.sport);

  function downloadTexture() {
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sport}_signatures_texture.png`;
    a.click();
    pushToast("Texture PNG downloaded");
  }

  return (
    <button onClick={downloadTexture} className={ghost} title="Download the ball texture as a PNG">
      <Download className="h-4 w-4" /> Export PNG
    </button>
  );
}
