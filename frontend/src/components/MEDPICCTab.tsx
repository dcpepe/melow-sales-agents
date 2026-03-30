"use client";

import { MEDPICCScoring, MEDPICCCategory } from "@/lib/api";

function CategoryCard({ name, label, cat }: { name: string; label: string; cat: MEDPICCCategory }) {
  const pct = (cat.score / 5) * 100;
  const color =
    cat.score >= 4 ? "bg-green-500" : cat.score >= 2 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-2xl font-bold text-gray-900 mr-2">{name}</span>
          <span className="text-sm text-gray-500">{label}</span>
        </div>
        <span className="text-2xl font-bold text-gray-900">{cat.score}/5</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-sm text-gray-700 mb-2">{cat.summary}</p>
      {cat.missing_info.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-red-600 uppercase mb-1">Missing</p>
          <ul className="space-y-1">
            {cat.missing_info.map((info, i) => (
              <li key={i} className="text-xs text-gray-600">{info}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function MEDPICCTab({ data }: { data: MEDPICCScoring }) {
  const riskColor =
    data.risk_assessment === "Low"
      ? "text-green-600 bg-green-50"
      : data.risk_assessment === "Medium"
      ? "text-yellow-600 bg-yellow-50"
      : "text-red-600 bg-red-50";

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-wrap gap-6">
        <div>
          <p className="text-sm text-gray-500">Overall MEDPICC</p>
          <p className="text-4xl font-bold text-gray-900">{Math.round(data.overall_score)}%</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Deal Probability</p>
          <p className="text-4xl font-bold text-gray-900">{Math.round(data.deal_probability)}%</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Risk</p>
          <span className={`inline-block mt-1 px-3 py-1 rounded-full font-semibold text-sm ${riskColor}`}>
            {data.risk_assessment}
          </span>
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CategoryCard name="M" label="Metrics" cat={data.metrics} />
        <CategoryCard name="E" label="Economic Buyer" cat={data.economic_buyer} />
        <CategoryCard name="D" label="Decision Criteria" cat={data.decision_criteria} />
        <CategoryCard name="D" label="Decision Process" cat={data.decision_process} />
        <CategoryCard name="P" label="Paper Process" cat={data.paper_process} />
        <CategoryCard name="I" label="Identify Pain" cat={data.identify_pain} />
        <CategoryCard name="C" label="Champion" cat={data.champion} />
        <CategoryCard name="C" label="Competition" cat={data.competition} />
      </div>

      {/* Recommended Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-l-4 border-l-blue-500 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Recommended Next Actions</h3>
        <ol className="space-y-2 list-decimal list-inside">
          {data.recommended_actions.map((action, i) => (
            <li key={i} className="text-sm text-gray-700">{action}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
