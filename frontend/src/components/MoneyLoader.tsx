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
  "Quantifying business impact...",
  "Detecting champion signals...",
];

const MONEY_ITEMS = ["$", "$$", "$$$", "$$$$"];

export default function MoneyLoader() {
  const [tipIndex, setTipIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 2500);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev + 0.1;
        if (prev >= 70) return prev + 0.3;
        return prev + 1.2;
      });
    }, 100);

    return () => {
      clearInterval(tipInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center overflow-hidden">
      {/* Background money rain */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-money-fall select-none pointer-events-none"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
              fontSize: `${1 + Math.random() * 2}rem`,
              opacity: 0.08 + Math.random() * 0.08,
              top: "-3rem",
            }}
          >
            {MONEY_ITEMS[Math.floor(Math.random() * MONEY_ITEMS.length)]}
          </div>
        ))}
      </div>

      {/* Pulsing rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[500px] h-[500px] rounded-full border border-green-200/30 animate-ping" style={{ animationDuration: "4s" }} />
        <div className="absolute w-[350px] h-[350px] rounded-full border border-green-300/20 animate-ping" style={{ animationDuration: "3s", animationDelay: "1s" }} />
        <div className="absolute w-[200px] h-[200px] rounded-full border border-green-400/20 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.5s" }} />
      </div>

      {/* Center content */}
      <div className="relative z-10 text-center max-w-sm">
        {/* Spinning coin */}
        <div className="mb-8">
          <div className="inline-block animate-coin-spin">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/30">
              <span className="text-3xl font-bold text-yellow-800">$</span>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="w-64 mx-auto bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 95)}%` }}
            />
          </div>
        </div>

        {/* Tip */}
        <div className="bg-gray-900 text-white px-6 py-3 rounded-2xl inline-block shadow-xl">
          <p className="text-sm font-medium">{TIPS[tipIndex]}</p>
        </div>

        <p className="mt-4 text-gray-300 text-xs">Analyzing your deal</p>
      </div>

      <style jsx>{`
        @keyframes money-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        .animate-money-fall { animation: money-fall linear infinite; }

        @keyframes coin-spin {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
        .animate-coin-spin {
          animation: coin-spin 2s ease-in-out infinite;
          perspective: 600px;
        }
      `}</style>
    </div>
  );
}
