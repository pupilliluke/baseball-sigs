import React from "react";
import Dialog from "./Dialog";

/**
 * In-app destructive-action confirmation. Native confirm() is silently
 * suppressed in some embedded browsers, so we never rely on it.
 */
export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Confirm" }) {
  return (
    <Dialog open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <p className="text-sm text-muted mb-5">{message}</p>
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 rounded-xl border btn-glass transition"
        >
          Cancel
        </button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className="flex-1 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition"
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
