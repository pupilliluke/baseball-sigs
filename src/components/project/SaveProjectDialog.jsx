import React, { useState } from "react";
import { Save, X } from "lucide-react";
import { useSigStore } from "../../store/sigStore";
import { saveProject, updateProject } from "../../services/projectService";

export default function SaveProjectDialog({ isOpen, onClose }) {
  const { 
    signatures, 
    currentProjectId, 
    currentProjectName, 
    setCurrentProject 
  } = useSigStore();
  
  const [projectName, setProjectName] = useState(currentProjectName);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setError("Project name is required");
      return;
    }

    setIsSaving(true);
    setError("");

    const enabledSignatures = signatures
      .filter(sig => sig.enabled)
      .map(sig => sig.name);

    let result;
    if (currentProjectId) {
      // Update existing project
      result = await updateProject(currentProjectId, projectName.trim(), enabledSignatures);
    } else {
      // Save new project
      result = await saveProject(projectName.trim(), enabledSignatures);
    }

    if (result.success) {
      if (result.id) {
        setCurrentProject(result.id, projectName.trim());
      }
      onClose();
    } else {
      setError(result.error || "Failed to save project");
    }

    setIsSaving(false);
  };

  const handleClose = () => {
    setProjectName(currentProjectName);
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl p-6 panel border w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            {currentProjectId ? "Update Project" : "Save Project"}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name..."
              className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 outline-none focus:ring-2 ring-accent"
              disabled={isSaving}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-sm text-muted mb-1">
              Enabled signatures ({signatures.filter(s => s.enabled).length})
            </div>
            <div className="text-xs text-muted/70">
              {signatures.filter(s => s.enabled).map(s => s.name).slice(0, 5).join(", ")}
              {signatures.filter(s => s.enabled).length > 5 && "..."}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 rounded-xl bg-accent hover:brightness-[1.05] text-white transition inline-flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {currentProjectId ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}