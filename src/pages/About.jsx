import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function About(){
  const panel = "rounded-2xl p-6 panel border";
  return (
    <div className="grid gap-6 max-w-3xl">
      <section className={panel}>
        <h2 className="text-2xl font-bold mb-3">How it works</h2>
        <ol className="list-decimal pl-6 space-y-2 text-muted">
          <li>
            <strong className="text-app">Curate the roster.</strong> Add, remove, or toggle names in the
            Signatures panel — every change repaints the ball live. Import a JSON list if you already have one.
          </li>
          <li>
            <strong className="text-app">Style the ball.</strong> Tune roughness and metalness, pick a lighting
            preset from the toolbar or the Gallery, and hit Shuffle to rearrange the autographs.
          </li>
          <li>
            <strong className="text-app">Export it.</strong> Download the texture as a PNG, or record a spinning
            video straight from the 3D stage.
          </li>
          <li>
            <strong className="text-app">Save your work.</strong> Projects live in the cloud — save a roster,
            load it later, or keep several going at once.
          </li>
        </ol>
        <p className="text-muted mt-4">Tip: pause rotation before recording for a steadier export, or orbit the
          camera while recording for a cinematic pass.</p>
        <Link to="/" className="mt-4 inline-flex items-center gap-2 text-accent hover:underline">
          Open the Studio <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className={panel}>
        <h2 className="text-xl font-bold mb-3">Under the hood</h2>
        <ul className="list-disc pl-6 space-y-1 text-muted">
          <li><strong className="text-app">React + Tailwind</strong> for component-driven, utility-first UI.</li>
          <li><strong className="text-app">Three.js (R3F + drei)</strong> for PBR lighting and real-time 3D.</li>
          <li><strong className="text-app">Procedural canvas texture</strong> — leather grain, stitched seams, and
            collision-aware signature layout drawn on the fly.</li>
          <li><strong className="text-app">Zustand</strong> for tiny, predictable global state.</li>
          <li><strong className="text-app">Firebase Firestore</strong> for cloud-saved projects.</li>
          <li><strong className="text-app">Framer Motion</strong> for dialogs and toasts.</li>
        </ul>
      </section>
    </div>
  );
}
