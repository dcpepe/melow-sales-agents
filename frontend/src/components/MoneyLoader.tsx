"use client";

import { useEffect, useState } from "react";

const TIPS = [
  "Analyzing transcript...",
  "Scoring call quality...",
  "Evaluating MEDPICC...",
  "Identifying risks...",
  "Generating coaching...",
];

export default function MoneyLoader() {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium text-gray-900 mb-1">{TIPS[tipIndex]}</p>
        <p className="text-xs text-gray-400">This may take a moment</p>
      </div>
    </div>
  );
}
