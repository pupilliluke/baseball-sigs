import React from "react";
import { RotateCcw, Play, Pause } from "lucide-react";
import { useSigStore } from "../../store/sigStore";
import ThemeMenu from "./ThemeMenu";
import VideoExportButton from "../panel/VideoExportButton";

// Common accent-aware button style
const glassBtn = "px-3 py-2 rounded-xl border transition inline-flex items-center gap-2 btn-glass";


export default function Toolbar(){
  const { resetSignatures, toggleRotate, autoRotate } = useSigStore();
  return (
    <div className="flex flex-wrap gap-2 bg-white/5 border border-white/10 rounded-xl p-2 justify-center lg:justify-start">
      <ThemeMenu />
      <button onClick={resetSignatures} className={glassBtn}><RotateCcw className="h-4 w-4"/> Reset</button>
      <button onClick={toggleRotate} className={glassBtn}>
        {autoRotate ? <><Pause className="h-4 w-4"/>Pause</> : <><Play className="h-4 w-4"/>Play</>}
      </button>
      <div className="contents">
        <VideoExportButton />
      </div>
    </div>
  );
}
