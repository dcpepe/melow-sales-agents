"use client";

export function SalesIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="sales-grad" x1="0" y1="0" x2="48" y2="48">
          <stop stopColor="#34d399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#sales-grad)" />
      <path d="M15 32V22M21 32V18M27 32V24M33 32V16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M15 20L21 16L27 22L33 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="33" cy="14" r="2" fill="white" />
    </svg>
  );
}

export function CustomerSuccessIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="cs-grad" x1="0" y1="0" x2="48" y2="48">
          <stop stopColor="#60a5fa" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#cs-grad)" />
      <path d="M24 14C20 14 17 17 17 21C17 25 20 28 24 28C28 28 31 25 31 21C31 17 28 14 24 14Z" stroke="white" strokeWidth="2" />
      <path d="M14 34C14 30 18.5 27 24 27C29.5 27 34 30 34 34" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M30 19L32 21L36 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ProductIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="prod-grad" x1="0" y1="0" x2="48" y2="48">
          <stop stopColor="#a78bfa" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#prod-grad)" />
      <rect x="14" y="14" width="20" height="20" rx="3" stroke="white" strokeWidth="2" />
      <path d="M14 22H34" stroke="white" strokeWidth="2" />
      <path d="M22 22V34" stroke="white" strokeWidth="2" />
      <circle cx="18" cy="18" r="1.5" fill="white" />
      <circle cx="22" cy="18" r="1.5" fill="white" />
      <circle cx="26" cy="18" r="1.5" fill="white" />
    </svg>
  );
}

export function OperationsIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="ops-grad" x1="0" y1="0" x2="48" y2="48">
          <stop stopColor="#fb923c" />
          <stop offset="1" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#ops-grad)" />
      <circle cx="24" cy="24" r="8" stroke="white" strokeWidth="2" />
      <circle cx="24" cy="24" r="3" fill="white" />
      <path d="M24 12V16M24 32V36M12 24H16M32 24H36" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M15.5 15.5L18.3 18.3M29.7 29.7L32.5 32.5M15.5 32.5L18.3 29.7M29.7 18.3L32.5 15.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function BrainIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="brain-grad" x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="rgba(255,255,255,0.2)" />
          <stop offset="1" stopColor="rgba(255,255,255,0.05)" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#brain-grad)" />
      <path d="M20 10C16 10 13 13 13 16C13 17.5 13.5 18.8 14.5 19.8C13.5 20.8 13 22 13 23.5C13 26.5 15.5 29 18.5 29H21.5C24.5 29 27 26.5 27 23.5C27 22 26.5 20.8 25.5 19.8C26.5 18.8 27 17.5 27 16C27 13 24 10 20 10Z" stroke="white" strokeWidth="1.5" />
      <path d="M20 14V25" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 18H24" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 22H23" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function FrankIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="frank-grad" x1="0" y1="0" x2="48" y2="48">
          <stop stopColor="#fbbf24" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#frank-grad)" />
      {/* Sunglasses */}
      <rect x="12" y="18" width="10" height="7" rx="2" fill="#1a1a1a" />
      <rect x="26" y="18" width="10" height="7" rx="2" fill="#1a1a1a" />
      <rect x="22" y="20" width="4" height="2" rx="1" fill="#1a1a1a" />
      <rect x="9" y="20" width="3" height="2" rx="1" fill="#1a1a1a" />
      <rect x="36" y="20" width="3" height="2" rx="1" fill="#1a1a1a" />
      {/* Smirk */}
      <path d="M19 30C20 32 22 33 24 33C26 33 28 32 29 30" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
      {/* Dollar signs */}
      <text x="5" y="44" fontSize="10" fill="#fbbf24" fontWeight="bold">$</text>
      <text x="38" y="44" fontSize="10" fill="#fbbf24" fontWeight="bold">$</text>
    </svg>
  );
}

export function AgentIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="agent-grad" x1="0" y1="0" x2="48" y2="48">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#agent-grad)" />
      <circle cx="24" cy="18" r="6" stroke="white" strokeWidth="2" />
      <path d="M18 18H30" stroke="white" strokeWidth="1.5" />
      <circle cx="21" cy="16" r="1" fill="white" />
      <circle cx="27" cy="16" r="1" fill="white" />
      <path d="M24 24V28" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 28H30C32 28 33 29 33 31V34H15V31C15 29 16 28 18 28Z" stroke="white" strokeWidth="2" />
    </svg>
  );
}

export function ShieldIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function ClipboardIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}

export function DemonIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="demon-grad" x1="0" y1="0" x2="48" y2="48">
          <stop stopColor="#ef4444" />
          <stop offset="1" stopColor="#991b1b" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="20" fill="url(#demon-grad)" />
      {/* Horns */}
      <path d="M14 16L10 6L18 14" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
      <path d="M34 16L38 6L30 14" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
      {/* Eyes */}
      <path d="M16 20L20 22L16 24" fill="white" />
      <path d="M32 20L28 22L32 24" fill="white" />
      {/* Grin */}
      <path d="M17 28C19 32 29 32 31 28" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 28V31M24 28V32M28 28V31" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function GlobeIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
