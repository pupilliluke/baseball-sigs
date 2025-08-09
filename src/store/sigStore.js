import { create } from "zustand";

let idCounter = 0;
const makeSignature = (name) => ({ id: `${Date.now()}_${idCounter++}`, name, enabled: true });

// Persistent keys
const THEME_KEY = "fs_theme";   // "system" | "light" | "dark"
const ACCENT_KEY = "fs_accent"; // "sky" | "emerald" | "violet" | "amber"

export const DEFAULT_NAMES = [
  "Babe Ruth","Jackie Robinson","Hank Aaron","Willie Mays","Ted Williams","Lou Gehrig","Mickey Mantle","Derek Jeter","Ichiro Suzuki","Albert Pujols",
  "Nolan Ryan","Sandy Koufax","Pedro Martínez","Clayton Kershaw","Greg Maddux","Randy Johnson","Mariano Rivera","Shohei Ohtani","Mike Trout","Mookie Betts",
  "Yogi Berra","Johnny Bench","Roberto Clemente","Cal Ripken Jr.","Ken Griffey Jr.","Barry Bonds","David Ortiz","Tony Gwynn","Stan Musial","Honus Wagner",
  "Joe DiMaggio","Satchel Paige","Walter Johnson","Cy Young","Ozzie Smith","Ryne Sandberg","Chipper Jones","Jeff Bagwell","Craig Biggio","George Brett",
  "Paul Molitor","Frank Thomas","Vladimir Guerrero","Adrián Beltré","Carlos Beltrán","Bryce Harper","Juan Soto","Freddie Freeman","Buck O'Neil","Branch Rickey",
  "Vin Scully","Harry Caray","Bob Uecker","Bill James","Billy Beane","Theo Epstein","Joe Torre","Dusty Baker"
];

// Lighting presets
export const LIGHTING_PRESETS = {
  studio: {
    name: "Studio",
    description: "Clean, professional lighting with soft shadows",
    environment: "studio",
    ambientIntensity: 0.6,
    directionalIntensity: 1.1,
    directionalPosition: [3, 3, 2]
  },
  softbox: {
    name: "Softbox", 
    description: "Soft, diffused lighting for product photography",
    environment: "city",
    ambientIntensity: 0.8,
    directionalIntensity: 0.8,
    directionalPosition: [2, 4, 3]
  },
  sidekey: {
    name: "Side Key",
    description: "Dramatic side lighting for artistic shots",
    environment: "sunset",
    ambientIntensity: 0.3,
    directionalIntensity: 1.5,
    directionalPosition: [5, 2, 1]
  },
  cool: {
    name: "Cool",
    description: "Cool-toned lighting for modern aesthetics", 
    environment: "dawn",
    ambientIntensity: 0.5,
    directionalIntensity: 1.0,
    directionalPosition: [2, 3, 4]
  },
  warm: {
    name: "Warm",
    description: "Warm-toned lighting for cozy feel",
    environment: "apartment",
    ambientIntensity: 0.7,
    directionalIntensity: 0.9,
    directionalPosition: [3, 2, 2]
  },
  noir: {
    name: "Noir",
    description: "High contrast dramatic lighting",
    environment: "night",
    ambientIntensity: 0.2,
    directionalIntensity: 2.0,
    directionalPosition: [4, 5, 1]
  }
};

export const useSigStore = create((set, get) => ({
  // Existing state
  signatures: DEFAULT_NAMES.map(makeSignature),
  shuffleSeed: Math.random().toString(36).slice(2),
  autoRotate: true,
  roughness: 0.6,
  metalness: 0.05,

  // Lighting preset state
  currentPreset: "studio",

  // Project management state
  projects: [],
  currentProjectId: null,
  currentProjectName: "",
  isLoadingProjects: false,

  // New theme system
  themeMode: localStorage.getItem(THEME_KEY) || "system", // "system" | "light" | "dark"
  accent: localStorage.getItem(ACCENT_KEY) || "sky",      // accent color name

  // Signature methods
  addSignature: (name) => set((s) => ({ signatures: [makeSignature(name), ...s.signatures] })),
  toggleSignature: (id) => set((s) => ({
    signatures: s.signatures.map(sig => sig.id === id ? { ...sig, enabled: !sig.enabled } : sig)
  })),
  removeSignature: (id) => set((s) => ({
    signatures: s.signatures.filter(sig => sig.id !== id)
  })),
  resetSignatures: () => set({ signatures: DEFAULT_NAMES.map(makeSignature) }),

  // Theme + accent methods
  setThemeMode: (mode) => {
    localStorage.setItem(THEME_KEY, mode);
    set({ themeMode: mode });
  },
  setAccent: (accent) => {
    localStorage.setItem(ACCENT_KEY, accent);
    set({ accent });
  },
  toggleDark: () => {
    const next = get().themeMode === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    set({ themeMode: next });
  },

  // Rotation + material props
  toggleRotate: () => set({ autoRotate: !get().autoRotate }),
  setRoughness: (v) => set({ roughness: Math.min(1, Math.max(0, v)) }),
  setMetalness: (v) => set({ metalness: Math.min(1, Math.max(0, v)) }),

  // Lighting preset methods
  setPreset: (presetKey) => set({ currentPreset: presetKey }),

  // Project management methods
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (projectId, projectName) => set({ 
    currentProjectId: projectId, 
    currentProjectName: projectName 
  }),
  clearCurrentProject: () => set({ 
    currentProjectId: null, 
    currentProjectName: "" 
  }),
  setLoadingProjects: (loading) => set({ isLoadingProjects: loading }),
  
  // Load signatures from a project
  loadProjectSignatures: (signatureNames) => {
    const signatures = signatureNames.map(name => ({ 
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, 
      name, 
      enabled: true 
    }));
    set({ signatures });
  },
}));
