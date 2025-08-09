import React, { useState } from "react";
import { Plus, Trash2, Upload, Save, Search, FolderOpen } from "lucide-react";
import { useSigStore } from "../../store/sigStore";
import LabeledSlider from "./LabeledSlider";
import ExportTextureButton from "./ExportTextureButton";
import SaveProjectDialog from "../project/SaveProjectDialog";
import ProjectListDialog from "../project/ProjectListDialog";
const panel = "rounded-2xl p-4 flex flex-col h-full panel border";
const inputBase = "input-base w-full px-3 py-2 rounded-xl outline-none placeholder:text-white/40 focus:ring-2 ring-accent";
const glassBtn = "px-3 py-2 rounded-xl border transition inline-flex items-center gap-2 btn-glass";


export default function SignaturesPanel() {
  const { 
    signatures, 
    addSignature, 
    toggleSignature, 
    removeSignature, 
    setRoughness, 
    setMetalness,
    setCurrentProject,
    loadProjectSignatures
  } = useSigStore();
  const [filter, setFilter] = useState("");
  const [draft, setDraft] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showProjectList, setShowProjectList] = useState(false);

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
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const arr = JSON.parse(reader.result);
        if (Array.isArray(arr)) arr.forEach(n => { if (typeof n === "string" && n.trim()) addSignature(n.trim()); });
      } catch (err) { console.error(err); }
    };
    reader.readAsText(file);
  }

  function onExport() {
    const names = signatures.filter(s => s.enabled).map(s => s.name);
    const blob = new Blob([JSON.stringify(names, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "signatures.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  const handleLoadProject = (project) => {
    setCurrentProject(project.id, project.projectName);
    loadProjectSignatures(project.signatureNames || []);
  };

  return (
    <div className={`rounded-2xl p-4 flex flex-col h-full ${panel}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-shrink-0">
        <div>
          <div className="text-xl font-semibold tracking-tight">Signatures</div>
          <div className="text-xs text-white/60">Curate the roster and paint the leather</div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowProjectList(true)} 
            className={glassBtn}
            title="Load Project"
          >
            <FolderOpen className="h-4 w-4" /> Load
          </button>
          <button 
            onClick={() => setShowSaveDialog(true)} 
            className={glassBtn}
            title="Save Project"
          >
            <Save className="h-4 w-4" /> Save
          </button>
          <label className={glassBtn} title="Import JSON">
            <Upload className="h-4 w-4" /> Import
            <input type="file" accept="application/json" className="sr-only" onChange={onImport} />
          </label>
        </div>
      </div>

{/* Add signature */}
<div className="mt-4 grid grid-cols-3 gap-2 flex-shrink-0">
  <input
    value={draft}
    onChange={e => setDraft(e.target.value)}
    placeholder="Add a signature (e.g., Shohei Ohtani)"
    className={`col-span-2 input-base w-full px-3 py-2 rounded-xl outline-none placeholder:text-muted focus:ring-2 ring-accent`}
    aria-label="Add signature"
  />
  <button
    onClick={onAdd}
    className="rounded-xl bg-accent text-white font-medium inline-flex items-center justify-center gap-2 px-3 py-2 hover:brightness-[1.05] active:brightness-[.95]"
  >
    <Plus className="h-4 w-4" /> Add
  </button>
</div>

{/* Filter */}
<div className="mt-3 flex items-center gap-2 flex-shrink-0">
  <div className="flex-1 relative">
    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
    <input
      value={filter}
      onChange={e => setFilter(e.target.value)}
      placeholder="Filter…"
      className={`pl-9 input-base w-full px-3 py-2 rounded-xl outline-none placeholder:text-muted focus:ring-2 ring-accent`}
      aria-label="Filter signatures"
    />
  </div>
  <div className="text-sm text-muted whitespace-nowrap">
    Showing <span className="text-app">{shown.length}</span> • Enabled <span className="text-app">{enabledCount}</span>
  </div>
</div>

{/* Sliders */}
<div className="mt-4 grid grid-cols-2 gap-3 flex-shrink-0">
  <LabeledSlider label="Roughness" defaultValue={0.6} onChange={v => setRoughness(v)} />
  <LabeledSlider label="Metalness" defaultValue={0.05} onChange={v => setMetalness(v)} />
</div>

{/* Signature list (scrollable) */}
<div className="mt-4 flex-1 overflow-auto rounded-xl border panel">
  <ul className="divide-y"
      style={{ borderColor: "var(--panel-border)" }}>
    {shown.map((sig) => (
      <li
        key={sig.id}
        className="flex items-center gap-2 px-3 py-2 transition
                   hover:bg-black/5 dark:hover:bg-white/5"
      >
        <label className="flex items-center gap-2 cursor-pointer select-none flex-1">
          <input
            type="checkbox"
            checked={sig.enabled}
            onChange={() => toggleSignature(sig.id)}
            aria-label={`Toggle ${sig.name}`}
            className="h-4 w-4 accent-[hsl(var(--accent-h)_var(--accent-s)_var(--accent-l))]"
          />
          <span className={`truncate ${sig.enabled ? "text-app" : "text-muted"}`}>
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
</div>


      {/* Export texture button */}
      <div className="mt-3 flex-shrink-0">
        <ExportTextureButton />
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
    </div>
  );
}
