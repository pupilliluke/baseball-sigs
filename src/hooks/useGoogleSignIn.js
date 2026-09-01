import { useState } from "react";
import { useSigStore } from "../store/sigStore";
import { signInWithGoogle, signInErrorMessage } from "../services/authService";
import { getUserProjects } from "../services/projectService";

export const WELCOME_SEEN_KEY = "fs_welcome_done";

/**
 * Shared Google sign-in flow: popup, anonymous-project migration, toasts,
 * and popping the "My Projects" dialog when the account has saved designs.
 * Returns { signIn, busy }; signIn resolves true on success.
 */
export function useGoogleSignIn() {
  const { pushToast, openProjectsDialog } = useSigStore();
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    setBusy(true);
    try {
      const { user, migrated } = await signInWithGoogle();
      try { localStorage.setItem(WELCOME_SEEN_KEY, "1"); } catch { /* private mode */ }
      pushToast(`Signed in as ${user.displayName || user.email}`);
      if (migrated > 0) {
        pushToast(`Moved ${migrated} project${migrated === 1 ? "" : "s"} from this browser into your account`, "info");
      }
      // Show their saved designs right away. AppShell owns the project list
      // state (it reloads on every identity change); this only decides
      // whether the account has anything worth popping the dialog for.
      try {
        const list = await getUserProjects({ userId: user.uid });
        if (list.length > 0) openProjectsDialog();
      } catch (error) {
        console.error("Could not check for saved projects after sign-in:", error);
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
