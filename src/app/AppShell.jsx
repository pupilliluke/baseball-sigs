import React, { useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useSigStore } from "../store/sigStore";
import Toaster from "../components/ui/Toaster";

export default function AppShell() {
  const { themeMode, accent } = useSigStore();

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
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(50%_40%_at_50%_0%,hsl(210_70%_25%_/_0.25),transparent_60%),radial-gradient(40%_40%_at_100%_0%,hsl(270_60%_40%_/_0.15),transparent_60%),radial-gradient(40%_60%_at_0%_0%,hsl(190_70%_40%_/_0.15),transparent_60%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 [mask-image:radial-gradient(1000px_500px_at_50%_-10%,black,transparent)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />

      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 pt-6 pb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
           <div className="h-10 w-10 rounded-2xl border grid place-items-center"
             style={{
               background: "color-mix(in hsl, hsl(var(--accent-h) var(--accent-s) var(--accent-l)) 20%, transparent)",
               borderColor: "color-mix(in hsl, hsl(var(--accent-h) var(--accent-s) var(--accent-l)) 30%, transparent)"
             }}>
             <span className="text-xl" aria-hidden="true">⚾</span>
          </div>
          <div>
             <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Collin's Signatures</h1>
            <p className="text-muted text-sm">Design a signed baseball • Real-time 3D • Export & share</p>
          </div>
        </div>
        <nav className="flex gap-1">
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
                `px-3 py-2 rounded-xl border transition ${
                  isActive
                    ? "btn-glass border-accent text-accent font-medium"
                    : "border-transparent text-muted hover:text-app hover:bg-black/5 dark:hover:bg-white/10"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 pb-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 pb-8 text-sm text-muted flex items-center justify-between">
        <span>
          © {new Date().getFullYear()} Collin's Signatures
        </span>
        <span className="hidden sm:inline">
          Built with React • Tailwind • Three.js • Zustand • Motion
        </span>
      </footer>

      <Toaster />
    </div>
  );
}
