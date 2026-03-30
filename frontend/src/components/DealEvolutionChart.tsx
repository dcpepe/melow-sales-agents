"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts";
import { MedpiccSnapshot } from "@/lib/api";

interface DealEvolutionChartProps {
  history: MedpiccSnapshot[];
}

export default function DealEvolutionChart({ history }: DealEvolutionChartProps) {
  if (!history || history.length === 0) return null;

  const data = history.map((h) => ({
    date: new Date(h.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    timestamp: new Date(h.timestamp).getTime(),
    score: Math.round(h.score * 10) / 10,
    winProb: Math.round(h.win_probability * 10) / 10,
    source: h.source,
  }));

  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 text-sm">Deal Evolution</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-blue-500 rounded" />
            <span className="text-gray-500">MEDPICC %</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-emerald-500 rounded" />
            <span className="text-gray-500">Win Prob %</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "#111827",
              border: "none",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#fff",
              padding: "8px 12px",
            }}
            formatter={(value: unknown, name: unknown) => [
              `${value}%`,
              name === "score" ? "MEDPICC" : "Win Prob",
            ]}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="winProb"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 4, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
          {/* Call event markers */}
          {data.filter((d) => d.source === "call").map((d, i) => (
            <ReferenceDot key={i} x={d.date} y={d.score} r={3} fill="#3b82f6" stroke="#fff" strokeWidth={1} />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {history.length > 0 && (
        <div className="flex gap-2 mt-2">
          {history.map((h, i) => (
            <div key={i} className="flex items-center gap-1 text-[10px] text-gray-400">
              <div className={`w-1.5 h-1.5 rounded-full ${h.source === "call" ? "bg-blue-400" : h.source === "email" ? "bg-purple-400" : "bg-gray-400"}`} />
              {h.source}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
