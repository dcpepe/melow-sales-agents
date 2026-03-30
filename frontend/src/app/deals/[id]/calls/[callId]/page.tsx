"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCallAnalysis, CallAnalysisDetail } from "@/lib/api";
import CallAnalysisTab from "@/components/CallAnalysisTab";
import MEDPICCTab from "@/components/MEDPICCTab";
import ChatSidebar from "@/components/ChatSidebar";

type Tab = "analysis" | "medpicc";

export default function CallDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;
  const callId = params.callId as string;
  const [call, setCall] = useState<CallAnalysisDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("analysis");

  useEffect(() => {
    getCallAnalysis(callId)
      .then(setCall)
      .catch(() => setError("Call not found"));
  }, [callId]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={() => router.push(`/deals/${dealId}`)} className="text-gray-900 font-medium hover:underline text-sm">
            Back to deal &rarr;
          </button>
        </div>
      </div>
    );
  }

  if (!call) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">Loading call...</p></div>;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "analysis", label: "Call Analysis" },
    { key: "medpicc", label: "MEDPICC" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => router.push(`/deals/${dealId}`)} className="text-gray-400 hover:text-gray-900">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Call Detail</h1>
            <p className="text-sm text-gray-500">
              {new Date(call.created_at).toLocaleDateString(undefined, {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
            </p>
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
                activeTab === tab.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "analysis" && <CallAnalysisTab data={call.call_analysis} />}
        {activeTab === "medpicc" && <MEDPICCTab data={call.medpicc} />}

        <ChatSidebar analysisId={call.id} />
      </main>
    </div>
  );
}
