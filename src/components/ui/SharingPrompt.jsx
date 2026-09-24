import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, Lock, ListChecks } from "lucide-react";
import { useSigStore } from "../../store/sigStore";
import { setProjectVisibility } from "../../services/projectService";
import Dialog from "./Dialog";

const answeredKey = (uid) => `fs_sharing_asked_${uid}`;

/**
 * Asks — once — whether someone wants the lists they saved before sharing
 * existed to appear on the Community page. Those lists stay private until
 * their owner decides, so this is the decision point rather than a notice
 * after the fact.
 */
export default function SharingPrompt() {
  const { user, authReady, projects, setProjects, pushToast } = useSigStore();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [answered, setAnswered] = useState(true);

  const privateLists = useMemo(
    () => projects.filter(p => p.visibility !== "public"),
    [projects]
  );

  // Only ask an account, only when there is something to decide about, and
  // only if this browser hasn't already had the conversation.
  useEffect(() => {
    if (!authReady || !user) { setAnswered(true); return; }
    try {
      setAnswered(localStorage.getItem(answeredKey(user.uid)) === "1");
    } catch {
      setAnswered(true);
    }
  }, [authReady, user]);

  const remember = () => {
    try { if (user) localStorage.setItem(answeredKey(user.uid), "1"); } catch { /* private mode */ }
    setAnswered(true);
  };

  const shareAll = async () => {
    setBusy(true);
    try {
      const ids = privateLists.map(p => p.id);
      await Promise.all(ids.map(id => setProjectVisibility({
        projectId: id,
        visibility: "public",
        ownerName: user?.displayName || undefined,
      })));
      setProjects(projects.map(p => (ids.includes(p.id) ? { ...p, visibility: "public" } : p)));
      pushToast(`${ids.length} list${ids.length === 1 ? "" : "s"} shared on the Community page`);
      remember();
    } catch (error) {
      console.error("Could not share those lists:", error);
      pushToast("Couldn't share those lists — try again", "error");
    }
    setBusy(false);
  };

  const keepPrivate = () => {
    remember();
    pushToast("Kept private — you can share any list later from My Collection", "info");
  };

  const chooseEach = () => {
    remember();
    navigate("/");
  };

  const count = privateLists.length;

  return (
    <Dialog
      open={authReady && !!user && !answered && count > 0}
      onClose={keepPrivate}
      title="Share your collection?"
    >
      <p className="text-sm text-muted leading-relaxed mb-3">
        You have <strong className="text-app">{count} list{count === 1 ? "" : "s"}</strong> saved from before
        sharing existed, so {count === 1 ? "it is" : "they are"} private right now.
      </p>
      <p className="text-sm text-muted leading-relaxed mb-4">
        Sharing puts {count === 1 ? "it" : "them"} on the <strong className="text-app">Community</strong> page,
        where anyone visiting can read the list name and the items on it. Your email address is never shown,
        and you can make any list private again at any time.
      </p>

      <div className="rounded-xl border panel p-3 mb-5">
        <div className="section-label mb-1.5">What would be shared</div>
        <ul className="text-xs text-muted space-y-1">
          {privateLists.slice(0, 5).map(p => (
            <li key={p.id} className="truncate">
              {p.projectName} · {(p.signatures || p.signatureNames || []).length} items
            </li>
          ))}
          {count > 5 && <li className="text-muted/70">+{count - 5} more</li>}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={shareAll}
          disabled={busy}
          className="w-full px-4 py-2.5 rounded-xl bg-accent text-white font-medium inline-flex items-center justify-center gap-2 hover:brightness-[1.05] transition disabled:opacity-60"
        >
          {busy
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Globe className="h-4 w-4" />}
          Share {count === 1 ? "it" : "all of them"}
        </button>
        <button
          onClick={chooseEach}
          disabled={busy}
          className="w-full px-4 py-2.5 rounded-xl border btn-glass transition text-sm inline-flex items-center justify-center gap-2"
        >
          <ListChecks className="h-4 w-4" /> Let me choose per list
        </button>
        <button
          onClick={keepPrivate}
          disabled={busy}
          className="w-full px-4 py-2 rounded-xl text-muted hover:text-app hover:bg-black/5 dark:hover:bg-white/10 transition text-sm inline-flex items-center justify-center gap-2"
        >
          <Lock className="h-4 w-4" /> Keep {count === 1 ? "it" : "them"} private
        </button>
      </div>
    </Dialog>
  );
}
