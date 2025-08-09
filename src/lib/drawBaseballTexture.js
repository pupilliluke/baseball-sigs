import { seededRandom } from "./seededRandom";


// --- tunables ---
const V_MIN = 0.14;          // avoid poles
const V_MAX = 0.86;
const R_PAD = 6;             // extra pixels around text (ink bleed)
const MAX_ATTEMPTS_PER_SIG = 120;
const SHRINK_STEP = 0.9;     // when crowded, shrink font by 10% and retry
const MIN_FONT = 18;         // don't go below this

function measureSignature(ctx, text, px) {
  ctx.save();
  ctx.font = `${px}px 'Brush Script MT','Segoe Script','Pacifico','Dancing Script',cursive`;
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
 * Returns placements: [{x,y,angle,size,metrics}]
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

    // iterative attempts with shrink-on-fail
    let placedNode = null;
    let attempts = 0;

    while (attempts < MAX_ATTEMPTS_PER_SIG && size >= MIN_FONT) {
      const { r } = measureSignature(ctx, sig.name, size);
      // candidate position
      const u = rgen();                                  // 0..1
      const v = V_MIN + rgen() * (V_MAX - V_MIN);       // avoid poles
      const x = Math.floor(u * canvasW);
      const y = Math.floor(v * canvasH);

      const candidate = { x, y, r, angle, size, name: sig.name, id: sig.id };

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



export function drawBaseballTexture(canvas, signatures, seedStr) {
  const w = canvas.width, h = canvas.height;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, w, h);

  // Leather
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#ffffff");
  bg.addColorStop(1, "#f2f2f2");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Grain
  const rand = seededRandom("leather" + seedStr);
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 2500; i++) {
    ctx.fillStyle = `hsl(0,0%,${90 + Math.floor(rand() * 10)}%)`;
    const x = rand() * w, y = rand() * h, r = rand() * 0.9;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Seams
  ctx.lineWidth = 6; ctx.strokeStyle = "#c0392b";
  const seamAmp = h * 0.08, baseYs = [h * 0.32, h * 0.68], period = w * 0.65;
  baseYs.forEach((baseY, idx) => {
    ctx.beginPath();
    for (let x = 0; x <= w; x += 3) {
      const y = baseY + Math.sin((x / period) * Math.PI * 2 + (idx ? Math.PI : 0)) * seamAmp * (0.9 + 0.2 * Math.sin(x / 140));
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // stitches
    ctx.strokeStyle = "#e74c3c"; ctx.lineWidth = 3;
    for (let x = 0; x <= w; x += 28) {
      const y = baseY + Math.sin((x / period) * Math.PI * 2 + (idx ? Math.PI : 0)) * seamAmp * (0.9 + 0.2 * Math.sin(x / 140));
      const dx = 1;
      const y1 = baseY + Math.sin(((x + dx) / period) * Math.PI * 2 + (idx ? Math.PI : 0)) * seamAmp * (0.9 + 0.2 * Math.sin((x + dx) / 140));
      const dy = y1 - y;
      const ang = Math.atan2(dy, dx) + Math.PI / 2;
      const len = 16;
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(ang) * len / 2, y - Math.sin(ang) * len / 2);
      ctx.lineTo(x + Math.cos(ang) * len / 2, y + Math.sin(ang) * len / 2);
      ctx.stroke();
    }
    ctx.strokeStyle = "#c0392b"; ctx.lineWidth = 6;
  });

  // Signatures  // ---------- SIGNATURE LAYOUT (Blue-noise / Poisson-ish) ----------
  const enabled = signatures.filter(s => s.enabled);
  // determinstic seed fn in [0,1)
  const seedFn = (s) => {
    // cheap hash → [0,1)
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    h ^= h << 13; h ^= h >>> 7; h ^= h << 17;
    return (h >>> 0) / 4294967295;
  };

  const placements = layoutSignatures(ctx, w, h, enabled, seedFn);

  // ---------- DRAW ----------
  for (const p of placements) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.font = `${p.size}px 'Brush Script MT','Segoe Script','Pacifico','Dancing Script',cursive`;
    ctx.fillStyle = `rgba(10,10,10,0.92)`;
    ctx.shadowColor = 'rgba(255,255,255,0.35)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 0.5; ctx.shadowOffsetY = 0.5;
    ctx.textBaseline = 'middle';
    ctx.fillText(p.name, 0, 0);
    ctx.restore();

    // optional: guide dots for debugging overlaps
    // ctx.fillStyle = 'rgba(80,200,255,0.35)';
    // ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI*2); ctx.fill();
  }

}
