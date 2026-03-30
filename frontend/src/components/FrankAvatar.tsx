"use client";

export default function FrankAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "w-8 h-8 text-base",
    md: "w-12 h-12 text-xl",
    lg: "w-20 h-20 text-4xl",
  };

  return (
    <div className={`${sizes[size]} bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30 relative`}>
      <span className="relative" style={{ lineHeight: 1 }}>😎</span>
      <span className="absolute -bottom-1 -left-1 text-xs" style={{ lineHeight: 1 }}>💰</span>
      <span className="absolute -bottom-1 -right-1 text-xs" style={{ lineHeight: 1 }}>💰</span>
    </div>
  );
}
