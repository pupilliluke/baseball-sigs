import React, { useState, useRef, useEffect } from "react";
import { useSigStore } from "../../store/sigStore";
import { Sun, Moon, Monitor, Droplets } from "lucide-react";

const btn = "px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/10 transition inline-flex items-center gap-2";
const item = "px-3 py-2 rounded-lg hover:bg-white/10 cursor-pointer flex items-center gap-2";
const dot  = "h-3 w-3 rounded-full";

export default function ThemeMenu(){
  const { themeMode, setThemeMode, accent, setAccent, toggleDark } = useSigStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // click outside to close
  useEffect(()=> {
    const onDoc = (e) => { if (open && ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={()=>setOpen(o=>!o)} className={btn}>
        {themeMode === "dark" ? <Moon className="h-4 w-4"/> : themeMode === "light" ? <Sun className="h-4 w-4"/> : <Monitor className="h-4 w-4"/>}
        Theme
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-56 rounded-xl bg-[color-mix(in_hsl,white_10%,transparent)] border border-white/10 backdrop-blur-xl p-2 right-0">
          <div className="text-xs text-white/60 px-2 pb-1">Mode</div>
          <div className="grid gap-1 mb-2">
            <div className={item} onClick={()=>setThemeMode("system")}><Monitor className="h-4 w-4"/><span>System</span>{themeMode==="system" && <span className="ml-auto">✓</span>}</div>
            <div className={item} onClick={()=>setThemeMode("light")}><Sun className="h-4 w-4"/><span>Light</span>{themeMode==="light" && <span className="ml-auto">✓</span>}</div>
            <div className={item} onClick={()=>setThemeMode("dark")}><Moon className="h-4 w-4"/><span>Dark</span>{themeMode==="dark" && <span className="ml-auto">✓</span>}</div>
          </div>

          <div className="text-xs text-white/60 px-2 pb-1">Accent</div>
          <div className="grid grid-cols-4 gap-2 px-2 pb-2">
            {["sky","emerald","violet","amber"].map(a => (
              <button key={a}
                onClick={()=>setAccent(a)}
                className={`${dot} ${a===accent ? "ring-2 ring-white/70" : "ring-1 ring-white/20"}`}
                style={{ background: `hsl(var(--accent-h) var(--accent-s) var(--accent-l))`,
                         // temporarily set accent var to preview each swatch:
                         ...(a!==accent ? {"--accent-h": a==="emerald"?152:a==="violet"?266:a==="amber"?42:200,
                                           "--accent-s": a==="amber"?"95%":a==="violet"?"85%":a==="emerald"?"70%":"90%",
                                           "--accent-l": a==="emerald"?"55%":a==="violet"?"62%":a==="amber"?"55%":"60%"} : {}) }}
                title={a}
              />
            ))}
          </div>

          <div className={item} onClick={toggleDark}><Droplets className="h-4 w-4"/><span>Quick toggle</span></div>
        </div>
      )}
    </div>
  );
}
