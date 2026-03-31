"use client";

import { useState } from "react";
import { CallAnalysisDetail } from "@/lib/api";

const CATEGORIES = [
  { key: "metrics", letter: "M", name: "Metrics" },
  { key: "economic_buyer", letter: "E", name: "Economic Buyer" },
  { key: "decision_criteria", letter: "D", name: "Decision Criteria" },
  { key: "decision_process", letter: "D", name: "Decision Process" },
  { key: "paper_process", letter: "P", name: "Paper Process" },
  { key: "identify_pain", letter: "I", name: "Identify Pain" },
  { key: "champion", letter: "C", name: "Champion" },
  { key: "competition", letter: "C", name: "Competition" },
];

const LEVEL_DESC: Record<number, string> = {
  0: "Not addressed",
  1: "Briefly mentioned",
  2: "Some info, big gaps",
  3: "Good understanding, gaps remain",
  4: "Well covered, minor gaps",
  5: "Fully validated",
};

function barColor(score: number) {
  if (score <= 1) return "bg-red-500";
  if (score <= 2) return "bg-orange-400";
  if (score <= 3) return "bg-yellow-400";
  if (score <= 4) return "bg-green-400";
  return "bg-green-500";
}

interface CategoryDetail {
  score: number;
  summary: string;
  missing_info: string[];
}

interface Props {
  sortedAnalyses: CallAnalysisDetail[];
  breakdown: Record<string, CategoryDetail>;
}

export default function MedpiccProgression({ sortedAnalyses, breakdown }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-xl border p-6">
      <h3 className="font-semibold text-gray-900 mb-4">MEDPICC Progression</h3>
      <div className="space-y-1">
        {CATEGORIES.map(({ key, name }) => {
          const scores = sortedAnalyses.map((a) => {
            const medpicc = a.medpicc as unknown as Record<string, unknown>;
            const cat = medpicc?.[key] as Record<string, unknown> | undefined;
            return (cat?.score as number) ?? 0;
          });
          const first = scores[0];
          const last = scores[scores.length - 1];
          const trend = last - first;
          const isExpanded = expanded === key;
          const detail = breakdown[key];

          return (
            <div key={key}>
              {/* Clickable row */}
              <button
                onClick={() => setExpanded(isExpanded ? null : key)}
                className={`w-full flex items-center gap-3 py-2 px-1 rounded-lg transition-colors ${isExpanded ? "bg-gray-50" : "hover:bg-gray-50"}`}
              >
                <span className="text-xs font-medium text-gray-500 w-28 truncate text-left">{name}</span>
                <div className="flex gap-1.5 flex-1 items-center">
                  {scores.map((s, i) => (
                    <div key={i} className="flex-1 flex items-end gap-px">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`flex-1 h-4 rounded-sm ${level <= s ? barColor(s) : "bg-gray-100"}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                <span className={`text-xs font-bold w-8 text-right ${
                  trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-gray-400"
                }`}>
                  {trend > 0 ? `↑${trend}` : trend < 0 ? `↓${Math.abs(trend)}` : "—"}
                </span>
                <svg className={`w-4 h-4 text-gray-300 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="ml-6 mr-2 mb-3 mt-1 p-4 bg-gray-50 rounded-xl border space-y-4">
                  {/* Score journey */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {scores.map((s, i) => {
                      const date = sortedAnalyses[i]?.created_at
                        ? new Date(sortedAnalyses[i].created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                        : `Call ${i + 1}`;
                      return (
                        <div key={i} className="flex items-center gap-1">
                          {i > 0 && <span className="text-gray-300 text-xs">→</span>}
                          <div className={`px-2 py-0.5 rounded text-xs font-bold text-white ${barColor(s)}`}>
                            {s}/5
                          </div>
                          <span className="text-[10px] text-gray-400">{date}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Current level */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${barColor(last)}`}>
                        Level {last}/5
                      </span>
                      <span className="text-xs text-gray-500">{LEVEL_DESC[last]}</span>
                    </div>
                  </div>

                  {/* What we know */}
                  {detail?.summary && (
                    <div>
                      <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Where We Stand</p>
                      <p className="text-sm text-gray-700">{detail.summary}</p>
                    </div>
                  )}

                  {/* What's missing */}
                  {detail?.missing_info && detail.missing_info.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Open Questions</p>
                      <ul className="space-y-1">
                        {detail.missing_info.map((info, i) => (
                          <li key={i} className="text-sm text-gray-700 flex gap-2">
                            <span className="text-red-400 flex-shrink-0">?</span>
                            {info}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* What's needed to advance */}
                  {last < 5 && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <p className="text-xs font-semibold text-blue-700 uppercase mb-1">To Advance to Level {Math.min(last + 1, 5)}</p>
                      <p className="text-xs text-blue-600">{LEVEL_DESC[Math.min(last + 1, 5)]}</p>
                    </div>
                  )}

                  {/* Trend insight */}
                  {scores.length >= 2 && (
                    <div className={`text-xs px-3 py-2 rounded-lg ${
                      trend > 0 ? "bg-green-50 text-green-700" :
                      trend < 0 ? "bg-red-50 text-red-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {trend > 0 ? `↑ Improved by ${trend} points since first call` :
                       trend < 0 ? `↓ Declined by ${Math.abs(trend)} points — needs attention` :
                       "→ No change across calls — stuck at same level"}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-400">
        <span>← Oldest call</span>
        <div className="flex-1 border-t border-dashed border-gray-200" />
        <span>Latest call →</span>
      </div>
    </div>
  );
}
