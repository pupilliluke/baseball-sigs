import React from "react";

export default function LabeledSlider({ label, value, onChange }) {
  const id = `slider_${label.replace(/\s+/g, "").toLowerCase()}`;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <label htmlFor={id} className="text-muted">{label}</label>
        <span className="text-app tabular-nums">{Math.round(value * 100)}%</span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
