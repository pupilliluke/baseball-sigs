import React, { useState, useEffect } from "react";
import { X, Calendar, Trash2, Edit, FolderOpen } from "lucide-react";
import { useSigStore } from "../../store/sigStore";
import { loadUserProjects, deleteProject } from "../../services/projectService";

export default function ProjectListDialog({ isOpen, onClose, onLoadProject }) {
  const { 
    projects, 
    setProjects, 
    isLoadingProjects, 
    setLoadingProjects,
    currentProjectId 
  } = useSigStore();
  
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  const loadProjects = async () => {
    setLoadingProjects(true);
    const result = await loadUserProjects();
    if (result.success) {
      setProjects(result.projects);
    }
    setLoadingProjects(false);
  };

  const handleDelete = async (projectId, projectName) => {
    if (!confirm(`Delete "${projectName}"? This cannot be undone.`)) return;
    
    setDeletingId(projectId);
    const result = await deleteProject(projectId);
    
    if (result.success) {
      setProjects(projects.filter(p => p.id !== projectId));
    } else {
      alert("Failed to delete project: " + result.error);
    }
    
    setDeletingId(null);
  };

  const handleLoad = (project) => {
    onLoadProject(project);
    onClose();
  };

  const formatDate = (date) => {
    if (!date) return "Unknown";
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl p-6 panel border w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">My Projects</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {isLoadingProjects ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <div className="text-lg mb-2">No saved projects</div>
              <div className="text-sm">Save your first signature list to get started</div>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`p-4 rounded-xl border transition ${
                    currentProjectId === project.id
                      ? "bg-accent/10 border-accent/50"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-app truncate">
                          {project.projectName}
                        </h3>
                        {currentProjectId === project.id && (
                          <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted mb-2">
                        {project.signatureNames?.length || 0} signatures
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted/70">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(project.updatedAt)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-4">
                      <button
                        onClick={() => handleLoad(project)}
                        className="p-2 rounded-lg hover:bg-white/10 text-accent"
                        title="Load project"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(project.id, project.projectName)}
                        disabled={deletingId === project.id}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 disabled:opacity-50"
                        title="Delete project"
                      >
                        {deletingId === project.id ? (
                          <div className="w-4 h-4 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {project.signatureNames && project.signatureNames.length > 0 && (
                    <div className="mt-3 p-2 rounded-lg bg-white/5 border border-white/5">
                      <div className="text-xs text-muted/70 mb-1">Preview:</div>
                      <div className="text-xs text-muted">
                        {project.signatureNames.slice(0, 8).join(", ")}
                        {project.signatureNames.length > 8 && ` +${project.signatureNames.length - 8} more`}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}