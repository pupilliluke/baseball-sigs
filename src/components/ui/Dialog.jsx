import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { AnimatePresence, motion as Motion } from "framer-motion";

/**
 * Shared modal shell: theme-aware surface, backdrop + Escape dismissal,
 * enter/exit animation, and initial focus for keyboard users.
 *
 * Rendered through a portal to <body>: panels use backdrop-filter, which
 * makes them a containing block for fixed-position descendants, so a dialog
 * left in place would be trapped inside the panel instead of covering the
 * viewport.
 */
export default function Dialog({ open, onClose, title, children, maxWidth = "max-w-md" }) {
  const contentRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    contentRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <Motion.div
          className="fixed inset-0 z-50 grid place-items-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <Motion.div
            ref={contentRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className={`w-full ${maxWidth} max-h-[90vh] rounded-2xl border shadow-xl text-app outline-none flex flex-col`}
            style={{ background: "var(--surface)", borderColor: "var(--panel-border)" }}
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between p-4 sm:p-6 pb-3 sm:pb-4 flex-shrink-0">
              <h2 className="text-xl font-bold tracking-tight">{title}</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 overflow-y-auto flex-1">{children}</div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
