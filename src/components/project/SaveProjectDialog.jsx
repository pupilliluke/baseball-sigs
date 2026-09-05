import React, { useEffect, useState } from "react";
import { Save, FilePlus2 } from "lucide-react";
import { useSigStore, SPORTS } from "../../store/sigStore";
import { createProject, updateProject, getUserId } from "../../services/projectService";
import Dialog from "../ui/Dialog";

export default function SaveProjectDialog({ isOpen, onClose }) {
  const {
    sport,
    signatures,
    currentProjectId,
    currentProjectName,
    currentCategory,
    setCurrentProject,
    addCustomCategory,
    knownCategories,
    pushToast,
  } = useSigStore();

  const [projectName, setProjectName] = useState("");
  const [category, setCategory] = useState(currentCategory);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Sync the field with the loaded project every time the dialog opens
  useEffect(() => {
    if (isOpen) {
      setProjectName(currentProjectName || "");
      setCategory(currentCategory);
      setError("");
    }
  }, [isOpen, currentProjectName, currentCategory]);

  const enabledCount = signatures.filter(s => s.enabled).length;

  const doSave = async (asNew) => {
    const name = projectName.trim();
    if (!name) {
      setError("Project name is required");
      return;
    }

    setIsSaving(true);
    setError("");

    // Persist the full roster with enabled flags; keep the legacy
    // signatureNames field (enabled-only) for older documents/readers.
    const categoryName = (category || "").trim() || "Autographs";
    const payload = {
      projectName: name,
      sport,
      category: categoryName,
      signatureNames: signatures.filter(s => s.enabled).map(s => s.name),
      signatures: signatures.map(s => ({ name: s.name, enabled: s.enabled })),
    };

    try {
      addCustomCategory(categoryName);
      if (currentProjectId && !asNew) {
        await updateProject({ projectId: currentProjectId, ...payload });
        setCurrentProject(currentProjectId, name, categoryName);
        pushToast(`"${name}" updated`);
      } else {
        const result = await createProject({ userId: getUserId(), ...payload });
        setCurrentProject(result.id, name, categoryName);
        pushToast(`"${name}" saved`);
      }
      onClose();
    } catch (err) {
      console.error("Error saving project:", err);
      setError(err.message || "Failed to save project — check your connection and try again.");
    }
    setIsSaving(false);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={currentProjectId ? "Update Project" : "Save Project"}
    >
      <form onSubmit={(e) => { e.preventDefault(); doSave(false); }}>
        <div className="mb-4">
          <label htmlFor="project-name" className="block text-sm font-medium mb-2">
            Project Name
          </label>
          <input
            id="project-name"
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Enter project name..."
            className="w-full px-3 py-2 rounded-xl border input-base outline-none focus:ring-2 ring-accent placeholder:text-muted"
            disabled={isSaving}
            autoFocus
          />
        </div>

        <div className="mb-4">
          <label htmlFor="project-category" className="block text-sm font-medium mb-2">
            Category
          </label>
          <input
            id="project-category"
            list="fs-category-options"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Autographs"
            maxLength={40}
            className="w-full px-3 py-2 rounded-xl border input-base outline-none focus:ring-2 ring-accent placeholder:text-muted"
            disabled={isSaving}
          />
          <datalist id="fs-category-options">
            {knownCategories().map((c) => <option key={c} value={c} />)}
          </datalist>
          <p className="text-xs text-muted mt-1.5">
            Pick one or type a new category — it's saved under {(SPORTS[sport] || SPORTS.baseball).label}.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-500 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4 p-3 rounded-xl panel border">
          <div className="text-sm text-muted mb-1">
            {signatures.length} signature{signatures.length === 1 ? "" : "s"} • {enabledCount} on the ball
          </div>
          <div className="text-xs text-muted/70">
            {signatures.slice(0, 5).map(s => s.name).join(", ")}
            {signatures.length > 5 && ` +${signatures.length - 5} more`}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 py-3 sm:py-2 rounded-xl border btn-glass transition"
          >
            Cancel
          </button>
          {currentProjectId && (
            <button
              type="button"
              onClick={() => doSave(true)}
              disabled={isSaving}
              className="flex-1 px-4 py-3 sm:py-2 rounded-xl border btn-glass transition inline-flex items-center justify-center gap-2"
              title="Save a copy as a new project"
            >
              <FilePlus2 className="h-4 w-4" />
              Save as New
            </button>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 px-4 py-3 sm:py-2 rounded-xl bg-accent hover:brightness-[1.05] text-white transition inline-flex items-center justify-center gap-2 disabled:opacity-60"
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
    </Dialog>
  );
}
