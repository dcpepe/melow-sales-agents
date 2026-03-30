"use client";

import { useEffect, useState } from "react";

const TIPS = [
  "Scoring your discovery questions...",
  "Mapping stakeholders...",
  "Evaluating MEDPICC categories...",
  "Identifying pain points...",
  "Calculating deal probability...",
  "Finding missed opportunities...",
  "Crafting coaching suggestions...",
  "Assessing urgency signals...",
];

function FallingMoney({ delay, left, size, duration }: { delay: number; left: number; size: number; duration: number }) {
  return (
    <div
      className="absolute animate-fall pointer-events-none select-none"
      style={{
        left: `${left}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        fontSize: `${size}rem`,
        top: "-3rem",
      }}
    >
      {["$", "💰", "💵", "🤑", "💸", "$$$"][Math.floor(Math.random() * 6)]}
    </div>
  );
}

export default function MoneyLoader() {
  const [tipIndex, setTipIndex] = useState(0);
  const [coins] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      delay: Math.random() * 4,
      left: Math.random() * 100,
      size: 1.2 + Math.random() * 1.8,
      duration: 2.5 + Math.random() * 3,
    }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center overflow-hidden">
      {/* Falling money */}
      {coins.map((coin) => (
        <FallingMoney key={coin.id} {...coin} />
      ))}

      {/* Center content */}
      <div className="relative z-10 text-center">
        <div className="text-6xl mb-6 animate-bounce">💰</div>
        <div className="bg-gray-900 text-white px-8 py-4 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: "0s" }} />
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
            </div>
            <p className="text-sm font-medium">{TIPS[tipIndex]}</p>
          </div>
        </div>
        <p className="mt-4 text-gray-500 text-xs">Making it rain intelligence</p>
      </div>

      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation: fall linear infinite;
        }
      `}</style>
    </div>
  );
}
