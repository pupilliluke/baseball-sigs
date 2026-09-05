import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, Trash2, FolderOpen, RefreshCw, AlertCircle } from "lucide-react";
import { useSigStore, SPORTS, FALLBACK_CATEGORY } from "../../store/sigStore";
import { getUserProjects, deleteProject, resolveUserId } from "../../services/projectService";
import Dialog from "../ui/Dialog";
import ConfirmDialog from "../ui/ConfirmDialog";

/**
 * Global "My Projects" dialog, controlled via the store so it can be opened
 * from anywhere (panel Load button, post-sign-in, …).
 */
export default function ProjectListDialog() {
  const {
    sport,
    setSport,
    projects,
    setProjects,
    isLoadingProjects,
    setLoadingProjects,
    currentProjectId,
    setCurrentProject,
    clearCurrentProject,
    loadProjectSignatures,
    showProjectsDialog,
    closeProjectsDialog,
    pushToast,
    user,
  } = useSigStore();

  const navigate = useNavigate();
  const location = useLocation();
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // {id, name}
  const [loadError, setLoadError] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    setLoadError("");
    try {
      const list = await getUserProjects({ userId: await resolveUserId() });
      setProjects(list);
    } catch (error) {
      console.error("Error loading projects:", error);
      setProjects([]);
      setLoadError("Couldn't load your projects — check your connection and try again.");
    }
    setLoadingProjects(false);
  }, [setLoadingProjects, setProjects]);

  useEffect(() => {
    if (showProjectsDialog) {
      // Start unfiltered: the component never unmounts, so a filter left over
      // from a previous account could otherwise hide every list with no chip
      // on screen to clear it.
      setSportFilter("all");
      setCategoryFilter("all");
      loadProjects();
    }
  }, [showProjectsDialog, loadProjects]);

  const handleDelete = async (projectId, projectName) => {
    setDeletingId(projectId);
    try {
      await deleteProject(projectId);
      setProjects(projects.filter(p => p.id !== projectId));
      if (currentProjectId === projectId) clearCurrentProject();
      pushToast(`"${projectName}" deleted`, "info");
    } catch (error) {
      console.error("Error deleting project:", error);
      pushToast("Failed to delete project — try again", "error");
    }
    setDeletingId(null);
  };

  const handleLoad = (project) => {
    if (project.sport && project.sport !== sport) setSport(project.sport);
    setCurrentProject(project.id, project.projectName, project.category || FALLBACK_CATEGORY);
    loadProjectSignatures(project.signatures || project.signatureNames || []);
    const count = (project.signatures || project.signatureNames || []).length;
    pushToast(`Loaded "${project.projectName}" — ${count} signature${count === 1 ? "" : "s"}`);
    closeProjectsDialog();
    if (location.pathname !== "/studio") navigate("/studio");
  };

  // Filter chips are built from what the account actually has saved
  const sportsPresent = [...new Set(projects.map(p => p.sport).filter(Boolean))];
  const categoriesPresent = [...new Set(projects.map(p => p.category || FALLBACK_CATEGORY))];
  const visibleProjects = projects.filter(p =>
    (sportFilter === "all" || p.sport === sportFilter) &&
    (categoryFilter === "all" || (p.category || FALLBACK_CATEGORY) === categoryFilter)
  );

  const chip = (active) =>
    `px-2.5 py-1 rounded-full text-xs transition border ${
      active ? "bg-accent/15 text-accent border-accent/40 font-medium" : "text-muted border-transparent hover:bg-black/5 dark:hover:bg-white/10"
    }`;

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

  return (
    <Dialog open={showProjectsDialog} onClose={closeProjectsDialog} title="My Projects" maxWidth="max-w-2xl">
      {isLoadingProjects ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : loadError ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-400/70" />
          <div className="text-muted mb-4">{loadError}</div>
          <button
            onClick={loadProjects}
            className="px-4 py-2 rounded-xl border btn-glass transition inline-flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <div className="text-lg mb-2">No saved projects</div>
          <div className="text-sm">Save your first signature list to get started</div>
        </div>
      ) : (
        <div className="space-y-3">
          {(sportsPresent.length > 1 || categoriesPresent.length > 1) && (
            <div className="flex flex-col gap-2 pb-1">
              {sportsPresent.length > 1 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="section-label mr-1">Sport</span>
                  <button className={chip(sportFilter === "all")} onClick={() => setSportFilter("all")}>All</button>
                  {sportsPresent.map(sp => (
                    <button key={sp} className={chip(sportFilter === sp)} onClick={() => setSportFilter(sp)}>
                      {(SPORTS[sp] || SPORTS.baseball).emoji} {(SPORTS[sp] || SPORTS.baseball).label}
                    </button>
                  ))}
                </div>
              )}
              {categoriesPresent.length > 1 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="section-label mr-1">Type</span>
                  <button className={chip(categoryFilter === "all")} onClick={() => setCategoryFilter("all")}>All</button>
                  {categoriesPresent.map(c => (
                    <button key={c} className={chip(categoryFilter === c)} onClick={() => setCategoryFilter(c)}>{c}</button>
                  ))}
                </div>
              )}
            </div>
          )}
          {visibleProjects.length === 0 && (
            <div className="text-center py-8 text-muted text-sm">
              <div className="mb-3">No lists match these filters.</div>
              <button
                onClick={() => { setSportFilter("all"); setCategoryFilter("all"); }}
                className="px-3 py-1.5 rounded-xl border btn-glass transition text-xs"
              >
                Show all {projects.length} list{projects.length === 1 ? "" : "s"}
              </button>
            </div>
          )}
          {visibleProjects.map((project) => {
            const roster = project.signatures || project.signatureNames || [];
            const names = roster.map(item => typeof item === "string" ? item : item.name);
            return (
              <div
                key={project.id}
                className={`p-3 sm:p-4 rounded-xl border transition cursor-pointer ${
                  currentProjectId === project.id
                    ? "bg-accent/10 border-accent/50"
                    : "panel hover:bg-black/5 dark:hover:bg-white/5"
                }`}
                onClick={() => handleLoad(project)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleLoad(project); } }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span aria-hidden="true">{(SPORTS[project.sport] || SPORTS.baseball).emoji}</span>
                      <h3 className="font-semibold text-app truncate">
                        {project.projectName}
                      </h3>
                      {currentProjectId === project.id && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted flex-wrap">
                      <span className="px-2 py-0.5 rounded-full panel border">{project.category || FALLBACK_CATEGORY}</span>
                      <span>{names.length} item{names.length === 1 ? "" : "s"}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span className="truncate">{formatDate(project.updatedAt)}</span>
                      </span>
                    </div>
                    {names.length > 0 && (
                      <div className="mt-2 text-xs text-muted/70 line-clamp-2">
                        {names.slice(0, 8).join(", ")}
                        {names.length > 8 && ` +${names.length - 8} more`}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete({ id: project.id, name: project.projectName }); }}
                    disabled={deletingId === project.id}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 disabled:opacity-50 flex-shrink-0"
                    title="Delete project"
                    aria-label={`Delete ${project.projectName}`}
                  >
                    {deletingId === project.id ? (
                      <div className="w-4 h-4 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!user && !isLoadingProjects && !loadError && (
        <div className="mt-4 pt-3 border-t text-xs text-muted" style={{ borderColor: "var(--panel-border)" }}>
          You're browsing as a guest — these projects are tied to this browser. Sign in
          (top right) to keep them with your Google account across devices.
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => handleDelete(confirmDelete.id, confirmDelete.name)}
        title="Delete project?"
        message={confirmDelete ? `"${confirmDelete.name}" will be permanently deleted from the cloud. This cannot be undone.` : ""}
        confirmLabel="Delete"
      />
    </Dialog>
  );
}
