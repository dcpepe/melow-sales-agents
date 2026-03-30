"use client";

import { useState, useEffect } from "react";
import FrankAvatar from "./FrankAvatar";
import FrankChat from "./FrankChat";

interface CoachingSummary {
  summary: string;
  generated_at: string;
}

export default function FrankGolden() {
  const [chatOpen, setChatOpen] = useState(false);
  const [coaching, setCoaching] = useState<CoachingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasDeals, setHasDeals] = useState(false);

  useEffect(() => {
    // Check if there are deals, then auto-load cached coaching
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
    <>
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 rounded-xl border border-amber-200/50 shadow-sm p-6 mb-8">
        <div className="flex items-start gap-4">
          <FrankAvatar size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="font-bold text-gray-900">Frank Golden</h3>
                <p className="text-xs text-gray-500">Your Sales Coach &middot; New York City</p>
              </div>
              <button
                onClick={() => setChatOpen(true)}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Talk to Frank
              </button>
            </div>

            {!hasDeals ? (
              <p className="text-sm text-gray-500 mt-2 italic">
                &ldquo;Hey, I&apos;m Frank. Once you start analyzing deals, I&apos;ll give you the real talk on how to close more. No fluff.&rdquo;
              </p>
            ) : !coaching ? (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-3 italic">
                  &ldquo;Let me take a look at your pipeline and tell you what I see...&rdquo;
                </p>
                <button
                  onClick={generateCoaching}
                  disabled={loading}
                  className="text-sm font-medium text-amber-700 hover:text-amber-900 disabled:opacity-50"
                >
                  {loading ? "Frank is reviewing..." : "Get Frank's Take"}
                </button>
              </div>
            ) : (
              <div className="mt-2">
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {coaching.summary}
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={generateCoaching}
                    disabled={loading}
                    className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    {loading ? "Refreshing..." : "Refresh"}
                  </button>
                  {coaching.generated_at && (
                    <span className="text-xs text-gray-300">
                      Updated {new Date(coaching.generated_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {chatOpen && <FrankChat onClose={() => setChatOpen(false)} />}
    </>
  );
}
