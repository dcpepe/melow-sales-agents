"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getDeal, AnalysisResponse } from "@/lib/api";
import CallAnalysisTab from "@/components/CallAnalysisTab";
import MEDPICCTab from "@/components/MEDPICCTab";
import ActionPlanTab from "@/components/ActionPlanTab";
import DealRoomTab from "@/components/DealRoomTab";
import ChatSidebar from "@/components/ChatSidebar";

type Tab = "analysis" | "medpicc" | "actions" | "dealroom";

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [meta, setMeta] = useState<{ deal_name?: string; company?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("analysis");

  useEffect(() => {
    getDeal(id)
      .then((raw) => {
        setData({
          id: raw.id as string,
          speaker_turns: raw.speaker_turns as AnalysisResponse["speaker_turns"],
          call_analysis: raw.call_analysis as AnalysisResponse["call_analysis"],
          medpicc: raw.medpicc as AnalysisResponse["medpicc"],
        });
        setMeta({
          deal_name: raw.deal_name as string | undefined,
          company: raw.company as string | undefined,
        });
      })
      .catch(() => setError("Deal not found"));
  }, [id]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "analysis", label: "Call Analysis" },
    { key: "medpicc", label: "MEDPICC" },
    { key: "actions", label: "Action Plan" },
    { key: "dealroom", label: "Deal Room" },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={() => router.push("/deals")} className="text-gray-900 font-medium hover:underline text-sm">
            Back to deals &rarr;
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading deal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => router.push("/deals")} className="text-gray-400 hover:text-gray-900">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {meta?.deal_name || meta?.company || "Deal Analysis"}
            </h1>
            {meta?.company && meta?.deal_name && (
              <p className="text-sm text-gray-500">{meta.company}</p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "analysis" && <CallAnalysisTab data={data.call_analysis} />}
        {activeTab === "medpicc" && <MEDPICCTab data={data.medpicc} />}
        {activeTab === "actions" && <ActionPlanTab analysisId={data.id} />}
        {activeTab === "dealroom" && <DealRoomTab analysisId={data.id} />}

        <ChatSidebar analysisId={data.id} />
      </main>
    </div>
  );
}
