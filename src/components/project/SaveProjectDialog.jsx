import React, { useState } from "react";
import { Save, X } from "lucide-react";
import { useSigStore } from "../../store/sigStore";
import { createProject, updateProject, getUserId } from "../../services/projectService";

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
  const [success, setSuccess] = useState("");

  const handleSave = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setError("Project name is required");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    const enabledSignatures = signatures
      .filter(sig => sig.enabled)
      .map(sig => sig.name);

    try {
      let result;
      if (currentProjectId) {
        // Update existing project
        await updateProject({
          projectId: currentProjectId,
          projectName: projectName.trim(),
          signatureNames: enabledSignatures
        });
        result = { id: currentProjectId };
      } else {
        // Save new project
        result = await createProject({
          userId: getUserId(),
          projectName: projectName.trim(),
          signatureNames: enabledSignatures
        });
      }

      if (result.id) {
        setCurrentProject(result.id, projectName.trim());
      }
      const message = currentProjectId ? "Project updated successfully!" : "Project saved successfully!";
      setSuccess(message);
      
      // Auto-close after showing success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error saving project:", error);
      setError(error.message || "Failed to save project");
    }

    setIsSaving(false);
  };

  const handleClose = () => {
    setProjectName(currentProjectName);
    setError("");
    setSuccess("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 dark:bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl p-4 sm:p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-white/20 text-black dark:text-white w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
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
              className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-white/5 outline-none focus:ring-2 ring-accent placeholder:text-gray-500 dark:placeholder:text-muted text-black dark:text-white"
              disabled={isSaving}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-xl bg-green-500/20 border border-green-500/50 text-green-400 text-sm">
              {success}
            </div>
          )}

          <div className="mb-4 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
            <div className="text-sm text-gray-600 dark:text-muted mb-1">
              Enabled signatures ({signatures.filter(s => s.enabled).length})
            </div>
            <div className="text-xs text-gray-500 dark:text-muted/70">
              {signatures.filter(s => s.enabled).map(s => s.name).slice(0, 5).join(", ")}
              {signatures.filter(s => s.enabled).length > 5 && "..."}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="flex-1 px-4 py-3 sm:py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-black dark:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-3 sm:py-2 rounded-xl bg-accent hover:brightness-[1.05] text-white transition inline-flex items-center justify-center gap-2"
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