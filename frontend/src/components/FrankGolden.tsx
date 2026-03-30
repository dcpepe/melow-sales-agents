"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FrankAvatar from "./FrankAvatar";

interface CoachingSummary {
  summary: string;
  generated_at: string;
}

export default function FrankGolden() {
  const router = useRouter();
  const [coaching, setCoaching] = useState<CoachingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasDeals, setHasDeals] = useState(false);

  useEffect(() => {
    fetch("/api/coaching", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
      .then((r) => r.json())
      .then((data) => {
        if (data.summary) {
          setCoaching(data);
          setHasDeals(true);
        } else if (data.no_deals) {
          setHasDeals(false);
        } else {
          setHasDeals(true);
        }
      })
      .catch(() => {});
  }, []);

  async function generateCoaching() {
    setLoading(true);
    try {
      const res = await fetch("/api/coaching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force_regenerate: true }),
      });
      const data = await res.json();
      if (data.summary) setCoaching(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      onClick={() => router.push("/coaching")}
      className="bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 rounded-xl border border-amber-200/50 shadow-sm p-6 mb-8 cursor-pointer hover:shadow-md hover:border-amber-300 transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className="group-hover:scale-105 transition-transform">
          <FrankAvatar size="md" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="font-bold text-gray-900">Frank</h3>
              <p className="text-xs text-gray-500">Your Sales Coach &middot; New York City</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-gray-900 transition-colors">
              <span className="hidden sm:block">Enter Coaching Room</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {!hasDeals ? (
            <p className="text-sm text-gray-500 mt-2 italic">
              &ldquo;Hey, I&apos;m Frank. Once you start analyzing deals, I&apos;ll give you the real talk on how to close more. No fluff.&rdquo;
            </p>
          ) : !coaching ? (
            <div className="mt-2">
              <p className="text-sm text-gray-600 italic">
                &ldquo;Let me take a look at your pipeline and tell you what I see...&rdquo;
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); generateCoaching(); }}
                disabled={loading}
                className="mt-2 text-sm font-medium text-amber-700 hover:text-amber-900 disabled:opacity-50"
              >
                {loading ? "Frank is reviewing..." : "Get Frank's Take"}
              </button>
            </div>
          ) : (
            <div className="mt-2">
              <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                {coaching.summary}
              </p>
              <p className="text-xs text-amber-600 font-medium mt-2 group-hover:underline">
                See full coaching breakdown &rarr;
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
