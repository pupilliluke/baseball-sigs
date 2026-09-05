import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

let idCounter = 0;
const makeSignature = (name) => ({ id: `${Date.now()}_${idCounter++}`, name, enabled: true });

// Legacy persisted keys (pre-workspace); still read as initial fallbacks
const THEME_KEY = "fs_theme";   // "system" | "light" | "dark"
const ACCENT_KEY = "fs_accent"; // "sky" | "emerald" | "violet" | "amber"

export const SPORTS = {
  baseball: { label: "Baseball", emoji: "⚾" },
  basketball: { label: "Basketball", emoji: "🏀" },
  football: { label: "Football", emoji: "🏈" },
};

// Collections are grouped by sport and then by category. These are the
// built-in categories; anyone can save a list under a new name of their own
// and it becomes available alongside them.
export const DEFAULT_CATEGORIES = ["Autographs", "Cards", "Jerseys"];
export const FALLBACK_CATEGORY = "Autographs";
const CUSTOM_CATEGORIES_KEY = "fs_custom_categories";

/** Categories the user can pick from: built-ins + any they've used or added. */
export function readCustomCategories() {
  try {
    const raw = JSON.parse(localStorage.getItem(CUSTOM_CATEGORIES_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter(c => typeof c === "string" && c.trim()) : [];
  } catch {
    return [];
  }
}

function writeCustomCategories(list) {
  try { localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(list)); } catch { /* private mode */ }
}

export const DEFAULT_NAMES = {
  baseball: [
    "Babe Ruth","Jackie Robinson","Hank Aaron","Willie Mays","Ted Williams","Lou Gehrig","Mickey Mantle","Derek Jeter","Ichiro Suzuki","Albert Pujols",
    "Nolan Ryan","Sandy Koufax","Pedro Martínez","Clayton Kershaw","Greg Maddux","Randy Johnson","Mariano Rivera","Shohei Ohtani","Mike Trout","Mookie Betts",
    "Yogi Berra","Johnny Bench","Roberto Clemente","Cal Ripken Jr.","Ken Griffey Jr.","Barry Bonds","David Ortiz","Tony Gwynn","Stan Musial","Honus Wagner",
    "Joe DiMaggio","Satchel Paige","Walter Johnson","Cy Young","Ozzie Smith","Ryne Sandberg","Chipper Jones","Jeff Bagwell","Craig Biggio","George Brett",
    "Paul Molitor","Frank Thomas","Vladimir Guerrero","Adrián Beltré","Carlos Beltrán","Bryce Harper","Juan Soto","Freddie Freeman","Buck O'Neil","Branch Rickey",
    "Vin Scully","Harry Caray","Bob Uecker","Bill James","Billy Beane","Theo Epstein","Joe Torre","Dusty Baker"
  ],
  basketball: [
    "Michael Jordan","LeBron James","Kobe Bryant","Magic Johnson","Larry Bird","Kareem Abdul-Jabbar","Wilt Chamberlain","Bill Russell","Shaquille O'Neal","Tim Duncan",
    "Stephen Curry","Kevin Durant","Giannis Antetokounmpo","Nikola Jokić","Hakeem Olajuwon","Dirk Nowitzki","Charles Barkley","Karl Malone","John Stockton","Scottie Pippen",
    "Dwyane Wade","Allen Iverson","Kevin Garnett","Isiah Thomas","Julius Erving","Oscar Robertson","Jerry West","Elgin Baylor","David Robinson","Moses Malone",
    "Patrick Ewing","Reggie Miller","Ray Allen","Chris Paul","Kawhi Leonard","Luka Dončić","Jayson Tatum","Sue Bird","Diana Taurasi","Candace Parker"
  ],
  football: [
    "Tom Brady","Joe Montana","Jerry Rice","Jim Brown","Walter Payton","Barry Sanders","Emmitt Smith","Lawrence Taylor","Peyton Manning","John Elway",
    "Dan Marino","Brett Favre","Aaron Rodgers","Patrick Mahomes","Johnny Unitas","Bart Starr","Terry Bradshaw","Roger Staubach","Steve Young","Deion Sanders",
    "Ronnie Lott","Ray Lewis","Ed Reed","Troy Polamalu","Randy Moss","Terrell Owens","Calvin Johnson","Larry Fitzgerald","Adrian Peterson","LaDainian Tomlinson",
    "Marshall Faulk","Bo Jackson","Reggie White","Bruce Smith","Dick Butkus","J.J. Watt","Aaron Donald","Rob Gronkowski","Travis Kelce","Emlen Tunnell"
  ],
};

const defaultRoster = (sport) => (DEFAULT_NAMES[sport] || DEFAULT_NAMES.baseball).map(makeSignature);

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

let toastCounter = 0;

export const useSigStore = create(persist((set, get) => ({
  // Active sport + its working roster. Inactive sports keep their state in
  // `benches` and swap in/out on sport change.
  sport: "baseball",
  signatures: defaultRoster("baseball"),
  benches: {},

  shuffleSeed: "opening-day", // stable default so the first render is reproducible
  autoRotate: true,
  roughness: 0.6,
  metalness: 0.05,

  // Lighting preset state
  currentPreset: "studio",

  // Project management state
  projects: [],
  currentProjectId: null,
  currentProjectName: "",
  currentCategory: FALLBACK_CATEGORY,
  customCategories: readCustomCategories(),
  isLoadingProjects: false,

  // New theme system
  themeMode: localStorage.getItem(THEME_KEY) || "system", // "system" | "light" | "dark"
  accent: localStorage.getItem(ACCENT_KEY) || "sky",      // accent color name

  // Sport switching: stash the current workspace, restore (or seed) the next
  setSport: (next) => set((s) => {
    if (next === s.sport || !SPORTS[next]) return {};
    const benches = {
      ...s.benches,
      [s.sport]: {
        signatures: s.signatures,
        currentProjectId: s.currentProjectId,
        currentProjectName: s.currentProjectName,
        currentCategory: s.currentCategory,
      },
    };
    const bench = benches[next] || {};
    return {
      sport: next,
      benches,
      // An empty roster is a deliberate state, not a missing bench. Falling back
      // to the stock lineup here while keeping the benched project id would leave
      // the saved list showing stock names — and an Update would overwrite it.
      signatures: bench.signatures ? bench.signatures : defaultRoster(next),
      currentProjectId: bench.currentProjectId || null,
      currentProjectName: bench.currentProjectName || "",
      currentCategory: bench.currentCategory || FALLBACK_CATEGORY,
    };
  }),

  // Signature methods
  addSignature: (name) => set((s) => ({ signatures: [makeSignature(name), ...s.signatures] })),
  toggleSignature: (id) => set((s) => ({
    signatures: s.signatures.map(sig => sig.id === id ? { ...sig, enabled: !sig.enabled } : sig)
  })),
  removeSignature: (id) => set((s) => ({
    signatures: s.signatures.filter(sig => sig.id !== id)
  })),
  clearAllSignatures: () => set({ signatures: [] }),
  resetSignatures: () => set((s) => ({ signatures: defaultRoster(s.sport) })),

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

  // Re-seed the signature layout for a fresh arrangement
  shuffleLayout: () => set({ shuffleSeed: Math.random().toString(36).slice(2) }),

  // Lighting preset methods
  setPreset: (presetKey) => set({ currentPreset: presetKey }),

  // Project management methods
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (projectId, projectName, category) => set({
    currentProjectId: projectId,
    currentProjectName: projectName,
    ...(category ? { currentCategory: category } : {}),
  }),
  setCurrentCategory: (category) => set({ currentCategory: category || FALLBACK_CATEGORY }),
  // Resolve a typed category against ones already in use, so "cards" and
  // "Cards" stay one category instead of splitting the collection in two.
  canonicalCategory: (category) => {
    const name = (category || "").trim();
    if (!name) return FALLBACK_CATEGORY;
    const match = get().knownCategories().find(c => c.toLowerCase() === name.toLowerCase());
    return match || name;
  },
  addCustomCategory: (category) => set((s) => {
    const name = (category || "").trim();
    if (!name) return {};
    const known = [...DEFAULT_CATEGORIES, ...s.customCategories].map(c => c.toLowerCase());
    if (known.includes(name.toLowerCase())) return {};
    const next = [...s.customCategories, name];
    writeCustomCategories(next);
    return { customCategories: next };
  }),
  clearCurrentProject: () => set({
    currentProjectId: null,
    currentProjectName: "",
    currentCategory: FALLBACK_CATEGORY,
  }),
  // Categories seen across the account's saved lists, merged with built-ins
  // and anything added locally — so a category survives as long as a list uses it.
  knownCategories: () => {
    const s = get();
    const fromProjects = (s.projects || []).map(p => p.category).filter(Boolean);
    const all = [...DEFAULT_CATEGORIES, ...s.customCategories, ...fromProjects];
    const seen = new Map();
    all.forEach(c => { const k = c.toLowerCase(); if (!seen.has(k)) seen.set(k, c); });
    return [...seen.values()];
  },
  setLoadingProjects: (loading) => set({ isLoadingProjects: loading }),

  // Load signatures from a project. Accepts the newer [{name, enabled}] shape
  // as well as the legacy array of plain name strings.
  loadProjectSignatures: (items) => {
    const signatures = (items || [])
      .map((item) => {
        const name = typeof item === "string" ? item : item?.name;
        const enabled = typeof item === "string" ? true : item?.enabled !== false;
        return name ? { ...makeSignature(name), enabled } : null;
      })
      .filter(Boolean);
    set({ signatures });
  },

  // Auth state (managed by Firebase; not persisted here)
  user: null,
  authReady: false,
  setAuthUser: (user) => set((s) => {
    const prevUid = s.user?.uid || null;
    const nextUid = user?.uid || null;

    // First resolution after page load: adopt the identity without disturbing
    // the workspace, so a reload keeps whatever was on screen.
    if (!s.authReady) return { user, authReady: true };
    if (prevUid === nextUid) return { user };

    // Signing out, or switching to a different account, must not leave the
    // previous account's design on the ball or its projects in the list.
    if (prevUid) {
      return {
        user,
        projects: [],
        currentProjectId: null,
        currentProjectName: "",
        currentCategory: FALLBACK_CATEGORY,
        signatures: defaultRoster(s.sport),
        benches: {},
      };
    }

    // Guest signing in: keep their in-progress design (it's their own work,
    // and their guest projects are migrated into the account), but drop the
    // guest project list so the account's own list loads fresh.
    return { user, projects: [] };
  }),

  // Global "My Projects" dialog (openable from anywhere, e.g. after sign-in)
  showProjectsDialog: false,
  openProjectsDialog: () => set({ showProjectsDialog: true }),
  closeProjectsDialog: () => set({ showProjectsDialog: false }),

  // Toast notifications
  toasts: [],
  pushToast: (message, type = "success") => {
    const id = ++toastCounter;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => get().dismissToast(id), 4000);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}), {
  name: "fs_workspace",
  version: 1,
  storage: createJSONStorage(() => localStorage),
  // Persist the workspace so a reload restores exactly what was on screen.
  partialize: (s) => ({
    sport: s.sport,
    signatures: s.signatures,
    benches: s.benches,
    currentProjectId: s.currentProjectId,
    currentProjectName: s.currentProjectName,
    currentCategory: s.currentCategory,
    customCategories: s.customCategories,
    shuffleSeed: s.shuffleSeed,
    autoRotate: s.autoRotate,
    roughness: s.roughness,
    metalness: s.metalness,
    currentPreset: s.currentPreset,
    themeMode: s.themeMode,
    accent: s.accent,
  }),
}));
