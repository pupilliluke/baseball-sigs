import React, { useState } from "react";
import { Plus, Trash2, Upload, Save, Search, FolderOpen, X } from "lucide-react";
import { useSigStore } from "../../store/sigStore";
import LabeledSlider from "./LabeledSlider";
import ExportTextureButton from "./ExportTextureButton";
import SaveProjectDialog from "../project/SaveProjectDialog";
import ProjectListDialog from "../project/ProjectListDialog";
import ConfirmDialog from "../ui/ConfirmDialog";

const panel = "rounded-2xl p-4 flex flex-col h-full panel border";
const glassBtn = "px-3 py-2 rounded-xl border transition inline-flex items-center gap-2 btn-glass";


export default function SignaturesPanel({ textureCanvas }) {
  const {
    sport,
    setSport,
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
    clearCurrentProject,
    setCurrentProject,
    loadProjectSignatures,
    pushToast,
  } = useSigStore();
  const [filter, setFilter] = useState("");
  const [draft, setDraft] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showProjectList, setShowProjectList] = useState(false);
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

  const handleLoadProject = (project) => {
    if (project.sport && project.sport !== sport) setSport(project.sport);
    setCurrentProject(project.id, project.projectName);
    loadProjectSignatures(project.signatures || project.signatureNames || []);
  };

  return (
    <div className={panel}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-white/10 flex-shrink-0 gap-3">
        <div>
          <div className="text-xl font-semibold tracking-tight">Signatures</div>
          <div className="text-xs text-muted">Curate the roster and paint the leather</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
          <button
            onClick={() => setShowProjectList(true)}
            className={`${glassBtn} text-sm`}
            title="Load a saved project"
          >
            <FolderOpen className="h-4 w-4" /> <span className="hidden sm:inline">Load</span>
          </button>
          <button
            onClick={() => setShowSaveDialog(true)}
            className={`${glassBtn} text-sm`}
            title="Save this roster as a project"
          >
            <Save className="h-4 w-4" /> <span className="hidden sm:inline">Save</span>
          </button>
          <label className={`${glassBtn} text-sm cursor-pointer`} title="Import names from a JSON file">
            <Upload className="h-4 w-4" /> <span className="hidden sm:inline">Import</span>
            <input type="file" accept="application/json,.json" className="sr-only" onChange={onImport} />
          </label>
        </div>
      </div>

      {/* Current project chip */}
      {currentProjectId && (
        <div className="mt-3 flex items-center gap-2 flex-shrink-0">
          <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent text-xs font-medium max-w-full">
            <FolderOpen className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{currentProjectName}</span>
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
      <div className="mt-4 grid grid-cols-3 gap-2 flex-shrink-0">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === "Enter" && onAdd()}
          placeholder="Add a signature (e.g., Shohei Ohtani)"
          className="col-span-2 input-base w-full px-3 py-2 rounded-xl outline-none placeholder:text-muted focus:ring-2 ring-accent border"
          aria-label="Add signature"
        />
        <button
          onClick={onAdd}
          disabled={draft.trim().length < 2}
          className="rounded-xl bg-accent text-white font-medium inline-flex items-center justify-center gap-2 px-3 py-2 hover:brightness-[1.05] active:brightness-[.95] disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {/* Filter and Controls */}
      <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 flex-shrink-0">
        <div className="flex-1 relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filter…"
            className="pl-9 input-base w-full px-3 py-2 rounded-xl outline-none placeholder:text-muted focus:ring-2 ring-accent border"
            aria-label="Filter signatures"
          />
        </div>
        <div className="flex items-center gap-2 justify-between sm:justify-end">
          {signatures.length > 0 && (
            <button
              onClick={() => setConfirmClear(true)}
              className="px-2 py-2 rounded-lg hover:bg-red-500/10 text-red-400 transition text-sm inline-flex items-center gap-1"
              title="Clear all signatures"
            >
              <X className="h-4 w-4" />
              <span>Clear</span>
            </button>
          )}
          <div className="text-sm text-muted whitespace-nowrap">
            Showing <span className="text-app">{shown.length}</span> • On ball <span className="text-app">{enabledCount}</span>
          </div>
        </div>
      </div>

      {/* Sliders */}
      <div className="mt-4 grid grid-cols-2 gap-3 flex-shrink-0">
        <LabeledSlider label="Roughness" value={roughness} onChange={setRoughness} />
        <LabeledSlider label="Metalness" value={metalness} onChange={setMetalness} />
      </div>

      {/* Signature list (scrollable) */}
      <div className="mt-4 flex-1 overflow-auto rounded-xl border panel min-h-[160px] max-h-[45vh] lg:max-h-none">
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
                className="flex items-center gap-2 px-3 py-2 transition
                           hover:bg-black/5 dark:hover:bg-white/5"
              >
                <label className="flex items-center gap-2 cursor-pointer select-none flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={sig.enabled}
                    onChange={() => toggleSignature(sig.id)}
                    aria-label={`Toggle ${sig.name}`}
                    className="h-4 w-4 flex-shrink-0"
                  />
                  <span className={`truncate ${sig.enabled ? "text-app" : "text-muted line-through decoration-1"}`}>
                    {sig.name}
                  </span>
                </label>
                <button
                  onClick={() => removeSignature(sig.id)}
                  className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                  aria-label={`Remove ${sig.name}`}
                >
                  <Trash2 className="h-4 w-4 text-muted" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Export buttons */}
      <div className="mt-3 flex gap-2 flex-shrink-0">
        <ExportTextureButton canvas={textureCanvas} />
        <button onClick={onExport} className={`${glassBtn} text-sm`} title="Download the enabled names as JSON">
          <Upload className="h-4 w-4 rotate-180" /> Export names
        </button>
      </div>

      {/* Dialogs */}
      <SaveProjectDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
      />
      <ProjectListDialog
        isOpen={showProjectList}
        onClose={() => setShowProjectList(false)}
        onLoadProject={handleLoadProject}
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
