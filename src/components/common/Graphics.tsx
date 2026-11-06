import React from 'react';

// Cute 3D robot avatar matching reference image
export const RobotAvatar: React.FC<{ className?: string; isSpeaking?: boolean }> = ({
  className = 'w-16 h-16',
  isSpeaking = false,
}) => (
  <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
    {isSpeaking && (
      <span className="absolute -inset-1 rounded-full bg-indigo-400/30 animate-ping" />
    )}
    <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-md">
      <defs>
        <linearGradient id="botHead" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#eef2ff" />
          <stop offset="100%" stopColor="#c7d2fe" />
        </linearGradient>
        <linearGradient id="botScreen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="botEar" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id="botEye" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>

      {/* Antenna */}
      <circle cx="60" cy="18" r="5" fill="#4f46e5" />
      <rect x="58" y="22" width="4" height="10" rx="2" fill="#818cf8" />

      {/* Ears */}
      <rect x="18" y="44" width="8" height="24" rx="4" fill="url(#botEar)" />
      <rect x="94" y="44" width="8" height="24" rx="4" fill="url(#botEar)" />

      {/* Head Capsule */}
      <rect x="24" y="30" width="72" height="52" rx="26" fill="url(#botHead)" stroke="#c7d2fe" strokeWidth="2" />

      {/* Face Screen */}
      <rect x="32" y="38" width="56" height="36" rx="14" fill="url(#botScreen)" />

      {/* Eyes */}
      <ellipse cx="46" cy="54" rx="5.5" ry="7" fill="url(#botEye)" />
      <ellipse cx="74" cy="54" rx="5.5" ry="7" fill="url(#botEye)" />
      <circle cx="48" cy="52" r="2" fill="#ffffff" />
      <circle cx="76" cy="52" r="2" fill="#ffffff" />

      {/* Cute Smile / Mouth */}
      <path d="M 52 64 Q 60 70 68 64" fill="none" stroke="#67e8f9" strokeWidth="2.5" strokeLinecap="round" />

      {/* Blush cheeks */}
      <circle cx="40" cy="62" r="3" fill="#f43f5e" opacity="0.6" />
      <circle cx="80" cy="62" r="3" fill="#f43f5e" opacity="0.6" />

      {/* Body preview */}
      <path d="M 40 82 Q 60 92 80 82 L 86 106 Q 60 114 34 106 Z" fill="url(#botHead)" stroke="#c7d2fe" strokeWidth="1.5" />
      <circle cx="60" cy="95" r="4" fill="#4f46e5" />
    </svg>
  </div>
);

// 3D Isometric Crown on Pedestal
export const CrownPedestalGraphic: React.FC<{ className?: string }> = ({ className = 'w-24 h-24' }) => (
  <div className={`relative shrink-0 flex items-center justify-center ${className}`}>
    <svg viewBox="0 0 140 140" className="w-full h-full drop-shadow-lg">
      <defs>
        <linearGradient id="pedestalTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ede9fe" />
          <stop offset="100%" stopColor="#ddd6fe" />
        </linearGradient>
        <linearGradient id="pedestalSide" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="crownGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>

      {/* Base Pedestal Step 1 */}
      <path d="M 70 95 L 120 112 L 70 128 L 20 112 Z" fill="url(#pedestalTop)" />
      <path d="M 20 112 L 70 128 L 70 136 L 20 120 Z" fill="url(#pedestalSide)" />
      <path d="M 70 128 L 120 112 L 120 120 L 70 136 Z" fill="#7c3aed" />

      {/* Base Pedestal Step 2 */}
      <path d="M 70 78 L 110 92 L 70 106 L 30 92 Z" fill="#f5f3ff" />
      <path d="M 30 92 L 70 106 L 70 114 L 30 100 Z" fill="#a78bfa" />
      <path d="M 70 106 L 110 92 L 110 100 L 70 114 Z" fill="#8b5cf6" />

      {/* Pedestal Top Platform */}
      <path d="M 70 65 L 100 76 L 70 87 L 40 76 Z" fill="#ffffff" stroke="#c4b5fd" strokeWidth="1" />

      {/* Crown */}
      <g transform="translate(42, 30)">
        {/* Shadow */}
        <ellipse cx="28" cy="38" rx="20" ry="6" fill="#7c3aed" opacity="0.25" />
        {/* Crown body */}
        <path
          d="M 6 32 L 50 32 L 54 12 L 38 22 L 28 4 L 18 22 L 2 12 Z"
          fill="url(#crownGold)"
          stroke="#b45309"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Crown jewels */}
        <circle cx="28" cy="5" r="3.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
        <circle cx="3" cy="13" r="3" fill="#3b82f6" stroke="#ffffff" strokeWidth="1" />
        <circle cx="53" cy="13" r="3" fill="#10b981" stroke="#ffffff" strokeWidth="1" />
        <circle cx="28" cy="24" r="2.5" fill="#ffffff" />
        <circle cx="16" cy="26" r="2" fill="#ffffff" />
        <circle cx="40" cy="26" r="2" fill="#ffffff" />
      </g>
    </svg>
  </div>
);

// 3D Decorative Bar Chart with Trending Arrow for Header
export const Header3DBarGraphic: React.FC<{ className?: string }> = ({ className = 'w-48 h-28' }) => (
  <div className={`pointer-events-none select-none opacity-85 ${className}`}>
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <defs>
        <linearGradient id="barGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#a5b4fc" />
          <stop offset="100%" stopColor="#c7d2fe" />
        </linearGradient>
        <linearGradient id="barGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#a5b4fc" />
        </linearGradient>
        <linearGradient id="barGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
        <linearGradient id="barGrad4" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="arrowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>

      {/* Bar 1 */}
      <g transform="translate(100, 70)">
        <path d="M 0 0 L 14 5 L 14 36 L 0 31 Z" fill="url(#barGrad1)" />
        <path d="M 14 5 L 24 0 L 24 31 L 14 36 Z" fill="#93c5fd" />
        <path d="M 0 0 L 10 -5 L 24 0 L 14 5 Z" fill="#e0e7ff" />
      </g>

      {/* Bar 2 */}
      <g transform="translate(122, 54)">
        <path d="M 0 0 L 14 5 L 14 52 L 0 47 Z" fill="url(#barGrad2)" />
        <path d="M 14 5 L 24 0 L 24 47 L 14 52 Z" fill="#818cf8" />
        <path d="M 0 0 L 10 -5 L 24 0 L 14 5 Z" fill="#c7d2fe" />
      </g>

      {/* Bar 3 */}
      <g transform="translate(144, 38)">
        <path d="M 0 0 L 14 5 L 14 68 L 0 63 Z" fill="url(#barGrad3)" />
        <path d="M 14 5 L 24 0 L 24 63 L 14 68 Z" fill="#6366f1" />
        <path d="M 0 0 L 10 -5 L 24 0 L 14 5 Z" fill="#a5b4fc" />
      </g>

      {/* Bar 4 */}
      <g transform="translate(166, 18)">
        <path d="M 0 0 L 14 5 L 14 88 L 0 83 Z" fill="url(#barGrad4)" />
        <path d="M 14 5 L 24 0 L 24 83 L 14 88 Z" fill="#4338ca" />
        <path d="M 0 0 L 10 -5 L 24 0 L 14 5 Z" fill="#818cf8" />
      </g>

      {/* Upward curved growth line with arrow */}
      <path
        d="M 90 95 Q 130 80 170 30"
        fill="none"
        stroke="url(#arrowGrad)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <polygon points="172,24 176,36 164,32" fill="#4f46e5" />
    </svg>
  </div>
);

// CollectIQ Brand Logo
export const CollectIQLogo: React.FC<{ size?: number; className?: string }> = ({ size = 36, className = '' }) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <div
      style={{ width: size, height: size }}
      className="bg-gradient-to-tr from-[#4338ca] via-[#4f46e5] to-[#6366f1] rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0"
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
        <path d="M19 5v4h-4" />
      </svg>
    </div>
    <span className="font-extrabold text-[22px] tracking-tight text-slate-900 font-sans">
      Collect<span className="text-indigo-600">IQ</span>
    </span>
  </div>
);
