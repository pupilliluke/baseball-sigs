import React, { useState } from "react";
import { useSigStore } from "../../store/sigStore";
import { useGoogleSignIn, WELCOME_SEEN_KEY } from "../../hooks/useGoogleSignIn";
import Dialog from "./Dialog";
import GoogleIcon from "./GoogleIcon";

/**
 * One-time first-visit prompt: sign in with Google (how designs are saved to
 * an account) or skip and design as a guest.
 */
export default function WelcomeDialog() {
  const { user, authReady } = useSigStore();
  const { signIn, busy } = useGoogleSignIn();
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(WELCOME_SEEN_KEY) === "1"; } catch { return true; }
  });

  const done = () => {
    try { localStorage.setItem(WELCOME_SEEN_KEY, "1"); } catch { /* private mode */ }
    setDismissed(true);
  };

  const handleGoogle = async () => {
    const ok = await signIn();
    if (ok) done();
  };

  return (
    <Dialog open={authReady && !user && !dismissed} onClose={done} title="Welcome to Collin's Signatures">
      <p className="text-sm text-muted leading-relaxed mb-1">
        Design a signed baseball, basketball, or football — then export it or save
        it as a project.
      </p>
      <p className="text-sm text-muted leading-relaxed mb-5">
        <strong className="text-app">Sign in with Google to save your designs to your
        account</strong> — they'll be waiting for you on any device. Skip it, and you can
        still design and save, but projects stay tied to this browser.
      </p>
      <div className="flex flex-col gap-2">
        <button
          onClick={handleGoogle}
          disabled={busy}
          className="w-full px-4 py-2.5 rounded-xl bg-accent hover:brightness-[1.05] text-white font-medium transition inline-flex items-center justify-center gap-2.5 disabled:opacity-60"
        >
          {busy ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span className="bg-white rounded-full p-0.5 grid place-items-center"><GoogleIcon className="h-4 w-4" /></span>
          )}
          Continue with Google
        </button>
        <button
          onClick={done}
          disabled={busy}
          className="w-full px-4 py-2.5 rounded-xl text-muted hover:text-app hover:bg-black/5 dark:hover:bg-white/10 transition text-sm"
        >
          Skip for now
        </button>
      </div>
    </Dialog>
  );
}
