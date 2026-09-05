import React, { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useSigStore } from "../store/sigStore";
import Toaster from "../components/ui/Toaster";
import AuthButton from "../components/ui/AuthButton";
import ProjectListDialog from "../components/project/ProjectListDialog";
import WelcomeDialog from "../components/ui/WelcomeDialog";
import ScrollLockedHero from "../components/ui/ScrollLockedHero";

const INTRO_KEY = "fs_intro_seen";
const INTRO_VIDEO = "https://raw.githubusercontent.com/gughigug/metro-hero-assets/main/Subway_doors_open_to_city_202608242331.mp4";
import { watchAuth } from "../services/authService";
import { getUserProjects, getAnonymousUserId } from "../services/projectService";

export default function AppShell() {
  const { themeMode, accent, user, authReady, setAuthUser, setProjects } = useSigStore();
  const uid = user?.uid || null;

  // Intro gate: once per browser session, so a refresh mid-session goes
  // straight to the studio instead of replaying the reveal. Skipped entirely
  // on phones and tablets — pinning the page and taking over touch scrolling
  // fights the way people expect to move through a page on a small screen.
  const [introDone, setIntroDone] = useState(() => {
    try {
      const isTouchOrSmall =
        window.matchMedia("(max-width: 768px)").matches ||
        window.matchMedia("(pointer: coarse)").matches;
      if (isTouchOrSmall) return true;
      return sessionStorage.getItem(INTRO_KEY) === "1";
    } catch {
      return true;
    }
  });
  const finishIntro = () => {
    try { sessionStorage.setItem(INTRO_KEY, "1"); } catch { /* private mode */ }
    setIntroDone(true);
  };

  // Track the Firebase auth session (restores signed-in state on reload)
  useEffect(() => watchAuth(setAuthUser), [setAuthUser]);


  // The project list follows whoever is signed in. Doing this reactively
  // (instead of only inside the sign-in handler) means logging out or
  // switching accounts always reloads the right owner's projects, and a
  // response that arrives after another identity change is discarded.
  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    // Derive the owner from the identity this effect is keyed on, so the
    // request can never be for a different account than the one it reacts to.
    const ownerId = uid || getAnonymousUserId();
    (async () => {
      try {
        const list = await getUserProjects({ userId: ownerId });
        if (!cancelled) setProjects(list);
      } catch (error) {
        console.error("Could not load projects for the current account:", error);
        if (!cancelled) setProjects([]);
      }
    })();
    return () => { cancelled = true; };
  }, [authReady, uid, setProjects]);

  // Dark/light/system mode handling
  useEffect(() => {
    const root = document.documentElement;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark =
        themeMode === "dark" ||
        (themeMode === "system" && mq.matches);
      root.classList.toggle("dark", dark);
    };
    apply();

    const listener = () => themeMode === "system" && apply();
    mq.addEventListener?.("change", listener);
    return () => mq.removeEventListener?.("change", listener);
  }, [themeMode]);

  // Accent color handling
  useEffect(() => {
    const map = {
      sky:     { h: 200, s: 90,  l: 60 },
      emerald: { h: 152, s: 70,  l: 55 },
      violet:  { h: 266, s: 85,  l: 62 },
      amber:   { h: 42,  s: 95,  l: 55 },
    };
    const { h, s, l } = map[accent] || map.sky;
    const r = document.documentElement.style;
    r.setProperty("--accent-h", h);
    r.setProperty("--accent-s", `${s}%`);
    r.setProperty("--accent-l", `${l}%`);
  }, [accent]);

  return (
    <div className="min-h-screen bg-surface text-app relative">
      {/* One quiet accent glow at the top */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ background: "radial-gradient(55% 45% at 50% -8%, color-mix(in hsl, hsl(var(--accent-h) var(--accent-s) var(--accent-l)) 16%, transparent), transparent 70%)" }}
      />

      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-4 flex flex-wrap items-center justify-between gap-3">
        <NavLink to="/" className="hover:opacity-80 transition">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Collin's Signatures</h1>
        </NavLink>
        <div className="flex items-center gap-3 flex-wrap">
          <nav className="flex gap-0.5">
            {[
              { to: "/", label: "Collection" },
              { to: "/studio", label: "Studio" },
              { to: "/gallery", label: "Gallery" },
              { to: "/about", label: "About" },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm transition ${
                    isActive
                      ? "text-accent font-semibold bg-accent/10"
                      : "text-muted hover:text-app hover:bg-black/5 dark:hover:bg-white/10"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <AuthButton />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 text-xs text-muted flex items-center justify-between">
        <span>© {new Date().getFullYear()} Collin's Signatures</span>
        <span className="hidden sm:inline">Real-time 3D • Made with React & Three.js</span>
      </footer>

      <Toaster />
      <ProjectListDialog />
      {/* Hold the sign-in prompt until the intro has opened the studio */}
      {introDone && <WelcomeDialog />}

      {!introDone && (
        <ScrollLockedHero videoSrc={INTRO_VIDEO} onUnlock={finishIntro} />
      )}
    </div>
  );
}
