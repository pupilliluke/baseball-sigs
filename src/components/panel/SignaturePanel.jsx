import React, { useState } from "react";
import { Plus, Trash2, Upload, Download, Save, Search, FolderOpen, X } from "lucide-react";
import { useSigStore } from "../../store/sigStore";
import LabeledSlider from "./LabeledSlider";
import ExportTextureButton from "./ExportTextureButton";
import SaveProjectDialog from "../project/SaveProjectDialog";
import ConfirmDialog from "../ui/ConfirmDialog";

const ghost = "btn-ghost px-2.5 py-2 text-sm inline-flex items-center gap-1.5";

export default function SignaturesPanel({ textureCanvas }) {
  const {
    sport,
    signatures,
    addSignature,
    toggleSignature,
    removeSignature,
    clearAllSignatures,
    roughness,
    metalness,
    setRoughness,
    setMetalness,
    currentProjectId,
    currentProjectName,
    currentCategory,
    clearCurrentProject,
    openProjectsDialog,
    pushToast,
  } = useSigStore();
  const [filter, setFilter] = useState("");
  const [draft, setDraft] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const shown = signatures.filter(s => s.name.toLowerCase().includes(filter.toLowerCase()));
  const enabledCount = signatures.filter(s => s.enabled).length;

  function onAdd() {
    const name = (draft || "").trim();
    if (name.length < 2) return;
    addSignature(name);
    setDraft("");
  }

  function onImport(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-importing the same file
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const arr = JSON.parse(reader.result);
        if (!Array.isArray(arr)) throw new Error("not an array");
        const names = arr.filter(n => typeof n === "string" && n.trim());
        names.forEach(n => addSignature(n.trim()));
        pushToast(names.length ? `Imported ${names.length} signature${names.length === 1 ? "" : "s"}` : "No names found in that file", names.length ? "success" : "info");
      } catch {
        pushToast("Couldn't read that file — expected a JSON array of names", "error");
      }
    };
    reader.readAsText(file);
  }

  function onExport() {
    const names = signatures.filter(s => s.enabled).map(s => s.name);
    const blob = new Blob([JSON.stringify(names, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sport}-signatures.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-3xl p-5 flex flex-col h-full panel-elevated border">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-shrink-0">
        <div>
          <div className="text-lg font-bold tracking-tight">Signatures</div>
          <div className="text-xs text-muted mt-0.5">Curate the roster and paint the leather</div>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={openProjectsDialog} className={ghost} title="Load a saved project">
            <FolderOpen className="h-4 w-4" /> <span className="hidden sm:inline">Load</span>
          </button>
          <button
            onClick={() => setShowSaveDialog(true)}
            className={ghost}
            title="Save this roster as a project"
          >
            <Save className="h-4 w-4" /> <span className="hidden sm:inline">Save</span>
          </button>
        </div>
      </div>

      {/* Current project chip */}
      {currentProjectId && (
        <div className="mt-3 flex items-center gap-2 flex-shrink-0">
          <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-accent/12 text-accent text-xs font-medium max-w-full">
            <FolderOpen className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{currentProjectName}</span>
            <span className="opacity-70 flex-shrink-0">· {currentCategory}</span>
            <button
              onClick={() => { clearCurrentProject(); pushToast("Detached from project — saving now creates a new one", "info"); }}
              className="p-0.5 rounded-full hover:bg-accent/20"
              title="Detach from this project"
              aria-label="Detach from current project"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}

      {/* Add signature */}
      <div className="mt-4 flex gap-2 flex-shrink-0">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === "Enter" && onAdd()}
          placeholder="Add a name…"
          className="flex-1 min-w-0 input-base px-3.5 py-2.5 rounded-xl outline-none placeholder:text-muted focus:ring-2 ring-accent border text-sm"
          aria-label="Add signature"
        />
        <button
          onClick={onAdd}
          disabled={draft.trim().length < 2}
          className="rounded-xl bg-accent text-white font-medium inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm hover:brightness-[1.05] active:brightness-[.95] disabled:opacity-40 disabled:cursor-not-allowed transition flex-shrink-0"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {/* Filter row */}
      <div className="mt-2.5 flex items-center gap-2 flex-shrink-0">
        <div className="flex-1 relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filter…"
            className="pl-9 input-base w-full px-3.5 py-2 rounded-xl outline-none placeholder:text-muted focus:ring-2 ring-accent border text-sm"
            aria-label="Filter signatures"
          />
        </div>
        <div className="text-xs text-muted whitespace-nowrap tabular-nums">
          <span className="text-app font-medium">{enabledCount}</span> on ball
        </div>
      </div>

      {/* Signature list (scrollable) */}
      <div className="mt-3 flex-1 overflow-auto rounded-xl border min-h-[160px] max-h-[42vh] lg:max-h-none" style={{ borderColor: "var(--panel-border)" }}>
        {shown.length === 0 ? (
          <div className="h-full grid place-items-center py-10 text-center text-muted text-sm px-4">
            {signatures.length === 0
              ? "No signatures yet — add a name above or load a project."
              : "No signatures match that filter."}
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--panel-border)" }}>
            {shown.map((sig) => (
              <li
                key={sig.id}
                className="flex items-center gap-2 px-3 py-2 transition group
                           hover:bg-black/5 dark:hover:bg-white/5"
              >
                <label className="flex items-center gap-2.5 cursor-pointer select-none flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={sig.enabled}
                    onChange={() => toggleSignature(sig.id)}
                    aria-label={`Toggle ${sig.name}`}
                    className="h-4 w-4 flex-shrink-0"
                  />
                  <span className={`truncate text-sm ${sig.enabled ? "text-app" : "text-muted line-through decoration-1"}`}>
                    {sig.name}
                  </span>
                </label>
                <button
                  onClick={() => removeSignature(sig.id)}
                  className="reveal-on-hover p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 opacity-40 group-hover:opacity-100 transition"
                  aria-label={`Remove ${sig.name}`}
                >
                  <Trash2 className="h-4 w-4 text-muted" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {signatures.length > 0 && (
        <div className="mt-1.5 flex justify-end flex-shrink-0">
          <button
            onClick={() => setConfirmClear(true)}
            className="px-2 py-1 rounded-lg hover:bg-red-500/10 text-red-400/80 hover:text-red-400 transition text-xs inline-flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Clear all
          </button>
        </div>
      )}

      {/* Material */}
      <div className="mt-4 flex-shrink-0">
        <div className="section-label mb-2.5">Material</div>
        <div className="grid grid-cols-2 gap-4">
          <LabeledSlider label="Roughness" value={roughness} onChange={setRoughness} />
          <LabeledSlider label="Metalness" value={metalness} onChange={setMetalness} />
        </div>
      </div>

      {/* Export */}
      <div className="mt-4 pt-3 border-t flex gap-1 flex-shrink-0" style={{ borderColor: "var(--panel-border)" }}>
        <ExportTextureButton canvas={textureCanvas} />
        <button onClick={onExport} className={ghost} title="Download the enabled names as JSON">
          <Download className="h-4 w-4" /> Export names
        </button>
        <label className={`${ghost} cursor-pointer`} title="Import names from a JSON file">
          <Upload className="h-4 w-4" /> Import
          <input type="file" accept="application/json,.json" className="sr-only" onChange={onImport} />
        </label>
      </div>

      {/* Dialogs */}
      <SaveProjectDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
      />
      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => { clearAllSignatures(); pushToast("All signatures cleared", "info"); }}
        title="Clear all signatures?"
        message={`This removes all ${signatures.length} signatures from the ball. Saved projects are not affected.`}
        confirmLabel="Clear all"
      />
    </div>
  );
}
