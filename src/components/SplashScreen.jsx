import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';

// ============================================================================
// TIMING CONSTANTS (Snappy 2.8s total cinematic sequence)
// ============================================================================
const TIMINGS = {
  PULSE_DURATION: 0.75,       // Blob morphs and pulses on solid black
  EXPANSION_DURATION: 0.55,   // Blob explodes outwards to solid white
  LOGO_DRAW_DURATION: 0.65,   // Vector strokes draw in & scale up
  FINAL_HOLD: 0.65,           // Perfectly sharp centered final state hold
  FADEOUT: 0.38,              // Clean exit fadeout
  REDUCED_MOTION_HOLD: 1.1,   // Reduced motion hold duration
};

export default function SplashScreen({ onComplete }) {
  const containerRef = useRef(null);
  const blobGroupRef = useRef(null);
  const blobPathRef = useRef(null);
  const whiteLayerRef = useRef(null);
  const logoWrapperRef = useRef(null);
  const animFrameRef = useRef(null);
  const timelineRef = useRef(null);

  const [showSkip, setShowSkip] = useState(false);

  // Synchronously detect prefers-reduced-motion to avoid flash
  const [isReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // Exit transition handler
  const handleExit = useCallback(() => {
    if (!containerRef.current) return;
    if (timelineRef.current) timelineRef.current.kill();
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    gsap.to(containerRef.current, {
      opacity: 0,
      scale: 1.02,
      duration: TIMINGS.FADEOUT,
      ease: 'power2.inOut',
      onComplete: () => {
        if (onComplete) onComplete();
      },
    });
  }, [onComplete]);

  // Satellite droplets refs for gooey liquid effect
  const sat1Ref = useRef(null);
  const sat2Ref = useRef(null);
  const sat3Ref = useRef(null);

  // Main 60fps Morphing Liquid Harmonic Simulation
  useEffect(() => {
    if (isReducedMotion) return;

    const numPoints = 12;
    const baseRadiusObj = { r: 52 };
    let time = 0;
    let isRunning = true;

    // Attach to window so GSAP can animate the base radius
    blobGroupRef.current._radiusObj = baseRadiusObj;

    const render = () => {
      if (!isRunning) return;
      time += 0.038;

      const r = baseRadiusObj.r;
      const pts = [];

      for (let i = 0; i < numPoints; i++) {
        const angle = (i * 2 * Math.PI) / numPoints;
        // Harmonic surface tension waves
        const wave =
          Math.sin(angle * 2 + time * 2.6) * 0.18 +
          Math.cos(angle * 3 - time * 1.8) * 0.12 +
          Math.sin(angle * 4 + time * 3.2) * 0.08;

        const currentRadius = Math.max(6, r * (1 + wave));
        pts.push({
          x: 400 + currentRadius * Math.cos(angle),
          y: 400 + currentRadius * Math.sin(angle),
        });
      }

      // Convert points to smooth closed Catmull-Rom cubic bezier path
      let d = '';
      for (let i = 0; i < numPoints; i++) {
        const p0 = pts[(i - 1 + numPoints) % numPoints];
        const p1 = pts[i];
        const p2 = pts[(i + 1) % numPoints];
        const p3 = pts[(i + 2) % numPoints];

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        if (i === 0) {
          d += `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} `;
        }
        d += `C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)} `;
      }
      d += 'Z';

      if (blobPathRef.current) {
        blobPathRef.current.setAttribute('d', d);
      }

      // Orbiting satellite droplets that merge with the gooey filter
      if (sat1Ref.current && r < 400) {
        const orbitR = r * (0.95 + Math.sin(time * 3.1) * 0.25);
        const a1 = time * 2.2;
        sat1Ref.current.setAttribute('cx', (400 + orbitR * Math.cos(a1)).toFixed(1));
        sat1Ref.current.setAttribute('cy', (400 + orbitR * Math.sin(a1)).toFixed(1));
        sat1Ref.current.setAttribute('r', (16 + Math.sin(time * 4) * 4).toFixed(1));
      }
      if (sat2Ref.current && r < 400) {
        const orbitR = r * (1.1 + Math.cos(time * 2.7) * 0.22);
        const a2 = -time * 1.9 + 2.1;
        sat2Ref.current.setAttribute('cx', (400 + orbitR * Math.cos(a2)).toFixed(1));
        sat2Ref.current.setAttribute('cy', (400 + orbitR * Math.sin(a2)).toFixed(1));
        sat2Ref.current.setAttribute('r', (13 + Math.cos(time * 3.5) * 3).toFixed(1));
      }
      if (sat3Ref.current && r < 400) {
        const orbitR = r * (1.05 + Math.sin(time * 2.4 + 1.2) * 0.2);
        const a3 = time * 1.5 + 4.2;
        sat3Ref.current.setAttribute('cx', (400 + orbitR * Math.cos(a3)).toFixed(1));
        sat3Ref.current.setAttribute('cy', (400 + orbitR * Math.sin(a3)).toFixed(1));
        sat3Ref.current.setAttribute('r', (11 + Math.sin(time * 5) * 3).toFixed(1));
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isReducedMotion]);

  // Main Motion Graphics Timeline
  useLayoutEffect(() => {
    // Reduced motion presentation
    if (isReducedMotion) {
      gsap.set(containerRef.current, { backgroundColor: '#ffffff', opacity: 1 });
      gsap.set(whiteLayerRef.current, { opacity: 1 });
      gsap.set(logoWrapperRef.current, { opacity: 1, scale: 1 });
      const paths = containerRef.current.querySelectorAll('.vector-stroke');
      paths.forEach((p) => {
        p.style.strokeDashoffset = '0';
      });
      const dots = containerRef.current.querySelectorAll('.vector-dot');
      dots.forEach((d) => {
        d.style.opacity = '1';
        d.style.transform = 'scale(1)';
      });
      const timer = setTimeout(() => {
        handleExit();
      }, TIMINGS.REDUCED_MOTION_HOLD * 1000);
      return () => clearTimeout(timer);
    }

    const skipTimer = setTimeout(() => {
      setShowSkip(true);
    }, 600);

    const tl = gsap.timeline({
      onComplete: handleExit,
    });
    timelineRef.current = tl;

    // Vector strokes preparation for draw-in
    const vectorStrokes = containerRef.current.querySelectorAll('.vector-stroke');
    vectorStrokes.forEach((el) => {
      const len = el.getTotalLength ? el.getTotalLength() : 200;
      el.style.strokeDasharray = `${len + 2}`;
      el.style.strokeDashoffset = `${len + 2}`;
    });

    const dots = containerRef.current.querySelectorAll('.vector-dot');
    gsap.set(dots, { scale: 0, opacity: 0, transformOrigin: 'center center' });

    // Initial setup
    gsap.set(containerRef.current, { backgroundColor: '#000000', opacity: 1 });
    gsap.set(whiteLayerRef.current, { opacity: 0 });
    gsap.set(logoWrapperRef.current, { opacity: 0, scale: 0.82, transformOrigin: 'center center' });

    const radiusObj = blobGroupRef.current?._radiusObj || { r: 52 };

    // ========================================================================
    // PHASE 1: ORGANIC LIQUID PULSE ON SOLID BLACK (0.0s - 0.75s)
    // ========================================================================
    tl.to(radiusObj, {
      r: 68,
      duration: 0.42,
      ease: 'sine.out',
    }, 0.0)
      .to(radiusObj, {
        r: 36, // Anticipation recoil
        duration: 0.28,
        ease: 'power2.in',
      }, 0.42)

    // ========================================================================
    // PHASE 2: FLUID LIQUID EXPANSION OUTWARDS (0.70s - 1.25s)
    // Dynamic screen transformation from solid black to crisp solid white
    // ========================================================================
      .to(radiusObj, {
        r: 2600, // Explodes outwards covering entire screen
        duration: TIMINGS.EXPANSION_DURATION,
        ease: 'power4.inOut',
      }, 0.70)
      .to(whiteLayerRef.current, {
        opacity: 1,
        duration: 0.28,
        ease: 'power2.inOut',
      }, 0.98)
      .set(containerRef.current, { backgroundColor: '#ffffff' }, 1.15)

    // ========================================================================
    // PHASE 3: CUSTOM TYPOGRAPHY LOGO DRAWS IN & SCALES UP (1.10s - 1.80s)
    // Snappy easing, clean vector lines, settles into centered final state
    // ========================================================================
      .to(logoWrapperRef.current, {
        opacity: 1,
        scale: 1.0,
        duration: TIMINGS.LOGO_DRAW_DURATION,
        ease: 'power4.out',
      }, 1.10)
      .to(vectorStrokes, {
        strokeDashoffset: 0,
        duration: 0.58,
        stagger: 0.022,
        ease: 'power3.out',
      }, 1.12)
      .to(dots, {
        scale: 1,
        opacity: 1,
        duration: 0.32,
        stagger: 0.06,
        ease: 'back.out(2.4)',
      }, 1.45)
      .to('.logo-meta', {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: 'power2.out',
      }, 1.50)

    // ========================================================================
    // PHASE 4: PERFECTLY SHARP, CENTERED FINAL STATE (1.80s - 2.45s)
    // ========================================================================
      .to({}, { duration: TIMINGS.FINAL_HOLD }, 1.80);

    return () => {
      clearTimeout(skipTimer);
      tl.kill();
    };
  }, [handleExit, isReducedMotion]);

  return (
    <aside
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="myCiti introduction animation"
      onClick={handleExit}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        zIndex: 99999,
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        backgroundColor: '#000000',
      }}
      className="select-none touch-none cursor-pointer"
    >
      {/* =================================================================== */}
      {/* SOLID WHITE TRANSFORMATION LAYER */}
      {/* =================================================================== */}
      <div
        ref={whiteLayerRef}
        className="absolute inset-0 w-full h-full pointer-events-none bg-white"
        style={{ opacity: 0 }}
      />

      {/* =================================================================== */}
      {/* CIRCULAR MORPHING WHITE LIQUID BLOB (SVG + Gooey Filter) */}
      {/* =================================================================== */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 800 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* High-Contrast Organic Liquid Metaball Filter */}
          <filter id="kineticLiquidFilter" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 34 -13"
              result="gooey"
            />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </defs>

        <g ref={blobGroupRef} filter="url(#kineticLiquidFilter)">
          {/* Orbiting Satellite Liquid Droplets */}
          <circle ref={sat1Ref} cx="400" cy="400" r="16" fill="#ffffff" />
          <circle ref={sat2Ref} cx="400" cy="400" r="13" fill="#ffffff" />
          <circle ref={sat3Ref} cx="400" cy="400" r="11" fill="#ffffff" />

          {/* Central Morphing Liquid Blob */}
          <path
            ref={blobPathRef}
            fill="#ffffff"
            d="M 400 348 C 430 348 452 370 452 400 C 452 430 430 452 400 452 C 370 452 348 430 348 400 C 348 370 370 348 400 348 Z"
          />
        </g>
      </svg>

      {/* =================================================================== */}
      {/* CUSTOM TYPOGRAPHY LOGO (Clean Vector Lines & Snappy Easing) */}
      {/* =================================================================== */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 p-6">
        <div
          ref={logoWrapperRef}
          className="flex flex-col items-center justify-center relative max-w-[90vw]"
          style={{ opacity: 0, transform: 'scale(0.82)' }}
        >
          {/* Minimalist Geometric Beacon Emblem */}
          <div className="mb-4 sm:mb-6">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10 sm:w-12 sm:h-12"
            >
              {/* Outer Precision Ring */}
              <circle
                cx="24"
                cy="24"
                r="18"
                stroke="#000000"
                strokeWidth="2.5"
                className="vector-stroke"
              />
              {/* Coordinate Reticles */}
              <line x1="24" y1="2" x2="24" y2="8" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" className="vector-stroke" />
              <line x1="24" y1="40" x2="24" y2="46" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" className="vector-stroke" />
              <line x1="2" y1="24" x2="8" y2="24" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" className="vector-stroke" />
              <line x1="40" y1="24" x2="46" y2="24" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" className="vector-stroke" />
              {/* Solid Center Core */}
              <circle cx="24" cy="24" r="4.5" fill="#000000" className="vector-dot" />
            </svg>
          </div>

          {/* Custom Vector Typography Logo: "myCiti" */}
          <div className="w-[280px] sm:w-[380px] md:w-[440px]">
            <svg
              viewBox="0 0 380 140"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-auto drop-shadow-xs"
            >
              {/* ----------------- LETTER: 'm' ----------------- */}
              {/* Stem */}
              <path
                d="M 38 64 L 38 114"
                stroke="#000000"
                strokeWidth="6"
                strokeLinecap="round"
                className="vector-stroke"
              />
              {/* Arch 1 */}
              <path
                d="M 38 78 C 42 62 60 60 72 60 C 84 60 86 70 86 82 L 86 114"
                stroke="#000000"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="vector-stroke"
              />
              {/* Arch 2 */}
              <path
                d="M 86 78 C 90 62 108 60 120 60 C 132 60 134 70 134 82 L 134 114"
                stroke="#000000"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="vector-stroke"
              />

              {/* ----------------- LETTER: 'y' ----------------- */}
              {/* Left branch */}
              <path
                d="M 154 64 L 174 98"
                stroke="#000000"
                strokeWidth="6"
                strokeLinecap="round"
                className="vector-stroke"
              />
              {/* Right branch & descending hook */}
              <path
                d="M 194 64 L 174 98 C 166 114 156 130 142 130 C 136 130 132 128 130 126"
                stroke="#000000"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="vector-stroke"
              />

              {/* ----------------- LETTER: 'C' (Capital) ----------------- */}
              <path
                d="M 264 54 C 252 38 232 34 216 34 C 190 34 172 58 172 84 C 172 110 190 134 216 134 C 234 134 254 126 264 110"
                stroke="#000000"
                strokeWidth="6.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="vector-stroke"
              />

              {/* ----------------- LETTER: 'i' (First) ----------------- */}
              <path
                d="M 284 64 L 284 114"
                stroke="#000000"
                strokeWidth="6"
                strokeLinecap="round"
                className="vector-stroke"
              />
              {/* 'i' Dot */}
              <circle
                cx="284"
                cy="44"
                r="4.5"
                fill="#000000"
                className="vector-dot"
              />

              {/* ----------------- LETTER: 't' ----------------- */}
              {/* Crossbar */}
              <path
                d="M 302 64 L 328 64"
                stroke="#000000"
                strokeWidth="6"
                strokeLinecap="round"
                className="vector-stroke"
              />
              {/* Stem with terminal bottom curve */}
              <path
                d="M 315 44 L 315 104 C 315 111 321 114 330 114"
                stroke="#000000"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="vector-stroke"
              />

              {/* ----------------- LETTER: 'i' (Second) ----------------- */}
              <path
                d="M 350 64 L 350 114"
                stroke="#000000"
                strokeWidth="6"
                strokeLinecap="round"
                className="vector-stroke"
              />
              {/* 'i' Dot */}
              <circle
                cx="350"
                cy="44"
                r="4.5"
                fill="#000000"
                className="vector-dot"
              />
            </svg>
          </div>

          {/* Minimalist Subtitle & Fine Hairline Divider */}
          <div className="logo-meta flex flex-col items-center mt-5 sm:mt-6 opacity-0 translate-y-2">
            <div className="w-12 h-[1.5px] bg-black mb-3" />
            <div className="text-[10px] sm:text-xs font-mono font-semibold tracking-[0.38em] text-black/80 uppercase">
              EXPLORE &bull; CELEBRATE &bull; DISCOVER
            </div>
            <div className="mt-1 text-[9px] sm:text-[10px] font-mono tracking-[0.25em] text-black/40 uppercase">
              INDIA LOCAL GUIDE
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MINIMALIST SKIP CONTROL */}
      {/* =================================================================== */}
      {showSkip && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleExit();
          }}
          aria-label="Skip intro animation"
          style={{
            position: 'absolute',
            right: 'max(1.5rem, env(safe-area-inset-right))',
            bottom: 'max(1.5rem, env(safe-area-inset-bottom))',
            zIndex: 100000,
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-black/5 hover:bg-black/10 active:scale-95 text-black/70 hover:text-black rounded-full text-[11px] font-mono font-bold tracking-widest uppercase border border-black/15 transition-all duration-150 pointer-events-auto cursor-pointer"
        >
          <span>SKIP</span>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}
    </aside>
  );
}
