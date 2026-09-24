import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, RefreshCw, AlertCircle, FolderOpen, Eye } from "lucide-react";
import { useSigStore, SPORTS, FALLBACK_CATEGORY } from "../store/sigStore";
import { getPublicProjects } from "../services/projectService";
import Hint from "../components/ui/Hint";

// The collector whose shelf the page opens on
const FEATURED_OWNER = "njD1EaunPXPDq7MrH0CGLMqohP92";

const itemsOf = (p) => (p.signatures || p.signatureNames || []);
const nameOf = (i) => (typeof i === "string" ? i : i.name);

export default function Community() {
  const { setSport, setCurrentProject, loadProjectSignatures, pushToast, user } = useSigStore();
  const navigate = useNavigate();

  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [owner, setOwner] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setLists(await getPublicProjects());
    } catch (e) {
      console.error("Could not load shared lists:", e);
      setError("Couldn't load shared collections — check your connection and try again.");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Group every shared list by the person who made it
  const owners = useMemo(() => {
    const map = new Map();
    lists.forEach(l => {
      const id = l.userId;
      if (!map.has(id)) {
        map.set(id, { id, name: l.ownerName || "A collector", lists: [], items: 0 });
      }
      const entry = map.get(id);
      entry.lists.push(l);
      entry.items += itemsOf(l).length;
      if (l.ownerName) entry.name = l.ownerName;
    });
    return [...map.values()].sort((a, b) => {
      if (a.id === FEATURED_OWNER) return -1;
      if (b.id === FEATURED_OWNER) return 1;
      return b.items - a.items;
    });
  }, [lists]);

  // Open on the featured collector, falling back to whoever is first
  useEffect(() => {
    if (!owners.length) { setOwner(null); return; }
    setOwner(prev => (prev && owners.some(o => o.id === prev) ? prev : owners[0].id));
  }, [owners]);

  const current = owners.find(o => o.id === owner);

  // A collector's shelf, split by sport
  const bySport = useMemo(() => {
    if (!current) return [];
    return Object.keys(SPORTS)
      .map(key => ({
        key,
        ...SPORTS[key],
        lists: current.lists.filter(l => (l.sport || "baseball") === key),
      }))
      .filter(group => group.lists.length > 0);
  }, [current]);

  const viewInStudio = (list) => {
    if (list.sport) setSport(list.sport);
    // Opened as a copy: viewing someone else's list must never overwrite theirs
    setCurrentProject(null, "", list.category || FALLBACK_CATEGORY);
    loadProjectSignatures(list.signatures || list.signatureNames || []);
    pushToast(`Viewing "${list.projectName}" — saving will create your own copy`);
    navigate("/studio");
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6 text-accent" /> Community
        </h1>
        <p className="text-muted text-sm mt-1">
          Collections people have chosen to share.
        </p>
      </div>

      <Hint className="mb-5">
        Browse what other collectors have shared, split by sport. Open any list to see it on the ball —
        it opens as your own copy, so nothing you do changes theirs. Your own lists are shared by default;
        switch any of them to private from <strong className="text-app">My Collection</strong>.
      </Hint>

      {loading ? (
        <div className="grid place-items-center py-20">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-400/70" />
          <div className="text-muted mb-4">{error}</div>
          <button onClick={load} className="px-4 py-2 rounded-xl border btn-glass inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      ) : !owners.length ? (
        <div className="text-center py-16 text-muted panel-elevated border rounded-2xl">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <div className="text-lg mb-1 text-app">Nothing shared yet</div>
          <div className="text-sm">When people share a collection, it shows up here.</div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Who's sharing */}
          <aside className="w-full lg:w-64 lg:sticky lg:top-4 flex-shrink-0">
            <div className="section-label mb-2">Collectors</div>
            <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1">
              {owners.map(o => {
                const active = o.id === owner;
                return (
                  <button
                    key={o.id}
                    onClick={() => setOwner(o.id)}
                    className={`text-left px-3.5 py-3 rounded-2xl border transition flex-shrink-0 lg:w-full ${
                      active ? "bg-accent/10 border-accent/50" : "panel-elevated hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <div className={`font-semibold truncate ${active ? "text-accent" : "text-app"}`}>
                      {o.name}
                      {o.id === user?.uid && <span className="text-xs font-normal text-muted"> · you</span>}
                    </div>
                    <div className="text-xs text-muted mt-0.5 whitespace-nowrap">
                      {o.lists.length} list{o.lists.length === 1 ? "" : "s"} · {o.items} item{o.items === 1 ? "" : "s"}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* The chosen collector's shelf */}
          <div className="flex-1 min-w-0 w-full">
            {current && (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold tracking-tight">{current.name}</h2>
                  <p className="text-sm text-muted mt-0.5">
                    {current.lists.length} shared list{current.lists.length === 1 ? "" : "s"} · {current.items} item{current.items === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="flex flex-col gap-10">
                  {bySport.map(group => (
                    <section key={group.key}>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-lg" aria-hidden="true">{group.emoji}</span>
                        <h3 className="text-base font-semibold tracking-tight">{group.label}</h3>
                        <span className="text-xs text-muted">
                          {group.lists.length} list{group.lists.length === 1 ? "" : "s"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-3">
                        {group.lists.map(list => {
                          const names = itemsOf(list).map(nameOf);
                          return (
                            <article key={list.id} className="panel-elevated border rounded-2xl p-5">
                              <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div className="min-w-0">
                                  <h4 className="font-semibold text-app text-lg leading-tight">{list.projectName}</h4>
                                  <div className="flex items-center gap-2 mt-1.5 text-xs text-muted flex-wrap">
                                    <span className="px-2 py-0.5 rounded-full panel border">
                                      {list.category || FALLBACK_CATEGORY}
                                    </span>
                                    <span>{names.length} item{names.length === 1 ? "" : "s"}</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => viewInStudio(list)}
                                  className="px-3 py-2 rounded-xl border btn-glass text-sm inline-flex items-center gap-1.5 flex-shrink-0"
                                  title="Open a copy of this list in the studio"
                                >
                                  <Eye className="h-4 w-4" /> View on ball
                                </button>
                              </div>

                              {names.length > 0 && (
                                <ul className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
                                  {names.map((n, i) => (
                                    <li key={`${list.id}-${i}`} className="text-sm text-muted leading-relaxed flex gap-2">
                                      <span className="text-muted/40 tabular-nums w-5 flex-shrink-0 text-right">{i + 1}</span>
                                      <span className="min-w-0">{n}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>

                {!bySport.length && (
                  <div className="text-center py-12 text-muted panel-elevated border rounded-2xl">
                    <FolderOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    Nothing shared here yet.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
