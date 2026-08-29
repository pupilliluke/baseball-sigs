import React from "react";
import { Link } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { useSigStore, LIGHTING_PRESETS } from "../store/sigStore";
import PresetPreview from "../components/gallery/PresetPreview";

export default function Gallery(){
  const { currentPreset, setPreset, pushToast } = useSigStore();
  const card = "rounded-2xl p-4 panel border";
  const btn = "mt-3 px-3 py-2 rounded-xl border transition inline-flex items-center justify-center gap-2 btn-glass";

  const applyPreset = (key, preset) => {
    setPreset(key);
    pushToast(`${preset.name} lighting applied to the Studio`);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Lighting Gallery</h1>
        <p className="text-muted">Pick a mood for your baseball — presets apply to the Studio instantly</p>
      </div>

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(LIGHTING_PRESETS).map(([key, preset]) => (
          <div key={key} className={card}>
            <div className="mb-3">
              <div className="text-lg font-semibold text-app">{preset.name}</div>
              <div className="text-sm text-muted">{preset.description}</div>
            </div>

            <PresetPreview preset={preset} />

            {currentPreset === key ? (
              <div className="flex gap-2">
                <div className={`${btn} flex-1 bg-accent/20 border-accent text-accent cursor-default`}>
                  <Check className="h-4 w-4" />
                  In use
                </div>
                <Link to="/" className={`${btn} flex-1`} title="Back to the Studio">
                  Open Studio <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <button
                onClick={() => applyPreset(key, preset)}
                className={`${btn} w-full`}
              >
                Apply Preset
              </button>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
