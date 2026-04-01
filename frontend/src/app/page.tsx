"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import TeamSelector from "@/components/TeamSelector";

const SUITES = [
  { id: "sales", name: "Sales", href: "/sales", active: true },
  { id: "customer-success", name: "Customer Success", href: "/customer-success", active: false },
  { id: "product", name: "Product", href: "/product", active: false },
  { id: "operations", name: "Operations", href: "/operations", active: false },
];

export default function Home() {
  const router = useRouter();
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-white text-sm font-semibold tracking-tight">melow</span>
          <TeamSelector />
        </div>
      </header>

      {/* Center content */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md w-full -mt-20">
          <p className="text-white/40 text-sm mb-1">{greeting}</p>
          <h1 className="text-white text-3xl font-bold mb-10">What are we working on?</h1>

          <div className="space-y-2">
            {SUITES.map((suite) => (
              <button
                key={suite.id}
                onClick={() => router.push(suite.href)}
                disabled={!suite.active}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-xl text-left transition-all ${
                  suite.active
                    ? "bg-white/5 hover:bg-white/10 text-white cursor-pointer"
                    : "bg-white/[0.02] text-white/20 cursor-default"
                }`}
              >
                <span className="font-medium">{suite.name}</span>
                {suite.active ? (
                  <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                ) : (
                  <span className="text-[11px] text-white/20">Soon</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
