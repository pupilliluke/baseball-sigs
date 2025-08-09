import React from "react";

export default function About(){
  const panel = "rounded-2xl p-6 panel border";
  return (
    <section className={`${panel} max-w-none`}>
      <h2 className="text-2xl font-bold mb-2">Stack & Principles</h2>
      <ul className="list-disc pl-6 space-y-1 text-muted">
        <li><strong className="text-app">React + Tailwind</strong> for component-driven, utility-first UI.</li>
        <li><strong className="text-app">R3F + drei</strong> for idiomatic Three.js with PBR lighting.</li>
        <li><strong className="text-app">Zustand</strong> for tiny, predictable global state.</li>
        <li><strong className="text-app">Framer Motion</strong> for micro-interactions & animated lists.</li>
        <li><strong className="text-app">Zod</strong> for input validation and guard rails.</li>
        <li><strong className="text-app">Accessibility</strong>: labels, keyboard-friendly controls, readable contrast.</li>
        <li><strong className="text-app">Performance</strong>: Adaptive DPR, texture reuse, no re-allocations.</li>
      </ul>
      <p className="text-muted mt-3">Tip: pause rotation before exporting a texture for a consistent look.</p>
    </section>
  );
}
