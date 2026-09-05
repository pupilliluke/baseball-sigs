import React from "react";
import { Lightbulb } from "lucide-react";
import { useSigStore } from "../../store/sigStore";

/**
 * A short pointer for someone still learning the app. Renders nothing once
 * hints are switched off, and every hint carries the way to switch them off
 * so the control is wherever the noise is.
 */
export default function Hint({ children, className = "" }) {
  const { hintsEnabled, setHintsEnabled } = useSigStore();
  if (!hintsEnabled) return null;

  return (
    <div
      className={`flex items-start gap-2 text-xs text-muted rounded-xl px-3 py-2 border ${className}`}
      style={{ background: "var(--btn-bg)", borderColor: "var(--panel-border)" }}
    >
      <Lightbulb className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-accent" />
      <p className="flex-1 leading-relaxed">{children}</p>
      <button
        onClick={() => setHintsEnabled(false)}
        className="flex-shrink-0 underline underline-offset-2 hover:text-app transition whitespace-nowrap"
      >
        Turn off hints
      </button>
    </div>
  );
}
