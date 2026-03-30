"use client";

import { CallAnalysis } from "@/lib/api";

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color =
    score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-semibold text-gray-900">{score}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function CallAnalysisTab({ data }: { data: CallAnalysis }) {
  const b = data.breakdown;
  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-4">
          <div
            className={`text-5xl font-bold ${
              data.call_score >= 70
                ? "text-green-600"
                : data.call_score >= 40
                ? "text-yellow-600"
                : "text-red-600"
            }`}
          >
            {data.call_score}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Overall Call Score</h2>
            <p className="text-sm text-gray-500">Based on 7 evaluation dimensions</p>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Breakdown</h3>
        <ScoreBar label="Discovery Quality" score={b.discovery_quality} />
        <ScoreBar label="Pain Identification" score={b.pain_identification} />
        <ScoreBar label="Business Impact Clarity" score={b.business_impact_clarity} />
        <ScoreBar label="Stakeholder Mapping" score={b.stakeholder_mapping} />
        <ScoreBar label="Urgency Creation" score={b.urgency_creation} />
        <ScoreBar label="Demo Clarity" score={b.demo_clarity} />
        <ScoreBar label="Next Steps Strength" score={b.next_steps_strength} />
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ListCard title="Key Mistakes" items={data.key_mistakes} color="red" />
        <ListCard title="Missed Opportunities" items={data.missed_opportunities} color="yellow" />
        <ListCard title="Open Questions" items={data.open_questions} color="blue" />
        <ListCard title="Coaching" items={data.coaching} color="green" />
      </div>
    </div>
  );
}

function ListCard({
  title,
  items,
  color,
}: {
  title: string;
  items: string[];
  color: string;
}) {
  const colorMap: Record<string, string> = {
    red: "border-l-red-500",
    yellow: "border-l-yellow-500",
    blue: "border-l-blue-500",
    green: "border-l-green-500",
  };
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-l-4 ${colorMap[color]} p-5`}>
      <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-gray-700 leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
