"use client";

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

function blockColor(level: number, filled: boolean) {
  if (!filled) return "bg-gray-100";
  if (level <= 1) return "bg-red-500";
  if (level <= 2) return "bg-orange-400";
  if (level <= 3) return "bg-yellow-400";
  if (level <= 4) return "bg-green-400";
  return "bg-green-500";
}

interface MedpiccBarsProps {
  categories: Record<string, number>;
  /** Show compact version (no labels, smaller) */
  compact?: boolean;
}

export default function MedpiccBars({ categories, compact = false }: MedpiccBarsProps) {
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
                  <div
                    key={level}
                    className={`w-4 h-2 rounded-sm ${blockColor(score, level <= score)}`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {CATEGORIES.map(({ key, letter, name }) => {
        const score = categories[key] ?? 0;
        return (
          <div key={key} className="flex items-center gap-3">
            <div className="w-28 flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 w-3">{letter}</span>
              <span className="text-sm text-gray-700 truncate">{name}</span>
            </div>
            <div className="flex gap-1 flex-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`h-7 flex-1 rounded-md transition-all ${blockColor(score, level <= score)} ${
                    level <= score ? "shadow-sm" : ""
                  }`}
                />
              ))}
            </div>
            <span className={`text-sm font-bold w-6 text-right ${
              score >= 4 ? "text-green-600" : score >= 2 ? "text-yellow-600" : "text-red-600"
            }`}>
              {score}
            </span>
          </div>
        );
      })}
    </div>
  );
}
