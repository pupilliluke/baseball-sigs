import React, { useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────
// Scroll-locked intro: the page is pinned while wheel/touch input
// scrubs a video instead of scrolling. Push past the end and the
// gate releases into the app.
//
// Adapted from the "locked scroll-scrub video hero" pattern for this
// JavaScript/Vite codebase, with the additions this app needs:
// it can be finished (the original never released), and it can always
// be escaped — a missing or slow video, reduced-motion, Escape, or the
// Skip control all open the app rather than trapping it.
// ─────────────────────────────────────────────────────────────

const COL_BG = "#05070d";
const COL_TEXT = "#f2f4f8";
const SANS = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

// If the video hasn't loaded by now, don't hold the app hostage
const LOAD_TIMEOUT_MS = 6000;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export default function ScrollLockedHero({
  videoSrc,
  title = "Collin's Signatures",
  scrollHint = "SCROLL TO OPEN",
  tagline = "Sign the ball. Spin it. Make it yours.",
  // Total input distance (px) to scrub the whole video — kept short so
  // the end arrives without a marathon of scrolling.
  scrubDistance = 1400,
  onUnlock,
}) {
  const videoRef = useRef(null);
  const titleRef = useRef(null);
  const hintRef = useRef(null);
  const taglineRef = useRef(null);
  const progressBarRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Latest onUnlock without re-running the effect (which would re-lock)
  const unlockRef = useRef(onUnlock);
  unlockRef.current = onUnlock;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let duration = 0;
    let rafId = 0;
    let targetProgress = 0;
    let currentProgress = 0;
    let hasStartedScrolling = false;
    let isSeeking = false;
    let pendingTime = null;
    let locked = false;
    let lockedScrollY = 0;
    let touchStartY = 0;
    let overscroll = 0;
    let finished = false;
    let loadTimer = 0;

    // ---- body lock (position:fixed is the reliable cross-browser pin) ----
    function engageLock() {
      if (locked) return;
      locked = true;
      lockedScrollY = window.scrollY;
      const b = document.body.style;
      b.position = "fixed";
      b.top = `-${lockedScrollY}px`;
      b.left = "0";
      b.right = "0";
      b.width = "100%";
    }

    function releaseLock() {
      if (!locked) return;
      locked = false;
      const b = document.body.style;
      b.position = "";
      b.top = "";
      b.left = "";
      b.right = "";
      b.width = "";
      window.scrollTo(0, lockedScrollY);
    }

    function finish() {
      if (finished) return;
      finished = true;
      releaseLock();
      setLeaving(true);
      // Let the fade play before swapping in the app
      window.setTimeout(() => unlockRef.current?.(), 620);
    }

    engageLock();

    // ---- video scrubbing ----
    const onLoadedData = () => {
      window.clearTimeout(loadTimer);
      duration = video.duration || 0;
      setReady(true);
    };
    const onSeeked = () => {
      isSeeking = false;
      if (pendingTime !== null) {
        const t = pendingTime;
        pendingTime = null;
        isSeeking = true;
        video.currentTime = t;
      }
    };
    // A video that never arrives must not block entry
    const onVideoError = () => finish();

    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onVideoError);
    loadTimer = window.setTimeout(() => { if (!duration) finish(); }, LOAD_TIMEOUT_MS);

    function seekTo(t) {
      if (isSeeking) { pendingTime = t; return; }
      isSeeking = true;
      video.currentTime = t;
    }

    // ---- input ----
    function addDelta(deltaY) {
      targetProgress = clamp(targetProgress + deltaY / scrubDistance, 0, 1);
      if (targetProgress > 0.001) hasStartedScrolling = true;
      // Once the reveal is complete, a little more forward intent opens the app
      if (targetProgress >= 1 && deltaY > 0) {
        overscroll += deltaY;
        if (overscroll > 120) finish();
      } else if (deltaY < 0) {
        overscroll = 0;
      }
    }

    const onWheel = (e) => { addDelta(e.deltaY); e.preventDefault(); };
    const onTouchStart = (e) => { touchStartY = e.touches[0]?.clientY ?? 0; };
    const onTouchMove = (e) => {
      const y = e.touches[0]?.clientY ?? touchStartY;
      addDelta(touchStartY - y);
      touchStartY = y;
      e.preventDefault();
    };
    // Keyboard users get through too
    const onKeyDown = (e) => {
      if (e.key === "Escape" || e.key === "Enter") { finish(); return; }
      if (e.key === "ArrowDown" || e.key === " " || e.key === "PageDown") { addDelta(220); e.preventDefault(); }
      if (e.key === "ArrowUp" || e.key === "PageUp") { addDelta(-220); e.preventDefault(); }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKeyDown);

    // Reduced motion: skip the whole performance
    if (reduceMotion) {
      finish();
    } else {
      const frame = () => {
        currentProgress += (targetProgress - currentProgress) * 0.18;
        if (duration > 0) seekTo(currentProgress * duration);

        if (videoRef.current) {
          videoRef.current.style.transform = `scale(${1 + currentProgress * 0.06})`;
        }
        if (titleRef.current) {
          const t = 1 - clamp(currentProgress / 0.35, 0, 1);
          titleRef.current.style.opacity = String(t);
          titleRef.current.style.transform = `translateY(${(1 - t) * -24}px) scale(${0.96 + t * 0.04})`;
          titleRef.current.style.filter = `blur(${(1 - t) * 10}px)`;
        }
        if (hintRef.current) {
          hintRef.current.style.opacity = hasStartedScrolling ? "0" : "1";
        }
        if (taglineRef.current) {
          const t = clamp((currentProgress - 0.72) / 0.28, 0, 1);
          taglineRef.current.style.opacity = String(t);
          taglineRef.current.style.transform = `translateY(${(1 - t) * 20}px) scale(${0.97 + t * 0.03})`;
          taglineRef.current.style.filter = `blur(${(1 - t) * 8}px)`;
        }
        if (progressBarRef.current) {
          progressBarRef.current.style.transform = `scaleX(${currentProgress})`;
        }
        rafId = requestAnimationFrame(frame);
      };
      rafId = requestAnimationFrame(frame);
    }

    return () => {
      window.clearTimeout(loadTimer);
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onVideoError);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKeyDown);
      cancelAnimationFrame(rafId);
      releaseLock();
    };
  }, [scrubDistance]);

  return (
    <div
      className="fixed inset-0 z-[200]"
      style={{
        background: COL_BG,
        overflow: "hidden",
        opacity: leaving ? 0 : 1,
        transition: "opacity 0.6s ease",
        pointerEvents: leaving ? "none" : "auto",
      }}
      role="dialog"
      aria-label="Intro — scroll to open the studio"
    >
      {videoSrc && (
        <video
          ref={videoRef}
          src={videoSrc}
          muted
          playsInline
          preload="auto"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: ready ? 1 : 0,
            transformOrigin: "center center",
            willChange: "transform",
            transition: "opacity 0.6s ease",
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(5,7,13,0.45), rgba(5,7,13,0.05) 30%, rgba(5,7,13,0.2) 70%, rgba(5,7,13,0.65))",
          pointerEvents: "none",
        }}
      />

      <div
        ref={titleRef}
        style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", padding: "0 6%", textAlign: "center", pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontFamily: SANS, fontWeight: 800, fontSize: "clamp(30px, 7vw, 96px)",
            lineHeight: 1, letterSpacing: "-0.02em", color: COL_TEXT,
            textShadow: "0 4px 30px rgba(0,0,0,0.5)", display: "inline-block",
            willChange: "transform, filter, opacity",
          }}
        >
          {title}
        </span>
      </div>

      {tagline && (
        <div
          ref={taglineRef}
          style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center",
            justifyContent: "center", padding: "0 8%", textAlign: "center",
            opacity: 0, pointerEvents: "none",
          }}
        >
          <span
            style={{
              fontFamily: SANS, fontWeight: 700, fontSize: "clamp(20px, 3.4vw, 40px)",
              lineHeight: 1.2, letterSpacing: "-0.01em", color: COL_TEXT,
              textShadow: "0 4px 24px rgba(0,0,0,0.5)",
            }}
          >
            {tagline}
          </span>
        </div>
      )}

      <div
        ref={hintRef}
        style={{
          position: "absolute", left: "50%", bottom: "clamp(20px, 6vh, 48px)",
          transform: "translateX(-50%)", display: "flex", flexDirection: "column",
          alignItems: "center", gap: 8, color: "rgba(240,244,248,0.8)", fontFamily: SANS,
          fontSize: "clamp(10px, 1.4vw, 12px)", fontWeight: 600, letterSpacing: "0.3em",
          transition: "opacity 0.4s ease", pointerEvents: "none", whiteSpace: "nowrap",
        }}
      >
        <span>{scrollHint}</span>
        <svg width="14" height="18" viewBox="0 0 14 18" style={{ animation: "metro-hero-bounce 1.6s ease-in-out infinite" }}>
          <style>{`
            @keyframes metro-hero-bounce {
              0%, 100% { transform: translateY(0); opacity: 0.5; }
              50% { transform: translateY(5px); opacity: 1; }
            }
          `}</style>
          <path d="M7 1 L7 17 M2 12 L7 17 L12 12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Progress line — fills as the reveal advances */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 2, background: "rgba(255,255,255,0.12)" }}>
        <div
          ref={progressBarRef}
          style={{
            height: "100%", width: "100%",
            background: "linear-gradient(90deg, rgba(255,255,255,0.5), rgba(255,255,255,0.95))",
            transform: "scaleX(0)", transformOrigin: "left center",
          }}
        />
      </div>

      {/* Always an escape hatch */}
      <button
        onClick={() => { setLeaving(true); window.setTimeout(() => unlockRef.current?.(), 400); }}
        style={{
          position: "absolute", right: "clamp(12px, 2.5vw, 24px)", top: "clamp(12px, 2.5vw, 24px)",
          fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em",
          color: "rgba(240,244,248,0.75)", background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)", borderRadius: 9999,
          padding: "7px 14px", cursor: "pointer", backdropFilter: "blur(6px)", zIndex: 3,
        }}
      >
        Skip
      </button>
    </div>
  );
}
