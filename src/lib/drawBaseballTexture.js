import { seededRandom } from "./seededRandom";


// --- tunables ---
const V_MIN = 0.14;          // avoid poles
const V_MAX = 0.86;
const R_PAD = 6;             // extra pixels around text (ink bleed)
const MAX_ATTEMPTS_PER_SIG = 120;
const SHRINK_STEP = 0.9;     // when crowded, shrink font by 10% and retry
const MIN_FONT = 18;         // don't go below this

// Handwriting web fonts (loaded in index.html). Each has a size multiplier so
// the different metrics come out visually similar, plus system fallbacks.
const SIGNATURE_FONTS = [
  { stack: "'Caveat', 'Brush Script MT', 'Segoe Script', cursive", mul: 1.25 },
  { stack: "'Dancing Script', 'Brush Script MT', 'Segoe Script', cursive", mul: 1.05 },
  { stack: "'Homemade Apple', 'Segoe Script', cursive", mul: 0.72 },
];

// Probes for document.fonts.load() so the hook can wait for these faces.
export const SIGNATURE_FONT_PROBES = [
  "700 48px Caveat",
  "700 48px 'Dancing Script'",
  "48px 'Homemade Apple'",
];

// Ballpoint-ish ink colors: blue-black family
const INKS = ["#12142a", "#1b2a6b", "#1e3a8a", "#0f1d52", "#101322"];

function measureSignature(ctx, text, px, font) {
  ctx.save();
  ctx.font = `700 ${Math.round(px * font.mul)}px ${font.stack}`;
  const w = ctx.measureText(text).width;
  ctx.restore();
  // use circle approx radius from half width & height; height ~ 0.72*px for these fonts
  const h = px * 0.72;
  const r = Math.max(w, h) * 0.5 + R_PAD;
  return { w, h, r };
}

// toroidal x-distance (wraps in U); y is clamped
function wrappedDX(x1, x2, w) {
  const dx = Math.abs(x1 - x2);
  return Math.min(dx, w - dx);
}
function overlapsToroidal(a, b, W) {
  const dx = wrappedDX(a.x, b.x, W);
  const dy = Math.abs(a.y - b.y);
  const d2 = dx*dx + dy*dy;
  const rr = (a.r + b.r);
  return d2 < rr*rr;
}

/**
 * Poisson-like layout with variable radii (per font size).
 * Returns placements: [{x,y,angle,size,font,ink,name,id}]
 */
function layoutSignatures(ctx, canvasW, canvasH, enabled, seedFn) {
  const placed = [];
  // deterministic but organic: shuffle input order by hash
  const shuffled = [...enabled].sort((a,b) => (seedFn(a.id+a.name)-0.5) - (seedFn(b.id+b.name)-0.5));

  for (const sig of shuffled) {
    // random, but deterministic, angle & base size
    let rgen = (() => {
      // one-shot PRNG per sig using seedFn
      let s = seedFn(sig.id + sig.name);
      return () => (s = (s * 9301 + 49297) % 233280) / 233280;
    })();

    let angle = (rgen() - 0.5) * (Math.PI / 3); // ±30°
    let size = 32 + Math.floor(rgen()*36);      // 32–68px
    const font = SIGNATURE_FONTS[Math.floor(rgen() * SIGNATURE_FONTS.length)];
    const ink = INKS[Math.floor(rgen() * INKS.length)];

    // iterative attempts with shrink-on-fail
    let placedNode = null;
    let attempts = 0;

    while (attempts < MAX_ATTEMPTS_PER_SIG && size >= MIN_FONT) {
      const { r } = measureSignature(ctx, sig.name, size, font);
      // candidate position
      const u = rgen();                                  // 0..1
      const v = V_MIN + rgen() * (V_MAX - V_MIN);       // avoid poles
      const x = Math.floor(u * canvasW);
      const y = Math.floor(v * canvasH);

      const candidate = { x, y, r, angle, size, font, ink, name: sig.name, id: sig.id };

      // overlap test (toroidal in X)
      let ok = true;
      for (const p of placed) {
        if (overlapsToroidal(candidate, p, canvasW)) { ok = false; break; }
      }

      if (ok) { placedNode = candidate; break; }

      attempts++;
      // every few misses nudge angle, every many misses shrink
      if (attempts % 15 === 0) angle = (rgen() - 0.5) * (Math.PI / 3);
      if (attempts % 30 === 0) size = Math.max(MIN_FONT, Math.floor(size * SHRINK_STEP));
    }

    if (placedNode) placed.push(placedNode);
    // else: skip this sig gracefully when space is too crowded
  }

  return placed;
}

function drawLeather(ctx, w, h, seedStr) {
  // Warm off-white leather with a soft vertical falloff
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#fbf7ef");
  bg.addColorStop(0.5, "#f7f2e8");
  bg.addColorStop(1, "#efe9dc");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Subtle radial sheen so the sphere doesn't read as flat white
  const sheen = ctx.createRadialGradient(w * 0.5, h * 0.42, h * 0.1, w * 0.5, h * 0.5, h * 0.75);
  sheen.addColorStop(0, "rgba(255,255,255,0.35)");
  sheen.addColorStop(1, "rgba(120,100,70,0.05)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, w, h);

  // Grain: light flecks + darker pores
  const rand = seededRandom("leather" + seedStr);
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = `hsl(38, 18%, ${88 + Math.floor(rand() * 10)}%)`;
    const x = rand() * w, y = rand() * h, r = rand() * 1.1;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 0.04;
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = `hsl(30, 25%, ${55 + Math.floor(rand() * 15)}%)`;
    const x = rand() * w, y = rand() * h, r = rand() * 0.8;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function seamY(baseY, x, idx, period, seamAmp) {
  return baseY + Math.sin((x / period) * Math.PI * 2 + (idx ? Math.PI : 0)) * seamAmp * (0.9 + 0.2 * Math.sin(x / 140));
}

function drawSeams(ctx, w, h) {
  const seamAmp = h * 0.08, baseYs = [h * 0.32, h * 0.68], period = w * 0.65;

  baseYs.forEach((baseY, idx) => {
    // Groove shadow under the seam gives it depth
    ctx.strokeStyle = "rgba(90, 55, 40, 0.25)";
    ctx.lineWidth = 12;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 3) {
      const y = seamY(baseY, x, idx, period, seamAmp) + 2;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Seam line
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#b03a2e";
    ctx.beginPath();
    for (let x = 0; x <= w; x += 3) {
      const y = seamY(baseY, x, idx, period, seamAmp);
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Chevron stitch pairs (real baseball stitches form little Vs)
    ctx.strokeStyle = "#d94436";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    for (let x = 0; x <= w; x += 26) {
      const y = seamY(baseY, x, idx, period, seamAmp);
      const yNext = seamY(baseY, x + 1, idx, period, seamAmp);
      const tangent = Math.atan2(yNext - y, 1);
      const normal = tangent + Math.PI / 2;
      const len = 15;
      const spread = 0.5; // radians each stitch leans away from the normal
      for (const lean of [-spread, spread]) {
        const a = normal + lean;
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(a) * len / 2, y - Math.sin(a) * len / 2);
        ctx.lineTo(x + Math.cos(a) * len / 2, y + Math.sin(a) * len / 2);
        ctx.stroke();
      }
    }
    ctx.lineCap = "butt";
  });
}

export function drawBaseballTexture(canvas, signatures, seedStr) {
  const w = canvas.width, h = canvas.height;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, w, h);

  drawLeather(ctx, w, h, seedStr);
  drawSeams(ctx, w, h);

  // ---------- SIGNATURE LAYOUT (Blue-noise / Poisson-ish) ----------
  const enabled = signatures.filter(s => s.enabled);
  // determinstic seed fn in [0,1)
  const seedFn = (s) => {
    // cheap hash → [0,1)
    let hsh = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) { hsh ^= s.charCodeAt(i); hsh = Math.imul(hsh, 16777619); }
    hsh ^= hsh << 13; hsh ^= hsh >>> 7; hsh ^= hsh << 17;
    return (hsh >>> 0) / 4294967295;
  };

  const placements = layoutSignatures(ctx, w, h, enabled, seedFn);

  // ---------- DRAW ----------
  for (const p of placements) {
    // The sphere's U coordinate wraps, so draw shifted copies too — otherwise
    // text near the texture's left/right edge gets visibly cut on the ball.
    for (const shift of [-w, 0, w]) {
      const px = p.x + shift;
      if (px < -p.r * 2 || px > w + p.r * 2) continue;
      ctx.save();
      ctx.translate(px, p.y);
      ctx.rotate(p.angle);
      ctx.font = `700 ${Math.round(p.size * p.font.mul)}px ${p.font.stack}`;
      ctx.fillStyle = p.ink;
      ctx.globalAlpha = 0.92;
      ctx.shadowColor = "rgba(20, 25, 80, 0.22)"; // faint ink bleed
      ctx.shadowBlur = 1.4;
      ctx.shadowOffsetX = 0.6; ctx.shadowOffsetY = 0.8;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.name, 0, 0);
      ctx.restore();
    }
  }
}
