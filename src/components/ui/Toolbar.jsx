import React from "react";
import { RotateCcw, Play, Pause, Shuffle, Lightbulb } from "lucide-react";
import { useSigStore, LIGHTING_PRESETS } from "../../store/sigStore";
import ThemeMenu from "./ThemeMenu";
import VideoExportButton from "../panel/VideoExportButton";

// Common accent-aware button style
const glassBtn = "px-3 py-2 rounded-xl border transition inline-flex items-center gap-2 btn-glass";


export default function Toolbar(){
  const {
    resetSignatures, toggleRotate, autoRotate,
    shuffleLayout, currentPreset, setPreset, pushToast,
  } = useSigStore();

  return (
    <div className="flex flex-wrap gap-2 panel border rounded-xl p-2 justify-center lg:justify-start items-center">
      <ThemeMenu />
      <button
        onClick={() => { resetSignatures(); pushToast("Roster reset to the default lineup", "info"); }}
        className={glassBtn}
        title="Reset the roster to the default lineup"
      >
        <RotateCcw className="h-4 w-4"/> Reset
      </button>
      <button onClick={toggleRotate} className={glassBtn} title={autoRotate ? "Pause rotation" : "Resume rotation"}>
        {autoRotate ? <><Pause className="h-4 w-4"/>Pause</> : <><Play className="h-4 w-4"/>Play</>}
      </button>
      <button onClick={shuffleLayout} className={glassBtn} title="Rearrange the signatures on the ball">
        <Shuffle className="h-4 w-4"/> Shuffle
      </button>
      <label className={`${glassBtn} cursor-pointer`} title="Lighting preset">
        <Lightbulb className="h-4 w-4"/>
        <select
          value={currentPreset}
          onChange={(e) => setPreset(e.target.value)}
          className="bg-transparent outline-none cursor-pointer text-app [&>option]:text-black"
          aria-label="Lighting preset"
        >
          {Object.entries(LIGHTING_PRESETS).map(([key, preset]) => (
            <option key={key} value={key}>{preset.name}</option>
          ))}
        </select>
      </label>
      <VideoExportButton />
    </div>
  );
}
