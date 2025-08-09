import React from "react";
import { Check } from "lucide-react";
import { useSigStore, LIGHTING_PRESETS } from "../store/sigStore";
import PresetPreview from "../components/gallery/PresetPreview";

export default function Gallery(){
  const { currentPreset, setPreset } = useSigStore();
  const card = "rounded-2xl p-4 panel border";
  const btn = "mt-3 px-3 py-2 rounded-xl border transition inline-flex items-center justify-center gap-2 btn-glass";
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Lighting Gallery</h1>
        <p className="text-muted">Professional lighting presets for your baseball renders</p>
      </div>
      
      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(LIGHTING_PRESETS).map(([key, preset]) => (
          <div key={key} className={card}>
            <div className="mb-3">
              <div className="text-lg font-semibold text-app">{preset.name}</div>
              <div className="text-sm text-muted">{preset.description}</div>
            </div>
            
            <PresetPreview preset={preset} />
            
            <button 
              onClick={() => setPreset(key)}
              className={`${btn} w-full ${currentPreset === key ? 'bg-accent/20 border-accent text-accent' : ''}`}
            >
              {currentPreset === key ? (
                <>
                  <Check className="h-4 w-4" />
                  Current Preset
                </>
              ) : (
                'Apply Preset'
              )}
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
