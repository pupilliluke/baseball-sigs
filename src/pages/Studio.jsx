import React, { useEffect } from "react";
import { useSigStore } from "../store/sigStore";
import { useBaseballTexture } from "../hooks/useBaseballTexture";
import Toolbar from "../components/ui/Toolbar";
import Stage from "../components/three/Stage";
import SignaturesPanel from "../components/panel/SignaturePanel";

export default function Studio() {
  const { signatures, shuffleSeed, resetSignatures } = useSigStore();
  const { texture } = useBaseballTexture(signatures, shuffleSeed);

  // Automatically reset signatures on first load
  useEffect(() => {
    resetSignatures();
  }, [resetSignatures]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-stretch">
      {/* Left: Toolbar + Stage */}
      <div className="flex-1 flex flex-col gap-3">
        <Toolbar />
        {/* Stage takes real height and the Canvas fills it */}
        <Stage texture={texture} />
      </div>

      {/* Right: sticky panel on large screens */}
      <aside className="w-full lg:w-[420px] lg:sticky lg:top-4 self-start">
        <SignaturesPanel />
      </aside>
    </div>
  );
}
