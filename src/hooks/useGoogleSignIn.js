import { useState } from "react";
import { useSigStore, FALLBACK_CATEGORY } from "../store/sigStore";
import { signInWithGoogle, signInErrorMessage } from "../services/authService";
import { getUserProjects } from "../services/projectService";

export const WELCOME_SEEN_KEY = "fs_welcome_done";

/**
 * Shared Google sign-in flow: popup, anonymous-project migration, toasts, and
 * restoring the account's most recent list onto the ball so people land on
 * their own collection instead of the stock lineup.
 * Returns { signIn, busy }; signIn resolves true on success.
 */
export function useGoogleSignIn() {
  const { pushToast, setProjects, setSport, setCurrentProject, loadProjectSignatures } = useSigStore();
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    setBusy(true);
    try {
      const { user, migrated } = await signInWithGoogle();
      try { localStorage.setItem(WELCOME_SEEN_KEY, "1"); } catch { /* private mode */ }
      pushToast(`Signed in as ${user.displayName || user.email}`);
      if (migrated > 0) {
        pushToast(`Moved ${migrated} list${migrated === 1 ? "" : "s"} from this browser into your account`, "info");
      }

      // Put their newest list on the ball straight away.
      try {
        const list = await getUserProjects({ userId: user.uid });
        setProjects(list);
        const latest = list[0]; // getUserProjects orders by updatedAt desc
        if (latest) {
          if (latest.sport) setSport(latest.sport);
          setCurrentProject(latest.id, latest.projectName, latest.category || FALLBACK_CATEGORY);
          loadProjectSignatures(latest.signatures || latest.signatureNames || []);
          const count = (latest.signatures || latest.signatureNames || []).length;
          pushToast(`Loaded your latest list "${latest.projectName}" — ${count} item${count === 1 ? "" : "s"}`, "info");
        }
      } catch (error) {
        console.error("Could not restore the most recent list after sign-in:", error);
      }

      setBusy(false);
      return true;
    } catch (error) {
      console.error("Sign-in failed:", error);
      const message = signInErrorMessage(error);
      if (message) pushToast(message, "error");
      setBusy(false);
      return false;
    }
  };

  return { signIn, busy };
}
