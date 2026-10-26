import React, { useEffect, useState, useCallback } from 'react';

export default function SplashScreen({ onComplete }) {
  const [isExiting, setIsExiting] = useState(false);
  const [showSkip, setShowSkip] = useState(false);

  const handleExit = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 380);
  }, [onComplete]);

  useEffect(() => {
    // Show skip after 600ms
    const skipTimer = setTimeout(() => setShowSkip(true), 600);
    // Complete cinematic sequence in 2.6s
    const totalTimer = setTimeout(() => handleExit(), 2600);

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(totalTimer);
    };
  }, [handleExit]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="myCiti Loading Screen"
      onClick={handleExit}
      className={`fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden cursor-pointer select-none transition-all duration-380 ease-in-out ${
        isExiting ? 'opacity-0 scale-102 pointer-events-none' : 'opacity-100'
      }`}
      style={{ backgroundColor: '#000000' }}
    >
      {/* Expanding White Horizon Disk */}
      <div
        className="absolute w-24 h-24 rounded-full bg-white pointer-events-none animate-[expandDisk_1.2s_cubic-bezier(0.7,0,0.3,1)_0.5s_forwards]"
        style={{ transformOrigin: 'center center' }}
      />

      {/* Solid White Canvas Layer */}
      <div
        className="absolute inset-0 bg-white pointer-events-none animate-[fadeInWhite_0.4s_ease-out_1.0s_forwards]"
        style={{ opacity: 0 }}
      />

      {/* Centered myCiti Typography Logo & Emblem */}
      <div className="relative z-20 flex flex-col items-center justify-center p-6 pointer-events-none animate-[logoSettle_0.8s_cubic-bezier(0.16,1,0.3,1)_1.1s_forwards]" style={{ opacity: 0, transform: 'scale(0.85)' }}>
        {/* Minimalist Geometric Beacon Emblem */}
        <div className="mb-4 sm:mb-6">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 sm:w-12 sm:h-12">
            <circle cx="24" cy="24" r="18" stroke="#000000" strokeWidth="2.5" />
            <line x1="24" y1="2" x2="24" y2="8" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="24" y1="40" x2="24" y2="46" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="2" y1="24" x2="8" y2="24" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="40" y1="24" x2="46" y2="24" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="24" cy="24" r="4.5" fill="#000000" />
          </svg>
        </div>

        {/* Custom Typography Logo: "myCiti" */}
        <div className="w-[280px] sm:w-[380px] md:w-[440px]">
          <svg viewBox="0 0 380 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto drop-shadow-xs">
            {/* 'm' */}
            <path d="M 38 64 L 38 114" stroke="#000000" strokeWidth="6" strokeLinecap="round" />
            <path d="M 38 78 C 42 62 60 60 72 60 C 84 60 86 70 86 82 L 86 114" stroke="#000000" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 86 78 C 90 62 108 60 120 60 C 132 60 134 70 134 82 L 134 114" stroke="#000000" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />

            {/* 'y' */}
            <path d="M 154 64 L 174 98" stroke="#000000" strokeWidth="6" strokeLinecap="round" />
            <path d="M 194 64 L 174 98 C 166 114 156 130 142 130 C 136 130 132 128 130 126" stroke="#000000" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />

            {/* 'C' */}
            <path d="M 264 54 C 252 38 232 34 216 34 C 190 34 172 58 172 84 C 172 110 190 134 216 134 C 234 134 254 126 264 110" stroke="#000000" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* 'i' */}
            <path d="M 284 64 L 284 114" stroke="#000000" strokeWidth="6" strokeLinecap="round" />
            <circle cx="284" cy="44" r="4.5" fill="#000000" />

            {/* 't' */}
            <path d="M 314 42 L 314 114 C 314 114 314 124 326 124 C 332 124 336 120 336 120" stroke="#000000" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="302" y1="64" x2="326" y2="64" stroke="#000000" strokeWidth="6" strokeLinecap="round" />

            {/* 'i' */}
            <path d="M 350 64 L 350 114" stroke="#000000" strokeWidth="6" strokeLinecap="round" />
            <circle cx="350" cy="44" r="4.5" fill="#000000" />
          </svg>
        </div>

        {/* Tagline */}
        <p className="mt-4 sm:mt-5 text-[11px] sm:text-xs font-mono font-medium tracking-[0.28em] uppercase text-neutral-500">
          India Festive & City Guide
        </p>
      </div>

      {/* Skip Button */}
      {showSkip && !isExiting && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleExit();
          }}
          className="absolute bottom-6 sm:bottom-8 right-6 sm:right-8 z-30 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide bg-neutral-900/10 hover:bg-neutral-900/20 active:scale-95 text-neutral-600 border border-neutral-300 transition-all backdrop-blur-xs"
        >
          Skip ➔
        </button>
      )}

      {/* Keyframe Styles */}
      <style>{`
        @keyframes expandDisk {
          0% { transform: scale(1); opacity: 1; }
          40% { transform: scale(0.7); opacity: 1; }
          100% { transform: scale(38); opacity: 1; }
        }
        @keyframes fadeInWhite {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes logoSettle {
          0% { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
