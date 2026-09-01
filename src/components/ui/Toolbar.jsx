import React from "react";
import { RotateCcw, Play, Pause, Shuffle, Lightbulb } from "lucide-react";
import { useSigStore, LIGHTING_PRESETS, SPORTS } from "../../store/sigStore";
import ThemeMenu from "./ThemeMenu";
import VideoExportButton from "../panel/VideoExportButton";

const ghost = "btn-ghost px-2.5 py-2 text-sm inline-flex items-center gap-1.5";

export default function Toolbar(){
  const {
    sport, setSport,
    resetSignatures, toggleRotate, autoRotate,
    shuffleLayout, currentPreset, setPreset, pushToast,
  } = useSigStore();

  return (
    // relative z-30 keeps the theme dropdown above the stage below it: both
    // are backdrop-filtered stacking contexts, so without this the later
    // sibling (the stage) paints over the menu.
    <div className="relative z-30 flex flex-wrap gap-1.5 panel-elevated border rounded-2xl p-1.5 justify-center lg:justify-start items-center">
      {/* Sport switcher */}
      <div
        className="inline-flex rounded-xl p-0.5 gap-0.5"
        style={{ background: "var(--btn-bg)" }}
        role="group"
        aria-label="Sport"
      >
        {Object.entries(SPORTS).map(([key, { label, emoji }]) => (
          <button
            key={key}
            onClick={() => setSport(key)}
            className={`px-2.5 py-1.5 rounded-[10px] text-sm inline-flex items-center gap-1.5 transition ${
              sport === key
                ? "bg-accent/15 text-accent font-semibold shadow-sm"
                : "text-muted hover:text-app"
            }`}
            title={`Switch to ${label.toLowerCase()}`}
            aria-pressed={sport === key}
          >
            <span aria-hidden="true">{emoji}</span>
            <span className="hidden md:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="w-px h-6 mx-0.5 hidden sm:block" style={{ background: "var(--panel-border)" }} />

      <ThemeMenu />
      <button
        onClick={() => { resetSignatures(); pushToast("Roster reset to the default lineup", "info"); }}
        className={ghost}
        title="Reset the roster to the default lineup"
      >
        <RotateCcw className="h-4 w-4"/> <span className="hidden lg:inline">Reset</span>
      </button>
      <button onClick={toggleRotate} className={ghost} title={autoRotate ? "Pause rotation" : "Resume rotation"}>
        {autoRotate ? <><Pause className="h-4 w-4"/><span className="hidden lg:inline">Pause</span></> : <><Play className="h-4 w-4"/><span className="hidden lg:inline">Play</span></>}
      </button>
      <button onClick={shuffleLayout} className={ghost} title="Rearrange the signatures on the ball">
        <Shuffle className="h-4 w-4"/> <span className="hidden lg:inline">Shuffle</span>
      </button>
      <label className={`${ghost} cursor-pointer`} title="Lighting preset">
        <Lightbulb className="h-4 w-4"/>
        <select
          value={currentPreset}
          onChange={(e) => setPreset(e.target.value)}
          className="bg-transparent outline-none cursor-pointer [&>option]:text-black"
          aria-label="Lighting preset"
        >
          {Object.entries(LIGHTING_PRESETS).map(([key, preset]) => (
            <option key={key} value={key}>{preset.name}</option>
          ))}
        </select>
      </label>

      <div className="flex-1 hidden lg:block" />
      <VideoExportButton />
    </div>
  );
}
