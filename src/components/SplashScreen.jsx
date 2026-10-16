import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';

// ============================================================================
// TIMING CONSTANTS (Total: 10s + 0.6s fadeout)
// ============================================================================
export const TIMINGS = {
  SCENE1_NATURE: 3.0,       // 0 - 3s Nature assembles
  SCENE2_LOGO: 2.0,         // 3 - 5s Logo reveal + blue drop
  SCENE3_SUNSET: 2.0,       // 5 - 7s City sunset transition
  SCENE4_IGNITE: 3.0,       // 7 - 10s Ignite & flame
  FADEOUT: 0.6,             // Exit fade duration
  SKIP_DELAY: 1.0,          // Skip button appears after 1s
  REDUCED_MOTION: 1.5,      // Reduced motion hold duration
};

// ============================================================================
// COLOR PALETTE CONSTANTS
// ============================================================================
export const COLORS = {
  JUNGLE_BG: '#0F4D2E',
  JUNGLE_DARK: '#08331E',
  JUNGLE_MID: '#13623B',
  JUNGLE_LIGHT: '#1E8250',
  JUNGLE_ACCENT: '#2ECC71',
  SUNSET_TOP: '#F4A259',
  SUNSET_BOTTOM: '#FBD38D',
  SUN_CORE: '#FFFDF0',
  SUN_GLOW: '#FFE8A3',
  SKYLINE_FAR: '#C86D3B',
  SKYLINE_MID: '#8D351D',
  SKYLINE_NEAR: '#4A150D',
  IGNITE_BG: '#050505',
  BLUE_DROP: '#2F7BFF',
  BLUE_GLOW: '#60A5FA',
  FIRE_RED: '#FF3B00',
  FIRE_ORANGE: '#FF8800',
  FIRE_YELLOW: '#FFD000',
  FIRE_WHITE: '#FFFFFF',
};

export default function SplashScreen({ onComplete }) {
  const containerRef = useRef(null);
  const timelineRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const [showSkip, setShowSkip] = useState(false);

  // Synchronously detect prefers-reduced-motion on first render to avoid FOUC re-render
  const [isReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // References for scene elements
  const scene1Ref = useRef(null);
  const scene3Ref = useRef(null);
  const scene4Ref = useRef(null);
  const logoWrapperRef = useRef(null);
  const blueDropRef = useRef(null);
  const flameContainerRef = useRef(null);
  const flameCoreRef = useRef(null);
  const flameInnerRef = useRef(null);
  const flameOuterRef = useRef(null);
  const sunRef = useRef(null);
  const skylineFarRef = useRef(null);
  const skylineMidRef = useRef(null);
  const skylineNearRef = useRef(null);
  const leafTLRef = useRef(null);
  const leafTRRef = useRef(null);
  const leafBLRef = useRef(null);
  const leafBRRef = useRef(null);
  const flowerLRef = useRef(null);
  const flowerRRef = useRef(null);
  const hillsRef = useRef(null);
  const windowCircleRef = useRef(null);

  // Exit transition handler
  const handleExit = useCallback(() => {
    if (!containerRef.current) return;
    if (timelineRef.current) timelineRef.current.kill();
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    gsap.to(containerRef.current, {
      opacity: 0,
      scale: 1.04,
      duration: TIMINGS.FADEOUT,
      ease: 'power2.inOut',
      onComplete: () => {
        if (onComplete) onComplete();
      },
    });
  }, [onComplete]);

  // Ember Canvas Particle Engine for Scene 4
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles = [];
    const PARTICLE_COUNT = 75;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: height + Math.random() * 200,
        radius: Math.random() * 2.5 + 1,
        speedY: Math.random() * 2.2 + 1.2,
        speedX: (Math.random() - 0.5) * 1.2,
        opacity: Math.random() * 0.8 + 0.2,
        fadeSpeed: Math.random() * 0.008 + 0.003,
        hue: Math.random() > 0.3 ? 35 : 18, // Gold or Fire Orange
        waveOffset: Math.random() * Math.PI * 2,
      });
    }

    let isRunning = true;
    const render = () => {
      if (!isRunning) return;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y -= p.speedY;
        p.x += Math.sin(p.y * 0.02 + p.waveOffset) * 0.8 + p.speedX;
        p.opacity -= p.fadeSpeed;

        if (p.y < -20 || p.opacity <= 0) {
          p.x = Math.random() * width;
          p.y = height + Math.random() * 40;
          p.opacity = Math.random() * 0.85 + 0.15;
          p.speedY = Math.random() * 2.2 + 1.2;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${Math.max(0, p.opacity)})`;
        ctx.shadowColor = `hsla(${p.hue}, 100%, 50%, 0.9)`;
        ctx.shadowBlur = p.radius * 6;
        ctx.fill();
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Main GSAP Timeline (useLayoutEffect ensures zero flash before paint)
  useLayoutEffect(() => {
    // If reduced motion is requested, show clean static presentation
    if (isReducedMotion) {
      const timer = setTimeout(() => {
        handleExit();
      }, TIMINGS.REDUCED_MOTION * 1000);
      return () => clearTimeout(timer);
    }

    // Skip button reveal timer
    const skipTimer = setTimeout(() => {
      setShowSkip(true);
    }, TIMINGS.SKIP_DELAY * 1000);

    const tl = gsap.timeline({
      onComplete: handleExit,
    });
    timelineRef.current = tl;

    // Set initial element states with autoAlpha (manages both opacity and visibility)
    gsap.set(containerRef.current, { autoAlpha: 1 });
    gsap.set(scene1Ref.current, { autoAlpha: 1 });
    gsap.set(scene3Ref.current, { autoAlpha: 0 });
    gsap.set(scene4Ref.current, { autoAlpha: 0 });
    gsap.set(logoWrapperRef.current, { scale: 0, autoAlpha: 0, transformOrigin: 'center center' });
    gsap.set(blueDropRef.current, { y: -80, autoAlpha: 0, scale: 0.3 });
    gsap.set(flameContainerRef.current, { autoAlpha: 0, scale: 0 });

    // Initial offsets for jungle pieces (Scene 1)
    gsap.set(windowCircleRef.current, { scale: 0.2, opacity: 0 });
    gsap.set(hillsRef.current, { y: 120, opacity: 0 });
    gsap.set(leafTLRef.current, { x: -160, y: -160, rotation: -40, opacity: 0 });
    gsap.set(leafTRRef.current, { x: 160, y: -160, rotation: 40, opacity: 0 });
    gsap.set(leafBLRef.current, { x: -160, y: 160, rotation: 30, opacity: 0 });
    gsap.set(leafBRRef.current, { x: 160, y: 160, rotation: -30, opacity: 0 });
    gsap.set(flowerLRef.current, { scale: 0, rotation: -45, transformOrigin: 'bottom left' });
    gsap.set(flowerRRef.current, { scale: 0, rotation: 45, transformOrigin: 'bottom right' });

    // Initial offsets for sunset skylines (Scene 3)
    gsap.set(sunRef.current, { y: 60, opacity: 0 });
    gsap.set(skylineFarRef.current, { y: 120, opacity: 0 });
    gsap.set(skylineMidRef.current, { y: 140, opacity: 0 });
    gsap.set(skylineNearRef.current, { y: 160, opacity: 0 });

    // ========================================================================
    // SCENE 1: Nature Assembles (0.0s - 3.0s)
    // ========================================================================
    tl.to(windowCircleRef.current, {
      scale: 1,
      opacity: 1,
      duration: 1.4,
      ease: 'power3.out',
    }, 0.2)
      .to(hillsRef.current, {
        y: 0,
        opacity: 1,
        duration: 1.5,
        ease: 'power3.out',
      }, 0.4)
      .to([leafTLRef.current, leafTRRef.current, leafBLRef.current, leafBRRef.current], {
        x: 0,
        y: 0,
        rotation: 0,
        opacity: 1,
        stagger: 0.15,
        duration: 1.6,
        ease: 'back.out(1.4)',
      }, 0.5)
      .to([flowerLRef.current, flowerRRef.current], {
        scale: 1,
        rotation: 0,
        stagger: 0.2,
        duration: 1.2,
        ease: 'elastic.out(1.2, 0.5)',
      }, 1.2);

    // Continuous idle gentle sway on leaves
    gsap.to(leafTLRef.current, {
      rotation: 3,
      duration: 3.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
    gsap.to(leafTRRef.current, {
      rotation: -3,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 0.5,
    });

    // ========================================================================
    // SCENE 2: Logo Reveal + Blue Drop (3.0s - 5.0s)
    // ========================================================================
    tl.to(logoWrapperRef.current, {
      scale: 1,
      autoAlpha: 1,
      duration: 1.1,
      ease: 'back.out(1.8)',
    }, 2.8)
      .to(blueDropRef.current, {
        y: 0,
        autoAlpha: 1,
        scale: 1,
        duration: 0.8,
        ease: 'bounce.out',
      }, 3.3)
      .to(blueDropRef.current, {
        filter: 'drop-shadow(0 0 16px #60A5FA) drop-shadow(0 0 28px #2F7BFF)',
        repeat: 1,
        yoyo: true,
        duration: 0.5,
        ease: 'power1.inOut',
      }, 4.1);

    // ========================================================================
    // SCENE 3: City Sunset (5.0s - 7.0s)
    // ========================================================================
    tl.to(scene1Ref.current, {
      autoAlpha: 0,
      duration: 1.0,
      ease: 'power2.inOut',
    }, 4.9)
      .to(scene3Ref.current, {
        autoAlpha: 1,
        duration: 1.0,
        ease: 'power2.inOut',
      }, 4.9)
      .to(sunRef.current, {
        y: 0,
        opacity: 1,
        duration: 1.4,
        ease: 'power3.out',
      }, 5.0)
      .to(skylineFarRef.current, {
        y: 0,
        opacity: 1,
        duration: 1.5,
        ease: 'power3.out',
      }, 5.1)
      .to(skylineMidRef.current, {
        y: 0,
        opacity: 1,
        duration: 1.6,
        ease: 'power3.out',
      }, 5.3)
      .to(skylineNearRef.current, {
        y: 0,
        opacity: 1,
        duration: 1.7,
        ease: 'power3.out',
      }, 5.5);

    // ========================================================================
    // SCENE 4: Ignite (7.0s - 10.0s)
    // ========================================================================
    tl.to(scene3Ref.current, {
      autoAlpha: 0,
      duration: 0.9,
      ease: 'power2.inOut',
    }, 7.0)
      .to(scene4Ref.current, {
        autoAlpha: 1,
        duration: 0.9,
        ease: 'power2.inOut',
      }, 7.0)
      // Drop flashes into flame
      .to(blueDropRef.current, {
        scale: 1.4,
        filter: 'drop-shadow(0 0 24px #FFFFFF) drop-shadow(0 0 40px #60A5FA)',
        duration: 0.25,
        ease: 'power2.in',
      }, 7.2)
      .to(blueDropRef.current, {
        autoAlpha: 0,
        scale: 0.2,
        duration: 0.2,
      }, 7.45)
      .to(flameContainerRef.current, {
        autoAlpha: 1,
        scale: 1,
        duration: 0.4,
        ease: 'elastic.out(1.2, 0.4)',
      }, 7.45);

    // Flickering Flame Loop during Scene 4
    const flameLoop = gsap.timeline({ repeat: -1 });
    flameLoop
      .to(flameCoreRef.current, { scaleY: 1.15, scaleX: 0.92, rotation: 2, duration: 0.12, ease: 'sine.inOut' })
      .to(flameCoreRef.current, { scaleY: 0.88, scaleX: 1.08, rotation: -2, duration: 0.14, ease: 'sine.inOut' })
      .to(flameInnerRef.current, { scaleY: 1.12, scaleX: 0.95, rotation: -3, duration: 0.16, ease: 'sine.inOut' }, 0)
      .to(flameInnerRef.current, { scaleY: 0.93, scaleX: 1.05, rotation: 3, duration: 0.13, ease: 'sine.inOut' }, 0.16)
      .to(flameOuterRef.current, { scaleY: 1.2, scaleX: 0.9, duration: 0.18, ease: 'sine.inOut' }, 0)
      .to(flameOuterRef.current, { scaleY: 0.85, scaleX: 1.1, duration: 0.15, ease: 'sine.inOut' }, 0.18);

    // Hold on ignite till 10s, then timeline finishes and triggers handleExit
    tl.to({}, { duration: 2.6 }, 7.4);

    return () => {
      clearTimeout(skipTimer);
      tl.kill();
      flameLoop.kill();
    };
  }, [handleExit, isReducedMotion]);

  return (
    <aside
      ref={containerRef}
      aria-label="Starting screen"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        zIndex: 99999,
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        backgroundColor: COLORS.JUNGLE_BG,
      }}
      className="select-none touch-none"
    >
      {/* =================================================================== */}
      {/* SCENE 1: NATURE ASSEMBLES (Vector Jungle) */}
      {/* =================================================================== */}
      <div
        ref={scene1Ref}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${COLORS.JUNGLE_MID} 0%, ${COLORS.JUNGLE_BG} 60%, ${COLORS.JUNGLE_DARK} 100%)`,
        }}
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Round Central Portal / Window to Sky */}
          <g ref={windowCircleRef} style={{ opacity: 0 }}>
            <circle cx="960" cy="540" r="380" fill="url(#skyPortalGrad)" />
            <circle cx="960" cy="540" r="380" stroke="#165B37" strokeWidth="16" />
            {/* Soft Clouds inside circle */}
            <path
              d="M780 500 C800 470 850 470 870 500 C890 480 930 480 950 500 C980 490 1020 510 1020 530 C1020 550 780 550 780 500 Z"
              fill="#FFFFFF"
              fillOpacity="0.45"
            />
            <path
              d="M920 440 C940 415 980 415 1000 440 C1020 430 1050 440 1060 460 C1060 480 910 480 920 440 Z"
              fill="#FFFFFF"
              fillOpacity="0.35"
            />
          </g>

          {/* Rolling Jungle Hills */}
          <g ref={hillsRef} style={{ opacity: 0 }}>
            <path
              d="M-100 1100 Q 400 780 960 840 T 2020 1100 Z"
              fill="#0D3F25"
            />
            <path
              d="M-50 1100 Q 550 860 1100 890 T 2050 1100 Z"
              fill="#082A19"
            />
            <circle cx="480" cy="850" r="90" fill="#145A34" />
            <circle cx="1440" cy="860" r="110" fill="#145A34" />
            <circle cx="1520" cy="890" r="80" fill="#0D3F25" />
          </g>

          {/* Tropical Monstera & Palm Fronds (Corner Layers) */}
          {/* Top Left Palm / Monstera */}
          <g ref={leafTLRef} style={{ opacity: 0 }}>
            <path
              d="M0 0 C 150 50 320 180 380 340 C 320 320 250 300 180 340 C 200 260 160 200 100 230 C 110 160 70 110 0 120 Z"
              fill="#1C7E4D"
            />
            <path
              d="M-40 -40 C 80 120 220 280 290 420 C 240 380 180 360 120 390 C 130 310 80 250 20 270 Z"
              fill="#26A364"
            />
            <path
              d="M-20 -20 Q 200 220 300 440"
              stroke="#0D4B2A"
              strokeWidth="6"
              strokeLinecap="round"
            />
          </g>

          {/* Top Right Palm / Monstera */}
          <g ref={leafTRRef} style={{ opacity: 0 }}>
            <path
              d="M1920 0 C 1770 50 1600 180 1540 340 C 1600 320 1670 300 1740 340 C 1720 260 1760 200 1820 230 C 1810 160 1850 110 1920 120 Z"
              fill="#1C7E4D"
            />
            <path
              d="M1960 -40 C 1840 120 1700 280 1630 420 C 1680 380 1740 360 1800 390 C 1790 310 1840 250 1900 270 Z"
              fill="#26A364"
            />
            <path
              d="M1940 -20 Q 1720 220 1620 440"
              stroke="#0D4B2A"
              strokeWidth="6"
              strokeLinecap="round"
            />
          </g>

          {/* Bottom Left Leaves */}
          <g ref={leafBLRef} style={{ opacity: 0 }}>
            <path
              d="M0 1080 C 160 1010 320 900 390 750 C 330 780 260 790 200 760 C 210 830 170 880 100 870 C 110 930 60 970 0 980 Z"
              fill="#166B3F"
            />
            <path
              d="M-30 1110 C 90 980 220 860 300 710 C 250 760 190 770 130 740 C 140 820 80 870 10 860 Z"
              fill="#2ECC71"
              fillOpacity="0.85"
            />
          </g>

          {/* Bottom Right Leaves */}
          <g ref={leafBRRef} style={{ opacity: 0 }}>
            <path
              d="M1920 1080 C 1760 1010 1600 900 1530 750 C 1590 780 1660 790 1720 760 C 1710 830 1750 880 1820 870 C 1810 930 1860 970 1920 980 Z"
              fill="#166B3F"
            />
            <path
              d="M1950 1110 C 1830 980 1700 860 1620 710 C 1670 760 1730 770 1790 740 C 1780 820 1840 870 1910 860 Z"
              fill="#2ECC71"
              fillOpacity="0.85"
            />
          </g>

          {/* Exotic Bird of Paradise Flowers */}
          <g ref={flowerLRef} style={{ opacity: 0 }}>
            <path d="M120 780 Q 240 720 280 640 Q 220 670 190 730 Z" fill="#FF5E00" />
            <path d="M130 790 Q 260 700 310 610 Q 240 650 200 720 Z" fill="#FFA500" />
            <path d="M140 800 Q 290 740 340 680 Q 270 710 210 760 Z" fill="#FF1A75" />
            <path d="M110 810 Q 180 770 210 800 Z" fill="#0D4B2A" />
          </g>

          <g ref={flowerRRef} style={{ opacity: 0 }}>
            <path d="M1800 780 Q 1680 720 1640 640 Q 1700 670 1730 730 Z" fill="#FF5E00" />
            <path d="M1790 790 Q 1660 700 1610 610 Q 1680 650 1720 720 Z" fill="#FFA500" />
            <path d="M1780 800 Q 1630 740 1580 680 Q 1650 710 1710 760 Z" fill="#FF1A75" />
            <path d="M1810 810 Q 1740 770 1710 800 Z" fill="#0D4B2A" />
          </g>

          {/* Gradients */}
          <defs>
            <radialGradient id="skyPortalGrad" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#FFF2D6" />
              <stop offset="60%" stopColor="#E2F2E5" />
              <stop offset="100%" stopColor="#9AD0B1" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* =================================================================== */}
      {/* =================================================================== */}
      {/* SCENE 3: CITY SUNSET (Warm Gradient + 3-Layer Silhouettes) */}
      {/* =================================================================== */}
      <div
        ref={scene3Ref}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          opacity: 0,
          visibility: 'hidden',
          background: `linear-gradient(180deg, ${COLORS.SUNSET_TOP} 0%, #F8BA74 45%, ${COLORS.SUNSET_BOTTOM} 100%)`,
        }}
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Glowing Golden Sun */}
          <g ref={sunRef} style={{ opacity: 0 }}>
            <circle cx="960" cy="460" r="180" fill="url(#sunGlowGrad)" />
            <circle cx="960" cy="460" r="120" fill="#FFFDF0" />
          </g>

          {/* Drifting Clouds */}
          <path
            d="M320 380 C360 340 440 340 480 380 C520 360 580 370 610 400 C640 390 680 410 680 430 C680 450 320 450 320 380 Z"
            fill="#FFE8C2"
            fillOpacity="0.5"
          />
          <path
            d="M1250 340 C1280 310 1350 310 1380 340 C1410 325 1460 335 1480 360 C1510 350 1540 365 1540 385 C1540 405 1250 405 1250 340 Z"
            fill="#FFE8C2"
            fillOpacity="0.45"
          />

          {/* Layer 1: Distant Skyline Silhouette (Far) */}
          <g ref={skylineFarRef} style={{ opacity: 0 }}>
            <path
              d="M0 1080 L0 740 L60 740 L60 700 L90 700 L90 740 L160 740 L160 670 L210 670 L210 740 L280 740 L310 640 L340 740 L450 740 L450 690 L520 690 L520 740 L640 740 L670 610 L680 570 L690 610 L720 740 L820 740 L820 660 L890 660 L890 740 L1020 740 L1020 680 L1080 680 L1080 740 L1200 740 L1240 630 L1280 740 L1380 740 L1380 670 L1450 670 L1450 740 L1580 740 L1610 590 L1630 590 L1660 740 L1760 740 L1760 690 L1840 690 L1840 740 L1920 740 L1920 1080 Z"
              fill={COLORS.SKYLINE_FAR}
              fillOpacity="0.85"
            />
          </g>

          {/* Layer 2: Midground City Silhouette (High-rises & Monuments) */}
          <g ref={skylineMidRef} style={{ opacity: 0 }}>
            <path
              d="M0 1080 L0 820 L90 820 L90 760 L140 760 L140 820 L240 820 L240 710 L260 710 L270 660 L280 710 L300 710 L300 820 L420 820 L420 750 L480 750 L480 820 L600 820 L600 730 L660 730 L660 820 L780 820 L810 690 L850 690 L880 820 L980 820 L980 740 L1040 740 L1040 820 L1160 820 L1160 720 L1220 720 L1220 820 L1340 820 L1370 670 L1385 640 L1400 670 L1430 820 L1520 820 L1520 750 L1600 750 L1600 820 L1720 820 L1720 730 L1780 730 L1780 820 L1920 820 L1920 1080 Z"
              fill={COLORS.SKYLINE_MID}
            />
          </g>

          {/* Layer 3: Foreground City Silhouette (Roofs, Bridges, Trees, Streetlights) */}
          <g ref={skylineNearRef} style={{ opacity: 0 }}>
            <path
              d="M0 1080 L0 900 Q 100 880 200 900 L200 850 L270 850 L270 900 L380 900 L420 840 L460 900 L580 900 L580 870 L640 870 L640 900 Q 760 880 880 900 L950 860 L1020 900 L1140 900 L1180 830 L1220 900 L1320 900 L1320 860 L1400 860 L1400 900 Q 1520 880 1640 900 L1720 850 L1800 850 L1800 900 L1920 900 L1920 1080 Z"
              fill={COLORS.SKYLINE_NEAR}
            />
            {/* Streetlights & trees silhouettes */}
            <circle cx="340" cy="880" r="14" fill={COLORS.SKYLINE_NEAR} />
            <circle cx="920" cy="875" r="18" fill={COLORS.SKYLINE_NEAR} />
            <circle cx="1500" cy="880" r="16" fill={COLORS.SKYLINE_NEAR} />
          </g>

          <defs>
            <radialGradient id="sunGlowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFF9E0" stopOpacity="1" />
              <stop offset="50%" stopColor="#FFD269" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#F4A259" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* =================================================================== */}
      {/* SCENE 4: IGNITE (Near-Black + Embers Canvas + Blazing Fire) */}
      {/* =================================================================== */}
      <div
        ref={scene4Ref}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          opacity: 0,
          visibility: 'hidden',
          backgroundColor: COLORS.IGNITE_BG,
          background: `radial-gradient(circle at 50% 50%, #200B03 0%, #0D0502 55%, ${COLORS.IGNITE_BG} 100%)`,
        }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>

      {/* =================================================================== */}
      {/* BRAND LOGO LAYER (Centered in every scene) */}
      {/* =================================================================== */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
        <div
          ref={logoWrapperRef}
          className="flex flex-col items-center justify-center relative"
          style={{
            opacity: 0,
            visibility: 'hidden',
            transform: 'scale(0)',
            width: 'clamp(190px, 46vw, 360px)',
            maxWidth: '90vw',
          }}
        >
          {/* Blue Flame-Drop (Scenes 1-2) */}
          <div
            ref={blueDropRef}
            className="mb-1 sm:mb-2 flex items-center justify-center relative"
            style={{
              opacity: 0,
              visibility: 'hidden',
              transform: 'translateY(-80px) scale(0.3)',
              width: 'clamp(36px, 8vw, 56px)',
              height: 'clamp(46px, 10vw, 70px)',
            }}
          >
            <svg
              viewBox="0 0 54 72"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full drop-shadow-[0_4px_14px_rgba(47,123,255,0.7)]"
            >
              {/* Outer teardrop */}
              <path
                d="M27 0 C27 0 54 28 54 45 C54 60 42 72 27 72 C12 72 0 60 0 45 C0 28 27 0 27 0 Z"
                fill="url(#blueDropGrad)"
              />
              {/* Inner highlight core */}
              <path
                d="M27 14 C27 14 42 34 42 47 C42 56 35 64 27 64 C19 64 12 56 12 47 C12 34 27 14 27 14 Z"
                fill="url(#blueCoreGrad)"
                fillOpacity="0.85"
              />
              <circle cx="27" cy="46" r="6" fill="#FFFFFF" fillOpacity="0.9" />
              <defs>
                <linearGradient id="blueDropGrad" x1="27" y1="0" x2="27" y2="72" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#93C5FD" />
                  <stop offset="40%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#1D4ED8" />
                </linearGradient>
                <linearGradient id="blueCoreGrad" x1="27" y1="14" x2="27" y2="64" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#60A5FA" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Real Animated Flame burning on top of Logo (Scene 4) */}
          <div
            ref={flameContainerRef}
            className="absolute -top-12 sm:-top-16 flex items-center justify-center pointer-events-none"
            style={{
              opacity: 0,
              visibility: 'hidden',
              transform: 'scale(0)',
              width: 'clamp(60px, 14vw, 100px)',
              height: 'clamp(80px, 18vw, 130px)',
            }}
          >
            <svg
              viewBox="0 0 100 130"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full filter drop-shadow-[0_0_24px_rgba(255,100,0,0.9)]"
            >
              {/* Outer Blazing Fire Layer */}
              <path
                ref={flameOuterRef}
                d="M50 0 C55 25 88 45 92 78 C96 108 76 130 50 130 C24 130 4 108 8 78 C12 45 45 25 50 0 Z"
                fill="url(#flameOuterGrad)"
                style={{ transformOrigin: '50% 90%' }}
              />
              {/* Inner Bright Orange/Yellow Fire */}
              <path
                ref={flameInnerRef}
                d="M50 20 C54 38 78 55 80 82 C82 105 68 122 50 122 C32 122 18 105 20 82 C22 55 46 38 50 20 Z"
                fill="url(#flameInnerGrad)"
                style={{ transformOrigin: '50% 90%' }}
              />
              {/* Core White Hot Flame */}
              <path
                ref={flameCoreRef}
                d="M50 45 C52 58 66 70 68 88 C70 102 60 114 50 114 C40 114 30 102 32 88 C34 70 48 58 50 45 Z"
                fill="url(#flameCoreGrad)"
                style={{ transformOrigin: '50% 90%' }}
              />
              <defs>
                <linearGradient id="flameOuterGrad" x1="50" y1="0" x2="50" y2="130" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FF1E00" />
                  <stop offset="40%" stopColor="#FF6200" />
                  <stop offset="100%" stopColor="#B31000" />
                </linearGradient>
                <linearGradient id="flameInnerGrad" x1="50" y1="20" x2="50" y2="122" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFF275" />
                  <stop offset="50%" stopColor="#FFA600" />
                  <stop offset="100%" stopColor="#FF3700" />
                </linearGradient>
                <linearGradient id="flameCoreGrad" x1="50" y1="45" x2="50" y2="114" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="70%" stopColor="#FFFBE6" />
                  <stop offset="100%" stopColor="#FFC83B" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* White Chunky Stacked Wordmark: "MY / CITI" */}
          <div
            className="flex flex-col items-center justify-center leading-[0.88] text-white tracking-tight"
            style={{
              fontFamily: "'Lilita One', cursive, sans-serif",
              textShadow: '0 8px 24px rgba(0,0,0,0.45), 0 2px 4px rgba(0,0,0,0.6)',
            }}
          >
            <span
              style={{
                fontSize: 'clamp(54px, 13vw, 105px)',
                letterSpacing: '0.04em',
              }}
              className="drop-shadow-[0_6px_16px_rgba(0,0,0,0.5)] inline-block"
            >
              MY
            </span>
            <span
              style={{
                fontSize: 'clamp(58px, 14vw, 114px)',
                letterSpacing: '0.05em',
              }}
              className="drop-shadow-[0_6px_20px_rgba(0,0,0,0.55)] inline-block"
            >
              CITI
            </span>
          </div>

          {/* Subtitle Accent */}
          <span
            className="mt-3 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-white/80 bg-black/25 backdrop-blur-sm px-3.5 py-1 rounded-full border border-white/20 shadow-lg"
          >
            Explore &bull; Celebrate &bull; Discover
          </span>
        </div>
      </div>

      {/* =================================================================== */}
      {/* SKIP BUTTON (Appears at bottom right after 1s) */}
      {/* =================================================================== */}
      {showSkip && (
        <button
          type="button"
          onClick={handleExit}
          aria-label="Skip intro animation"
          style={{
            position: 'absolute',
            right: 'max(1.25rem, env(safe-area-inset-right))',
            bottom: 'max(1.25rem, env(safe-area-inset-bottom))',
            zIndex: 100000,
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-black/40 hover:bg-black/60 active:scale-95 text-white/90 hover:text-white backdrop-blur-md rounded-full text-xs font-bold tracking-wider uppercase border border-white/25 shadow-2xl transition-all duration-200 pointer-events-auto cursor-pointer"
        >
          <span>Skip</span>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}
    </aside>
  );
}
