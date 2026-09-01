import React, { useState } from "react";
import { LogOut } from "lucide-react";
import { useSigStore } from "../../store/sigStore";
import { signOutUser } from "../../services/authService";
import { useGoogleSignIn } from "../../hooks/useGoogleSignIn";
import GoogleIcon from "./GoogleIcon";

export default function AuthButton() {
  const { user, authReady, pushToast } = useSigStore();
  const { signIn, busy } = useGoogleSignIn();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOutUser();
      pushToast("Signed out — workspace cleared. Your saved projects are safe in your account.", "info");
    } catch (error) {
      console.error("Sign-out failed:", error);
      pushToast("Sign-out failed — try again", "error");
    }
    setSigningOut(false);
  };

  if (!authReady) return null;

  if (!user) {
    return (
      <button
        onClick={signIn}
        disabled={busy}
        className="px-3 py-2 rounded-xl border transition inline-flex items-center gap-2 btn-glass text-sm disabled:opacity-50"
        title="Sign in with Google to keep your projects across browsers and devices"
      >
        <GoogleIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Sign in</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full border panel max-w-[180px]"
        title={`Signed in as ${user.displayName || user.email} — projects sync to this account`}
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt=""
            referrerPolicy="no-referrer"
            className="h-6 w-6 rounded-full flex-shrink-0"
          />
        ) : (
          <span className="h-6 w-6 rounded-full bg-accent/25 text-accent grid place-items-center text-xs font-bold flex-shrink-0">
            {(user.displayName || user.email || "?")[0].toUpperCase()}
          </span>
        )}
        <span className="text-sm truncate hidden md:inline">{user.displayName || user.email}</span>
      </span>
      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="p-2 rounded-xl border btn-glass transition disabled:opacity-50"
        title="Sign out"
        aria-label="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
