"use client";

import { useState } from "react";

const CATEGORIES = [
  { key: "metrics", letter: "M", name: "Metrics", what_good_looks_like: "Quantified success metrics, ROI targets, KPIs defined" },
  { key: "economic_buyer", letter: "E", name: "Economic Buyer", what_good_looks_like: "EB identified by name, engaged in process, budget authority confirmed" },
  { key: "decision_criteria", letter: "D", name: "Decision Criteria", what_good_looks_like: "Written evaluation criteria, technical + business requirements documented" },
  { key: "decision_process", letter: "D", name: "Decision Process", what_good_looks_like: "Steps, timeline, approvals, committee members all mapped" },
  { key: "paper_process", letter: "P", name: "Paper Process", what_good_looks_like: "Legal, procurement, contract process, security review timeline known" },
  { key: "identify_pain", letter: "I", name: "Identify Pain", what_good_looks_like: "Pain quantified in business terms, linked to strategic initiative" },
  { key: "champion", letter: "C", name: "Champion", what_good_looks_like: "Internal advocate identified, actively selling for you, has access to power" },
  { key: "competition", letter: "C", name: "Competition", what_good_looks_like: "All competitors identified, differentiation clear, strategy to win defined" },
];

const LEVEL_DESCRIPTIONS: Record<number, string> = {
  0: "Not addressed at all",
  1: "Briefly mentioned, no detail",
  2: "Some information gathered, significant gaps",
  3: "Good understanding, some gaps remain",
  4: "Well covered, minor gaps only",
  5: "Fully validated and confirmed",
};

function blockColor(score: number, filled: boolean) {
  if (!filled) return "bg-gray-100";
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

interface MedpiccBarsProps {
  categories: Record<string, number>;
  /** Detailed breakdown with summary + missing info per category */
  breakdown?: Record<string, CategoryDetail>;
  compact?: boolean;
}

export default function MedpiccBars({ categories, breakdown, compact = false }: MedpiccBarsProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (compact) {
    return (
      <div className="space-y-1">
        {CATEGORIES.map(({ key, letter }) => {
          const score = categories[key] ?? 0;
          return (
            <div key={key} className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-gray-500 w-3">{letter}</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div key={level} className={`w-4 h-2 rounded-sm ${blockColor(score, level <= score)}`} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {CATEGORIES.map(({ key, letter, name, what_good_looks_like }) => {
        const score = categories[key] ?? 0;
        const detail = breakdown?.[key];
        const isExpanded = expanded === key;
        const nextLevel = Math.min(score + 1, 5);

        return (
          <div key={key}>
            {/* Bar row — clickable */}
            <button
              onClick={() => setExpanded(isExpanded ? null : key)}
              className={`w-full flex items-center gap-3 py-2 px-1 rounded-lg transition-colors ${isExpanded ? "bg-gray-50" : "hover:bg-gray-50"}`}
            >
              <div className="w-28 flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-bold text-gray-400 w-3">{letter}</span>
                <span className="text-sm text-gray-700 truncate">{name}</span>
              </div>
              <div className="flex gap-1 flex-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`h-7 flex-1 rounded-md transition-all ${blockColor(score, level <= score)} ${level <= score ? "shadow-sm" : ""}`}
                  />
                ))}
              </div>
              <span className={`text-sm font-bold w-6 text-right flex-shrink-0 ${
                score >= 4 ? "text-green-600" : score >= 2 ? "text-yellow-600" : "text-red-600"
              }`}>
                {score}
              </span>
              <svg className={`w-4 h-4 text-gray-300 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Expanded detail */}
            {isExpanded && (
              <div className="ml-6 mr-2 mb-3 mt-1 p-4 bg-gray-50 rounded-xl border space-y-4">
                {/* Current level */}
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold text-white ${blockColor(score, true)}`}>
                    Level {score}/5
                  </div>
                  <span className="text-xs text-gray-500">{LEVEL_DESCRIPTIONS[score]}</span>
                </div>

                {/* What we know */}
                {detail?.summary && (
                  <div>
                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1.5">What We Know</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{detail.summary}</p>
                  </div>
                )}

                {/* What's missing */}
                {detail?.missing_info && detail.missing_info.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1.5">What&apos;s Missing</p>
                    <ul className="space-y-1">
                      {detail.missing_info.map((info, i) => (
                        <li key={i} className="text-sm text-gray-700 flex gap-2">
                          <span className="text-red-400 flex-shrink-0 mt-0.5">!</span>
                          {info}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* To reach next level */}
                {score < 5 && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1.5">
                      To Reach Level {nextLevel}
                    </p>
                    <p className="text-xs text-blue-600 mb-2">{LEVEL_DESCRIPTIONS[nextLevel]}</p>
                    <div className="flex gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-3 flex-1 rounded-sm ${
                            level <= score ? blockColor(score, true)
                            : level === nextLevel ? `${blockColor(nextLevel, true)} animate-pulse`
                            : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* What good looks like */}
                <div className="border-t pt-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">What 5/5 Looks Like</p>
                  <p className="text-xs text-gray-500 italic">{what_good_looks_like}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
