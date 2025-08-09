import React from "react";

export default function LabeledSlider({ label, defaultValue, onChange }) {
  const id = `slider_${label.replace(/\s+/g,'').toLowerCase()}`;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-white/60">{label}</span>
      </div>
      <input id={id} type="range" min={0} max={1} step={0.01} defaultValue={defaultValue} onChange={(e)=>onChange(parseFloat(e.target.value))} className="w-full accent-sky-500"/>
    </div>
  );
}
