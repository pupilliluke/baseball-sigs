import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Trash2, Pencil, Copy, Download, FolderOpen, Plus,
  RefreshCw, AlertCircle, Tag, Upload,
} from "lucide-react";
import { useSigStore, SPORTS, FALLBACK_CATEGORY, DEFAULT_CATEGORIES } from "../store/sigStore";
import {
  getUserProjects, deleteProject, updateProject, createProject, resolveUserId,
  getUserCategories, saveUserCategories, renameCategoryEverywhere,
} from "../services/projectService";
import Dialog from "../components/ui/Dialog";
import ConfirmDialog from "../components/ui/ConfirmDialog";

const ghost = "btn-ghost px-2.5 py-2 text-sm inline-flex items-center gap-1.5";
const itemsOf = (p) => (p.signatures || p.signatureNames || []);
const nameOf = (i) => (typeof i === "string" ? i : i.name);

export default function Collection() {
  const {
    user, authReady, projects, setProjects,
    accountCategories, setAccountCategories, knownCategories,
    setSport, setCurrentProject, loadProjectSignatures,
    currentProjectId, pushToast,
  } = useSigStore();

  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selected, setSelected] = useState(() => new Set());
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [showCategories, setShowCategories] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const owner = await resolveUserId();
      const [list, cats] = await Promise.all([
        getUserProjects({ userId: owner }),
        getUserCategories(owner),
      ]);
      setProjects(list);
      setAccountCategories(cats);
    } catch (error) {
      console.error("Could not load your collection:", error);
      setLoadError("Couldn't load your collection — check your connection and try again.");
    }
    setLoading(false);
  }, [setProjects, setAccountCategories]);

  useEffect(() => { if (authReady) load(); }, [authReady, user?.uid, load]);

  const categories = knownCategories();

  const visible = useMemo(() => projects.filter(p => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q
      || p.projectName.toLowerCase().includes(q)
      || itemsOf(p).some(i => nameOf(i).toLowerCase().includes(q));
    return matchesSearch
      && (sportFilter === "all" || p.sport === sportFilter)
      && (categoryFilter === "all" || (p.category || FALLBACK_CATEGORY) === categoryFilter);
  }), [projects, search, sportFilter, categoryFilter]);

  const totals = useMemo(() => ({
    lists: projects.length,
    items: projects.reduce((n, p) => n + itemsOf(p).length, 0),
    categories: new Set(projects.map(p => p.category || FALLBACK_CATEGORY)).size,
  }), [projects]);

  const openInStudio = (project) => {
    if (project.sport) setSport(project.sport);
    setCurrentProject(project.id, project.projectName, project.category || FALLBACK_CATEGORY);
    loadProjectSignatures(project.signatures || project.signatureNames || []);
    pushToast(`Opened "${project.projectName}" in the studio`);
    navigate("/studio");
  };

  function download(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const doDelete = async (ids) => {
    setBusy(true);
    try {
      await Promise.all(ids.map(id => deleteProject(id)));
      setProjects(projects.filter(p => !ids.includes(p.id)));
      setSelected(new Set());
      pushToast(`Deleted ${ids.length} list${ids.length === 1 ? "" : "s"}`, "info");
    } catch (error) {
      console.error("Delete failed:", error);
      pushToast("Couldn't delete — try again", "error");
    }
    setBusy(false);
  };

  const duplicate = async (project) => {
    setBusy(true);
    try {
      const owner = await resolveUserId();
      const items = itemsOf(project);
      await createProject({
        userId: owner,
        projectName: `${project.projectName} (copy)`.slice(0, 100),
        sport: project.sport,
        category: project.category || FALLBACK_CATEGORY,
        signatureNames: items.filter(i => typeof i === "string" || i.enabled !== false).map(nameOf),
        signatures: items.map(i => (typeof i === "string" ? { name: i, enabled: true } : i)),
      });
      await load();
      pushToast(`Duplicated "${project.projectName}"`);
    } catch (error) {
      console.error("Duplicate failed:", error);
      pushToast("Couldn't duplicate — try again", "error");
    }
    setBusy(false);
  };

  const exportOne = (project) => {
    download(`${project.projectName.replace(/[^\w-]+/g, "-").toLowerCase()}.json`, {
      projectName: project.projectName,
      sport: project.sport,
      category: project.category || FALLBACK_CATEGORY,
      items: itemsOf(project).map(i => (typeof i === "string" ? { name: i, enabled: true } : i)),
    });
  };

  const exportAll = () => {
    download(`collection-backup-${new Date().toISOString().slice(0, 10)}.json`, {
      exportedAt: new Date().toISOString(),
      categories,
      lists: projects.map(p => ({
        projectName: p.projectName,
        sport: p.sport,
        category: p.category || FALLBACK_CATEGORY,
        items: itemsOf(p).map(i => (typeof i === "string" ? { name: i, enabled: true } : i)),
      })),
    });
    pushToast(`Backed up ${projects.length} list${projects.length === 1 ? "" : "s"} to a file`);
  };

  const importFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const parsed = JSON.parse(await file.text());
      const lists = Array.isArray(parsed) ? parsed : (parsed.lists || [parsed]);
      const owner = await resolveUserId();
      let added = 0;
      for (const l of lists) {
        const items = (l.items || l.signatures || l.signatureNames || [])
          .map(i => (typeof i === "string" ? { name: i, enabled: true } : i))
          .filter(i => i && i.name);
        if (!l.projectName || !items.length) continue;
        await createProject({
          userId: owner,
          projectName: String(l.projectName).slice(0, 100),
          sport: SPORTS[l.sport] ? l.sport : "baseball",
          category: String(l.category || FALLBACK_CATEGORY).slice(0, 40),
          signatureNames: items.filter(i => i.enabled !== false).map(i => i.name),
          signatures: items,
        });
        added++;
      }
      await load();
      pushToast(
        added ? `Imported ${added} list${added === 1 ? "" : "s"}` : "Nothing importable in that file",
        added ? "success" : "info"
      );
    } catch (error) {
      console.error("Import failed:", error);
      pushToast("Couldn't read that file — expected a collection export", "error");
    }
    setBusy(false);
  };

  const saveEdit = async (changes) => {
    setBusy(true);
    try {
      await updateProject({ projectId: editing.id, ...changes });
      setProjects(projects.map(p => (p.id === editing.id ? { ...p, ...changes } : p)));
      if (currentProjectId === editing.id) {
        setCurrentProject(editing.id, changes.projectName, changes.category);
      }
      pushToast(`Updated "${changes.projectName}"`);
      setEditing(null);
    } catch (error) {
      console.error("Update failed:", error);
      pushToast("Couldn't save those changes — try again", "error");
    }
    setBusy(false);
  };

  const moveSelectedTo = async (category) => {
    const ids = [...selected];
    setBusy(true);
    try {
      await Promise.all(ids.map(id => updateProject({ projectId: id, category })));
      setProjects(projects.map(p => (ids.includes(p.id) ? { ...p, category } : p)));
      setSelected(new Set());
      pushToast(`Moved ${ids.length} list${ids.length === 1 ? "" : "s"} to ${category}`);
    } catch (error) {
      console.error("Move failed:", error);
      pushToast("Couldn't move those lists — try again", "error");
    }
    setBusy(false);
  };

  const toggleSelect = (id) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const chip = (active) =>
    `px-2.5 py-1 rounded-full text-xs transition border ${
      active
        ? "bg-accent/15 text-accent border-accent/40 font-medium"
        : "text-muted border-transparent hover:bg-black/5 dark:hover:bg-white/10"
    }`;

  const formatDate = (d) =>
    d ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d) : "—";

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Collection</h1>
          <p className="text-muted text-sm mt-1">
            {loading
              ? "Loading…"
              : `${totals.lists} list${totals.lists === 1 ? "" : "s"} · ${totals.items} item${totals.items === 1 ? "" : "s"} · ${totals.categories} categor${totals.categories === 1 ? "y" : "ies"}`}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <button onClick={() => setShowCategories(true)} className={ghost} title="Create and manage categories">
            <Tag className="h-4 w-4" /> Categories
          </button>
          <label className={`${ghost} cursor-pointer`} title="Import lists from a file">
            <Upload className="h-4 w-4" /> Import
            <input type="file" accept="application/json,.json" className="sr-only" onChange={importFile} />
          </label>
          <button
            onClick={exportAll}
            disabled={!projects.length}
            className={`${ghost} disabled:opacity-40`}
            title="Download every list as a backup file"
          >
            <Download className="h-4 w-4" /> Back up all
          </button>
          <button
            onClick={() => navigate("/studio")}
            className="px-3 py-2 rounded-xl bg-accent text-white text-sm font-medium inline-flex items-center gap-1.5 hover:brightness-[1.05] transition"
          >
            <Plus className="h-4 w-4" /> New list
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="panel-elevated border rounded-2xl p-3 mb-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search lists and items…"
              className="pl-9 input-base w-full px-3.5 py-2 rounded-xl outline-none placeholder:text-muted focus:ring-2 ring-accent border text-sm"
              aria-label="Search collection"
            />
          </div>
          <button onClick={load} className={ghost} title="Reload from the cloud" aria-label="Reload collection">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <span className="section-label mr-1">Sport</span>
          <button className={chip(sportFilter === "all")} onClick={() => setSportFilter("all")}>All</button>
          {Object.entries(SPORTS).map(([k, v]) => (
            <button key={k} className={chip(sportFilter === k)} onClick={() => setSportFilter(k)}>
              {v.emoji} {v.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <span className="section-label mr-1">Type</span>
          <button className={chip(categoryFilter === "all")} onClick={() => setCategoryFilter("all")}>All</button>
          {categories.map(c => (
            <button key={c} className={chip(categoryFilter === c)} onClick={() => setCategoryFilter(c)}>{c}</button>
          ))}
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="panel-elevated border rounded-2xl p-3 mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="flex-1" />
          <label htmlFor="bulk-move" className="text-xs text-muted">Move to</label>
          <select
            id="bulk-move"
            onChange={e => { if (e.target.value) { moveSelectedTo(e.target.value); e.target.value = ""; } }}
            defaultValue=""
            className="input-base border rounded-lg px-2 py-1.5 text-sm outline-none [&>option]:text-black"
          >
            <option value="" disabled>Choose…</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={() => setConfirm({
              title: `Delete ${selected.size} list${selected.size === 1 ? "" : "s"}?`,
              message: "This permanently removes them from the cloud. This cannot be undone.",
              label: "Delete",
              onConfirm: () => doDelete([...selected]),
            })}
            className="px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 text-sm inline-flex items-center gap-1.5"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
          <button onClick={() => setSelected(new Set())} className={ghost}>Clear</button>
        </div>
      )}

      {/* Body */}
      {loading ? (
        <div className="grid place-items-center py-20">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : loadError ? (
        <div className="text-center py-16">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-400/70" />
          <div className="text-muted mb-4">{loadError}</div>
          <button onClick={load} className="px-4 py-2 rounded-xl border btn-glass inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 text-muted panel-elevated border rounded-2xl">
          <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <div className="text-lg mb-1 text-app">Nothing saved yet</div>
          <div className="text-sm mb-5">Build a list in the studio and save it — it&apos;ll show up here.</div>
          <button onClick={() => navigate("/studio")} className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium">
            Open the studio
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16 text-muted panel-elevated border rounded-2xl">
          <div className="mb-3">No lists match your search or filters.</div>
          <button
            onClick={() => { setSearch(""); setSportFilter("all"); setCategoryFilter("all"); }}
            className="px-3 py-1.5 rounded-xl border btn-glass text-xs"
          >
            Show all {projects.length}
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visible.map(p => {
            const items = itemsOf(p);
            const names = items.map(nameOf);
            const isCurrent = currentProjectId === p.id;
            return (
              <div
                key={p.id}
                className={`panel-elevated border rounded-2xl p-4 flex flex-col gap-3 transition ${isCurrent ? "border-accent/50" : ""}`}
              >
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    className="h-4 w-4 mt-1 flex-shrink-0"
                    aria-label={`Select ${p.projectName}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span aria-hidden="true">{(SPORTS[p.sport] || SPORTS.baseball).emoji}</span>
                      <button
                        onClick={() => openInStudio(p)}
                        className="font-semibold text-app truncate hover:text-accent transition text-left"
                        title="Open in the studio"
                      >
                        {p.projectName}
                      </button>
                      {isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent">Open</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted flex-wrap">
                      <span className="px-2 py-0.5 rounded-full panel border">{p.category || FALLBACK_CATEGORY}</span>
                      <span>{items.length} item{items.length === 1 ? "" : "s"}</span>
                      <span>{formatDate(p.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted/80 line-clamp-2 min-h-[2rem]">
                  {names.slice(0, 6).join(", ")}{names.length > 6 && ` +${names.length - 6} more`}
                </div>

                <div className="flex items-center gap-0.5 pt-1 border-t" style={{ borderColor: "var(--panel-border)" }}>
                  <button onClick={() => openInStudio(p)} className={`${ghost} text-xs`} title="Open in the studio">
                    <FolderOpen className="h-3.5 w-3.5" /> Open
                  </button>
                  <button onClick={() => setEditing(p)} className={`${ghost} text-xs`} title="Rename, recategorise, or change sport" aria-label={`Edit ${p.projectName}`}>
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => duplicate(p)} disabled={busy} className={`${ghost} text-xs`} title="Duplicate" aria-label={`Duplicate ${p.projectName}`}>
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => exportOne(p)} className={`${ghost} text-xs`} title="Download this list" aria-label={`Download ${p.projectName}`}>
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => setConfirm({
                      title: "Delete this list?",
                      message: `"${p.projectName}" will be permanently deleted from the cloud. This cannot be undone.`,
                      label: "Delete",
                      onConfirm: () => doDelete([p.id]),
                    })}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/10"
                    aria-label={`Delete ${p.projectName}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!user && authReady && !loading && (
        <p className="text-xs text-muted mt-5">
          You&apos;re browsing as a guest — this collection is tied to this browser. Sign in (top right) to
          keep it with your Google account across devices.
        </p>
      )}

      <EditListDialog
        project={editing}
        categories={categories}
        busy={busy}
        onClose={() => setEditing(null)}
        onSave={saveEdit}
      />
      <CategoriesDialog
        open={showCategories}
        onClose={() => setShowCategories(false)}
        categories={categories}
        accountCategories={accountCategories}
        projects={projects}
        onChanged={load}
      />
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm()}
        title={confirm?.title || ""}
        message={confirm?.message || ""}
        confirmLabel={confirm?.label || "Confirm"}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- editing */

function EditListDialog({ project, categories, busy, onClose, onSave }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(FALLBACK_CATEGORY);
  const [sport, setSport] = useState("baseball");

  useEffect(() => {
    if (project) {
      setName(project.projectName);
      setCategory(project.category || FALLBACK_CATEGORY);
      setSport(project.sport || "baseball");
    }
  }, [project]);

  return (
    <Dialog open={!!project} onClose={onClose} title="Edit list">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ projectName: name.trim(), category: category.trim() || FALLBACK_CATEGORY, sport });
        }}
      >
        <label htmlFor="edit-name" className="block text-sm font-medium mb-2">Name</label>
        <input
          id="edit-name"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={100}
          className="w-full px-3 py-2 rounded-xl border input-base outline-none focus:ring-2 ring-accent mb-4"
          autoFocus
        />

        <label htmlFor="edit-category" className="block text-sm font-medium mb-2">Category</label>
        <input
          id="edit-category"
          list="edit-category-options"
          value={category}
          onChange={e => setCategory(e.target.value)}
          maxLength={40}
          className="w-full px-3 py-2 rounded-xl border input-base outline-none focus:ring-2 ring-accent mb-4"
        />
        <datalist id="edit-category-options">
          {categories.map(c => <option key={c} value={c} />)}
        </datalist>

        <span className="block text-sm font-medium mb-2">Sport</span>
        <div className="flex gap-1 mb-5 flex-wrap">
          {Object.entries(SPORTS).map(([k, v]) => (
            <button
              type="button"
              key={k}
              onClick={() => setSport(k)}
              className={`px-3 py-2 rounded-xl text-sm border transition ${
                sport === k ? "bg-accent/15 text-accent border-accent/40 font-medium" : "btn-glass"
              }`}
            >
              {v.emoji} {v.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border btn-glass">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="flex-1 px-4 py-2 rounded-xl bg-accent text-white font-medium disabled:opacity-60"
          >
            Save changes
          </button>
        </div>
      </form>
    </Dialog>
  );
}

/* ------------------------------------------------------------- categories */

function CategoriesDialog({ open, onClose, categories, accountCategories, projects, onChanged }) {
  const { setAccountCategories, pushToast } = useSigStore();
  const [draft, setDraft] = useState("");
  const [renaming, setRenaming] = useState(null);
  const [busy, setBusy] = useState(false);

  const countFor = (c) => projects.filter(p => (p.category || FALLBACK_CATEGORY) === c).length;

  const create = async () => {
    const name = draft.trim();
    if (!name) return;
    if (categories.some(c => c.toLowerCase() === name.toLowerCase())) {
      pushToast(`"${name}" already exists`, "info");
      return;
    }
    setBusy(true);
    try {
      const owner = await resolveUserId();
      const saved = await saveUserCategories(owner, [...accountCategories, name]);
      setAccountCategories(saved);
      setDraft("");
      pushToast(`Category "${name}" created`);
    } catch (error) {
      console.error("Could not create category:", error);
      pushToast("Couldn't create that category — try again", "error");
    }
    setBusy(false);
  };

  const remove = async (name) => {
    setBusy(true);
    try {
      const owner = await resolveUserId();
      const saved = await saveUserCategories(owner, accountCategories.filter(c => c !== name));
      setAccountCategories(saved);
      pushToast(`Category "${name}" removed`, "info");
    } catch (error) {
      console.error("Could not remove category:", error);
      pushToast("Couldn't remove that category — try again", "error");
    }
    setBusy(false);
  };

  const commitRename = async () => {
    const from = renaming.from;
    const to = renaming.to.trim();
    if (!to || to === from) { setRenaming(null); return; }
    setBusy(true);
    try {
      const owner = await resolveUserId();
      const moved = await renameCategoryEverywhere({ userId: owner, from, to });
      const next = accountCategories.map(c => (c === from ? to : c));
      if (!next.includes(to)) next.push(to);
      const saved = await saveUserCategories(owner, next);
      setAccountCategories(saved);
      await onChanged();
      pushToast(moved ? `Renamed to "${to}" and moved ${moved} list${moved === 1 ? "" : "s"}` : `Renamed to "${to}"`);
      setRenaming(null);
    } catch (error) {
      console.error("Rename failed:", error);
      pushToast("Couldn't rename that category — try again", "error");
    }
    setBusy(false);
  };

  return (
    <Dialog open={open} onClose={onClose} title="Categories" maxWidth="max-w-lg">
      <div className="flex gap-2 mb-4">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); create(); } }}
          placeholder="New category (e.g. Ticket stubs)"
          maxLength={40}
          className="flex-1 px-3 py-2 rounded-xl border input-base outline-none focus:ring-2 ring-accent text-sm"
          aria-label="New category name"
        />
        <button
          onClick={create}
          disabled={busy || !draft.trim()}
          className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium disabled:opacity-40 inline-flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Create
        </button>
      </div>

      <ul className="divide-y rounded-xl border" style={{ borderColor: "var(--panel-border)" }}>
        {categories.map(c => {
          const built = DEFAULT_CATEGORIES.includes(c);
          const inUse = countFor(c);
          const isRenaming = renaming?.from === c;
          const removable = !built && accountCategories.includes(c) && inUse === 0;
          return (
            <li key={c} className="flex items-center gap-2 px-3 py-2.5">
              {isRenaming ? (
                <>
                  <input
                    value={renaming.to}
                    onChange={e => setRenaming({ from: c, to: e.target.value })}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); commitRename(); } }}
                    maxLength={40}
                    autoFocus
                    className="flex-1 px-2 py-1 rounded-lg border input-base outline-none focus:ring-2 ring-accent text-sm"
                    aria-label={`Rename ${c}`}
                  />
                  <button onClick={commitRename} disabled={busy} className={`${ghost} text-xs`}>Save</button>
                  <button onClick={() => setRenaming(null)} className={`${ghost} text-xs`}>Cancel</button>
                </>
              ) : (
                <>
                  <Tag className="h-3.5 w-3.5 text-muted flex-shrink-0" />
                  <span className="flex-1 truncate text-sm">{c}</span>
                  <span className="text-xs text-muted whitespace-nowrap">{inUse} list{inUse === 1 ? "" : "s"}</span>
                  <button
                    onClick={() => setRenaming({ from: c, to: c })}
                    className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                    aria-label={`Rename ${c}`}
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted" />
                  </button>
                  <button
                    onClick={() => remove(c)}
                    disabled={busy || !removable}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 disabled:opacity-25 disabled:hover:bg-transparent"
                    title={
                      built
                        ? "Built-in category"
                        : inUse > 0
                          ? "Still used by a saved list"
                          : "Remove category"
                    }
                    aria-label={`Remove ${c}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted mt-3">
        Renaming moves every list in that category. A category still used by a list can&apos;t be removed —
        move or delete those lists first.
      </p>
    </Dialog>
  );
}
