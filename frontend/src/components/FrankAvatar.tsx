"use client";

export default function FrankAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const px = size === "sm" ? 32 : size === "md" ? 48 : 80;

  return (
    <svg width={px} height={px} viewBox="0 0 48 48" fill="none" className="flex-shrink-0">
      <defs>
        <linearGradient id={`frank-bg-${size}`} x1="0" y1="0" x2="48" y2="48">
          <stop stopColor="#fbbf24" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill={`url(#frank-bg-${size})`} />
      <circle cx="24" cy="24" r="22" stroke="#f59e0b" strokeWidth="1" opacity="0.5" />
      {/* Sunglasses */}
      <rect x="12" y="18" width="10" height="6" rx="2" fill="#1a1a1a" />
      <rect x="26" y="18" width="10" height="6" rx="2" fill="#1a1a1a" />
      <rect x="22" y="20" width="4" height="2" rx="1" fill="#1a1a1a" />
      <line x1="9" y1="21" x2="12" y2="21" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
      <line x1="36" y1="21" x2="39" y2="21" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
      {/* Glare on lenses */}
      <rect x="14" y="19" width="3" height="1.5" rx="0.75" fill="rgba(255,255,255,0.15)" />
      <rect x="28" y="19" width="3" height="1.5" rx="0.75" fill="rgba(255,255,255,0.15)" />
      {/* Smirk */}
      <path d="M19 30C20.5 32.5 22 33 24 33C26 33 27.5 32.5 29 30" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
      {/* Dollar signs */}
      <text x="3" y="44" fontSize="9" fill="#d97706" fontWeight="bold" fontFamily="system-ui">$</text>
      <text x="39" y="44" fontSize="9" fill="#d97706" fontWeight="bold" fontFamily="system-ui">$</text>
    </svg>
  );
}
