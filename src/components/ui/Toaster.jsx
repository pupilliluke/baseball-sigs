import React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { useSigStore } from "../../store/sigStore";

const ICONS = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  error: <AlertCircle className="h-4 w-4 text-red-400" />,
  info: <Info className="h-4 w-4 text-accent" />,
};

export default function Toaster() {
  const { toasts, dismissToast } = useSigStore();

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 px-4 w-full max-w-md pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="pointer-events-auto flex items-center gap-2 pl-3 pr-2 py-2 rounded-xl border shadow-lg text-sm text-app w-auto max-w-full"
            style={{ background: "var(--surface)", borderColor: "var(--panel-border)" }}
            role="status"
          >
            {ICONS[toast.type] || ICONS.info}
            <span className="truncate">{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition flex-shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5 text-muted" />
            </button>
          </Motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
