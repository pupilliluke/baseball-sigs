import { seededRandom } from "./seededRandom";


// --- layout tunables ---
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
 * Poisson-like layout with variable radii (per font size). `blockers` are
 * pre-placed keep-out circles (e.g. football laces).
 * Returns placements: [{x,y,angle,size,font,ink,name,id}]
 */
function layoutSignatures(ctx, canvasW, canvasH, enabled, seedFn, spec) {
  const placed = spec.blockers(canvasW, canvasH).map(b => ({ ...b, blocker: true }));
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
    const ink = spec.inks[Math.floor(rgen() * spec.inks.length)];

    // iterative attempts with shrink-on-fail
    let placedNode = null;
    let attempts = 0;

    while (attempts < MAX_ATTEMPTS_PER_SIG && size >= MIN_FONT) {
      const { r } = measureSignature(ctx, sig.name, size, font);
      // candidate position
      const u = rgen();                                        // 0..1
      const v = spec.vMin + rgen() * (spec.vMax - spec.vMin);  // avoid poles
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

  return placed.filter(p => !p.blocker);
}

/* ---------------------------------------------------------------- baseball */

function paintBaseballLeather(ctx, w, h, seedStr) {
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

function paintBaseballSeams(ctx, w, h) {
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

function paintBaseball(ctx, w, h, seedStr) {
  paintBaseballLeather(ctx, w, h, seedStr);
  paintBaseballSeams(ctx, w, h);
}

/* -------------------------------------------------------------- basketball */

function paintBasketball(ctx, w, h, seedStr) {
  // Orange pebbled leather
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#e8823a");
  bg.addColorStop(0.5, "#df7228");
  bg.addColorStop(1, "#c95f1e");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const sheen = ctx.createRadialGradient(w * 0.5, h * 0.4, h * 0.1, w * 0.5, h * 0.5, h * 0.8);
  sheen.addColorStop(0, "rgba(255,220,170,0.22)");
  sheen.addColorStop(1, "rgba(80,30,0,0.12)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, w, h);

  // Dense pebble grain
  const rand = seededRandom("pebble" + seedStr);
  for (let i = 0; i < 5200; i++) {
    const light = rand() > 0.5;
    ctx.fillStyle = light ? "rgba(255,190,130,0.16)" : "rgba(90,40,5,0.14)";
    const x = rand() * w, y = rand() * h, r = 0.6 + rand() * 1.3;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  // Channels: equator, two full meridians, and two curved side channels
  const channel = (draw) => {
    ctx.strokeStyle = "rgba(40,15,5,0.35)"; // groove shadow
    ctx.lineWidth = 16;
    draw();
    ctx.strokeStyle = "#231512";
    ctx.lineWidth = 9;
    draw();
  };

  // equator
  channel(() => {
    ctx.beginPath();
    ctx.moveTo(0, h * 0.5);
    ctx.lineTo(w, h * 0.5);
    ctx.stroke();
  });
  // meridians (vertical great circles appear as vertical lines in equirect)
  [0, 0.25, 0.5, 0.75].forEach(u => {
    channel(() => {
      ctx.beginPath();
      ctx.moveTo(w * u, 0);
      ctx.lineTo(w * u, h);
      ctx.stroke();
    });
  });
  // curved side channels above and below the equator
  [0.27, 0.73].forEach(base => {
    channel(() => {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const y = h * base + Math.sin((x / w) * Math.PI * 4) * h * 0.045;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
  });
}

/* ---------------------------------------------------------------- football */

function paintFootball(ctx, w, h, seedStr) {
  // Brown pebbled leather. The mesh's long axis runs through the texture
  // poles, so v≈0 / v≈1 pinch into the ball's tips.
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#6d4123");
  bg.addColorStop(0.5, "#7a4a28");
  bg.addColorStop(1, "#5e371d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const sheen = ctx.createRadialGradient(w * 0.5, h * 0.45, h * 0.1, w * 0.5, h * 0.5, h * 0.8);
  sheen.addColorStop(0, "rgba(255,210,160,0.14)");
  sheen.addColorStop(1, "rgba(30,10,0,0.18)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, w, h);

  const rand = seededRandom("pigskin" + seedStr);
  for (let i = 0; i < 4200; i++) {
    const light = rand() > 0.5;
    ctx.fillStyle = light ? "rgba(200,140,90,0.13)" : "rgba(35,15,0,0.16)";
    const x = rand() * w, y = rand() * h, r = 0.6 + rand() * 1.2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  // Panel seams (4 meridians)
  ctx.strokeStyle = "rgba(30,12,2,0.5)";
  ctx.lineWidth = 4;
  [0, 0.25, 0.5, 0.75].forEach(u => {
    ctx.beginPath();
    ctx.moveTo(w * u, 0);
    ctx.lineTo(w * u, h);
    ctx.stroke();
  });

  // White stripes near the tips
  ctx.fillStyle = "rgba(248,246,240,0.92)";
  ctx.fillRect(0, h * 0.16, w, h * 0.05);
  ctx.fillRect(0, h * 0.79, w, h * 0.05);

  // Laces: a vertical spine on the belly with cross laces
  const cx = w * 0.5;
  const top = h * 0.36, bottom = h * 0.64;
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(20,8,0,0.45)"; // lace groove
  ctx.lineWidth = 26;
  ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(cx, bottom); ctx.stroke();
  ctx.strokeStyle = "#f4f1e8";
  ctx.lineWidth = 11;
  ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(cx, bottom); ctx.stroke();
  const laceCount = 8;
  for (let i = 0; i < laceCount; i++) {
    const y = top + ((i + 0.5) / laceCount) * (bottom - top);
    ctx.strokeStyle = "rgba(20,8,0,0.35)";
    ctx.lineWidth = 15;
    ctx.beginPath(); ctx.moveTo(cx - w * 0.026, y); ctx.lineTo(cx + w * 0.026, y); ctx.stroke();
    ctx.strokeStyle = "#efece1";
    ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(cx - w * 0.026, y); ctx.lineTo(cx + w * 0.026, y); ctx.stroke();
  }
  ctx.lineCap = "butt";
}

/* -------------------------------------------------------------- sport spec */

const SPORT_SPECS = {
  baseball: {
    vMin: 0.14, vMax: 0.86,
    inks: ["#12142a", "#1b2a6b", "#1e3a8a", "#0f1d52", "#101322"], // ballpoint blue-blacks
    shadow: "rgba(20, 25, 80, 0.22)",
    paint: paintBaseball,
    blockers: () => [],
  },
  basketball: {
    vMin: 0.12, vMax: 0.88,
    inks: ["#141414", "#0d0d0d", "#f7f5ee", "#2b1608"], // marker black, paint-pen white
    shadow: "rgba(0, 0, 0, 0.3)",
    paint: paintBasketball,
    blockers: () => [],
  },
  football: {
    vMin: 0.24, vMax: 0.76, // tips pinch hard on the prolate mesh
    inks: ["#f8f6ee", "#eceada", "#e2e2ea"], // white/silver paint pens
    shadow: "rgba(0, 0, 0, 0.4)",
    paint: paintFootball,
    blockers: (w, h) => [{ x: w * 0.5, y: h * 0.5, r: h * 0.17 }], // keep laces clear
  },
};

export function drawBallTexture(canvas, signatures, seedStr, sport = "baseball") {
  const spec = SPORT_SPECS[sport] || SPORT_SPECS.baseball;
  const w = canvas.width, h = canvas.height;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, w, h);

  spec.paint(ctx, w, h, seedStr);

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

  const placements = layoutSignatures(ctx, w, h, enabled, seedFn, spec);

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
      ctx.shadowColor = spec.shadow; // faint ink bleed
      ctx.shadowBlur = 1.4;
      ctx.shadowOffsetX = 0.6; ctx.shadowOffsetY = 0.8;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.name, 0, 0);
      ctx.restore();
    }
  }
}
