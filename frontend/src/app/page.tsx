"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import TeamSelector from "@/components/TeamSelector";

const SUITES = [
  {
    id: "sales",
    name: "Sales Intelligence",
    description: "Deal tracking, MEDPICC scoring, call analysis & coaching",
    icon: "💰",
    color: "from-emerald-500 to-green-600",
    hoverColor: "hover:from-emerald-400 hover:to-green-500",
    shadowColor: "shadow-emerald-500/20",
    href: "/sales",
    active: true,
    stats: "Deals, Calls, MEDPICC, Frank",
  },
  {
    id: "customer-success",
    name: "Customer Success",
    description: "Health scores, churn risk, expansion tracking & playbooks",
    icon: "🤝",
    color: "from-blue-500 to-indigo-600",
    hoverColor: "hover:from-blue-400 hover:to-indigo-500",
    shadowColor: "shadow-blue-500/20",
    href: "/customer-success",
    active: false,
    stats: "Coming soon",
  },
  {
    id: "product",
    name: "Product",
    description: "Feature requests, roadmap intelligence & customer feedback",
    icon: "🚀",
    color: "from-purple-500 to-violet-600",
    hoverColor: "hover:from-purple-400 hover:to-violet-500",
    shadowColor: "shadow-purple-500/20",
    href: "/product",
    active: false,
    stats: "Coming soon",
  },
  {
    id: "operations",
    name: "Operations",
    description: "Process optimization, workflow automation & team metrics",
    icon: "⚙️",
    color: "from-orange-500 to-red-600",
    hoverColor: "hover:from-orange-400 hover:to-red-500",
    shadowColor: "shadow-orange-500/20",
    href: "/operations",
    active: false,
    stats: "Coming soon",
  },
];

export default function Home() {
  const router = useRouter();
  const [time, setTime] = useState("");
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    setGreeting(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
    setTime(now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/5 rounded-xl flex items-center justify-center border border-white/10">
              <span className="text-xl">🧠</span>
            </div>
            <div>
              <h1 className="text-lg font-bold">Melow</h1>
              <p className="text-xs text-gray-400">Middle Management Agent Suite</p>
            </div>
          </div>
          <TeamSelector />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Greeting */}
        <div className="mb-12">
          <p className="text-gray-400 text-sm mb-1">{time}</p>
          <h2 className="text-4xl font-bold mb-2">{greeting}</h2>
          <p className="text-gray-400 text-lg">What would you like to work on?</p>
        </div>

        {/* Suite Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {SUITES.map((suite) => (
            <button
              key={suite.id}
              onClick={() => router.push(suite.href)}
              disabled={!suite.active}
              className={`group relative overflow-hidden rounded-2xl p-8 text-left transition-all duration-300 ${
                suite.active
                  ? `bg-gradient-to-br ${suite.color} ${suite.hoverColor} shadow-xl ${suite.shadowColor} hover:shadow-2xl hover:scale-[1.02] cursor-pointer`
                  : "bg-gray-900 border border-gray-800 cursor-default opacity-70"
              }`}
            >
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)",
                  backgroundSize: "24px 24px",
                }} />
              </div>

              {/* Glow effect for active */}
              {suite.active && (
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all" />
              )}

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <span className="text-5xl group-hover:scale-110 transition-transform inline-block">{suite.icon}</span>
                  {suite.active ? (
                    <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-xs font-medium">Active</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">Coming Soon</span>
                  )}
                </div>

                <h3 className="text-2xl font-bold mb-2">{suite.name}</h3>
                <p className={`text-sm mb-4 ${suite.active ? "text-white/80" : "text-gray-500"}`}>
                  {suite.description}
                </p>

                {suite.active && (
                  <div className="flex items-center gap-2 text-white/60 text-xs">
                    <span>{suite.stats}</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Bottom section */}
        <div className="text-center">
          <p className="text-gray-600 text-sm">
            Powered by AI agents — each suite has specialized intelligence for your team
          </p>
        </div>
      </main>
    </div>
  );
}
