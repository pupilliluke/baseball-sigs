import React, { useState, useEffect } from "react";
import { X, Calendar, Trash2, Edit, FolderOpen, Check } from "lucide-react";
import { useSigStore } from "../../store/sigStore";
import { getUserProjects, deleteProject, getUserId } from "../../services/projectService";

export default function ProjectListDialog({ isOpen, onClose, onLoadProject }) {
  const { 
    projects, 
    setProjects, 
    isLoadingProjects, 
    setLoadingProjects,
    currentProjectId 
  } = useSigStore();
  
  const [deletingId, setDeletingId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadProjects();
      setSuccess("");
      setLoadingId(null);
    }
  }, [isOpen]);

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const projects = await getUserProjects({ userId: getUserId() });
      setProjects(projects);
    } catch (error) {
      console.error("Error loading projects:", error);
      setProjects([]);
    }
    setLoadingProjects(false);
  };

  const handleDelete = async (projectId, projectName) => {
    if (!confirm(`Delete "${projectName}"? This cannot be undone.`)) return;
    
    setDeletingId(projectId);
    try {
      await deleteProject(projectId);
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project: " + error.message);
    }
    
    setDeletingId(null);
  };

  const handleLoad = async (project) => {
    setLoadingId(project.id);
    setSuccess("");
    
    try {
      onLoadProject(project);
      setSuccess(`"${project.projectName}" loaded successfully!`);
      
      // Auto-close after showing success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error loading project:", error);
      setSuccess("");
    } finally {
      setLoadingId(null);
    }
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="rounded-2xl p-4 sm:p-6 panel border w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">My Projects</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-green-500/20 border border-green-500/50 text-green-400 text-sm">
            {success}
          </div>
        )}

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
                  className={`p-3 sm:p-4 rounded-xl border transition ${
                    currentProjectId === project.id
                      ? "bg-accent/10 border-accent/50"
                      : "panel border-white/10 hover:bg-white/10 dark:hover:bg-white/5"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                          <span className="truncate">{formatDate(project.updatedAt)}</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 justify-end sm:ml-4">
                      <button
                        onClick={() => handleLoad(project)}
                        disabled={loadingId === project.id}
                        className="p-2 rounded-lg hover:bg-white/10 text-accent disabled:opacity-50 touch-manipulation"
                        title="Load project"
                      >
                        {loadingId === project.id ? (
                          <div className="w-4 h-4 border border-accent/30 border-t-accent rounded-full animate-spin" />
                        ) : (
                          <Edit className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(project.id, project.projectName)}
                        disabled={deletingId === project.id}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 disabled:opacity-50 touch-manipulation"
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
                    <div className="mt-3 p-2 rounded-lg panel border border-white/10">
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
            className="w-full px-4 py-2 rounded-xl border border-white/10 btn-glass transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}