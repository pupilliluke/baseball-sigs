import React, { useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useSigStore } from "../store/sigStore";
import Toaster from "../components/ui/Toaster";
import AuthButton from "../components/ui/AuthButton";
import ProjectListDialog from "../components/project/ProjectListDialog";
import WelcomeDialog from "../components/ui/WelcomeDialog";
import { watchAuth } from "../services/authService";

export default function AppShell() {
  const { themeMode, accent, setAuthUser } = useSigStore();

  // Track the Firebase auth session (restores signed-in state on reload)
  useEffect(() => watchAuth(setAuthUser), [setAuthUser]);

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
        <NavLink to="/" className="flex items-center gap-2.5 group">
          <div
            className="h-9 w-9 rounded-xl grid place-items-center transition group-hover:scale-105"
            style={{ background: "color-mix(in hsl, hsl(var(--accent-h) var(--accent-s) var(--accent-l)) 14%, transparent)" }}
          >
            <span className="text-lg" aria-hidden="true">⚾</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Collin's Signatures</h1>
        </NavLink>
        <div className="flex items-center gap-3 flex-wrap">
          <nav className="flex gap-0.5">
            {[
              { to: "/", label: "Studio" },
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
      <WelcomeDialog />
    </div>
  );
}
