import React from 'react';

// Financial & Invoices Illustration for Login and Signup
export const FinancialAuthIllustration: React.FC<{ className?: string }> = ({
  className = 'w-full max-w-md h-auto',
}) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 480 380"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xl"
      >
        <defs>
          <linearGradient id="bgGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#c7d2fe" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f8f9ff" />
          </linearGradient>
          <linearGradient id="accentPurple" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#4338ca" />
          </linearGradient>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="chartLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4338ca" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient background glow */}
        <circle cx="240" cy="190" r="160" fill="url(#bgGlow)" filter="url(#softGlow)" />

        {/* Base Platform / Desk */}
        <ellipse cx="240" cy="310" rx="190" ry="32" fill="#e0e7ff" opacity="0.6" />
        <ellipse cx="240" cy="308" rx="160" ry="24" fill="#ede9fe" opacity="0.8" />

        {/* Main Central Invoice Card */}
        <g transform="translate(130, 70)">
          {/* Card Shadow */}
          <rect x="0" y="8" width="220" height="230" rx="20" fill="#c7d2fe" opacity="0.35" />
          {/* Main Card */}
          <rect
            x="0"
            y="0"
            width="220"
            height="230"
            rx="20"
            fill="url(#cardGrad)"
            stroke="#e0e7ff"
            strokeWidth="2"
          />

          {/* Invoice Header */}
          <rect x="22" y="22" width="34" height="34" rx="10" fill="url(#accentPurple)" />
          <path
            d="M32 39 L46 39 M32 33 L42 33 M32 45 L40 45"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
          />

          <rect x="68" y="24" width="70" height="10" rx="5" fill="#1e1b4b" opacity="0.8" />
          <rect x="68" y="40" width="46" height="7" rx="3.5" fill="#94a3b8" />

          {/* Amount Badge */}
          <rect x="146" y="22" width="54" height="24" rx="12" fill="#dcfce7" />
          <text x="173" y="38" textAnchor="middle" fill="#15803d" fontSize="10" fontWeight="bold">
            PAID
          </text>

          {/* Separator line */}
          <line x1="22" y1="72" x2="198" y2="72" stroke="#f1f5f9" strokeWidth="1.5" />

          {/* Item rows */}
          <rect x="22" y="86" width="90" height="8" rx="4" fill="#64748b" />
          <rect x="156" y="86" width="42" height="8" rx="4" fill="#334155" />

          <rect x="22" y="106" width="70" height="8" rx="4" fill="#94a3b8" />
          <rect x="164" y="106" width="34" height="8" rx="4" fill="#475569" />

          <rect x="22" y="126" width="80" height="8" rx="4" fill="#94a3b8" />
          <rect x="158" y="126" width="40" height="8" rx="4" fill="#475569" />

          {/* Mini analytics graph inside invoice */}
          <rect x="22" y="150" width="176" height="56" rx="12" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
          <path
            d="M 34 190 Q 70 165 110 178 T 184 158"
            fill="none"
            stroke="url(#chartLine)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="110" cy="178" r="3.5" fill="#4f46e5" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="184" cy="158" r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
        </g>

        {/* Floating Payment Notification Card (Top Left) */}
        <g transform="translate(40, 110)">
          <rect width="135" height="52" rx="16" fill="#ffffff" stroke="#c7d2fe" strokeWidth="1.5" />
          <circle cx="28" cy="26" r="14" fill="#dcfce7" />
          <path d="M22 26 L26 30 L34 22" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <text x="50" y="23" fill="#0f172a" fontSize="10" fontWeight="bold">
            ₹85,000 Received
          </text>
          <text x="50" y="36" fill="#64748b" fontSize="8.5">
            Instant UPI Transfer
          </text>
        </g>

        {/* Floating Automated Reminder Bell (Top Right) */}
        <g transform="translate(325, 95)">
          <rect width="125" height="52" rx="16" fill="#ffffff" stroke="#ddd6fe" strokeWidth="1.5" />
          <circle cx="28" cy="26" r="14" fill="#ede9fe" />
          <path
            d="M 28 18 C 24 18 22 21 22 25 L 20 28 L 36 28 L 34 25 C 34 21 32 18 28 18 Z M 26 30 C 26 31 27 32 28 32 C 29 32 30 31 30 30"
            fill="#4f46e5"
          />
          <text x="50" y="23" fill="#0f172a" fontSize="10" fontWeight="bold">
            WhatsApp Alert
          </text>
          <text x="50" y="36" fill="#16a34a" fontSize="8.5" fontWeight="semibold">
            ✓ Read at 09:45 AM
          </text>
        </g>

        {/* Floating Security Shield / Lock Card (Bottom Right) */}
        <g transform="translate(310, 230)">
          <rect width="130" height="48" rx="14" fill="#ffffff" stroke="#e0e7ff" strokeWidth="1.5" />
          <circle cx="26" cy="24" r="13" fill="#e0e7ff" />
          <path
            d="M 26 16 L 32 19 V 24 C 32 27 29 29.5 26 31 C 23 29.5 20 27 20 24 V 19 Z"
            fill="#4338ca"
          />
          <text x="47" y="21" fill="#0f172a" fontSize="9.5" fontWeight="bold">
            Enterprise Security
          </text>
          <text x="47" y="33" fill="#64748b" fontSize="8">
            Bank-grade AES-256
          </text>
        </g>

        {/* Golden Coins & Stars */}
        <g transform="translate(95, 260)">
          <ellipse cx="20" cy="20" rx="18" ry="8" fill="#d97706" />
          <ellipse cx="20" cy="16" rx="18" ry="8" fill="url(#goldGrad)" />
          <ellipse cx="20" cy="16" rx="12" ry="5" fill="#fef3c7" opacity="0.6" />
          <text x="20" y="19" textAnchor="middle" fill="#92400e" fontSize="9" fontWeight="bold">
            ₹
          </text>

          <ellipse cx="44" cy="24" rx="14" ry="6" fill="#d97706" />
          <ellipse cx="44" cy="20" rx="14" ry="6" fill="url(#goldGrad)" />
        </g>

        {/* Little decorative star sparkles */}
        <path d="M 120 50 L 123 57 L 130 60 L 123 63 L 120 70 L 117 63 L 110 60 L 117 57 Z" fill="#818cf8" />
        <path d="M 370 170 L 372 175 L 377 177 L 372 179 L 370 184 L 368 179 L 363 177 L 368 175 Z" fill="#fbbf24" />
      </svg>
    </div>
  );
};
