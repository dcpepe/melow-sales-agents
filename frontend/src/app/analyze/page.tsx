"use client";

import { useState } from "react";
import { analyzeTranscript, AnalysisResponse } from "@/lib/api";
import CallAnalysisTab from "@/components/CallAnalysisTab";
import MEDPICCTab from "@/components/MEDPICCTab";
import DealRoomTab from "@/components/DealRoomTab";
import GranolaNotesList from "@/components/GranolaNotesList";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

type Tab = "analysis" | "medpicc" | "dealroom";

function AnalyzeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [transcript, setTranscript] = useState(searchParams.get("transcript") || "");
  const [dealName, setDealName] = useState(searchParams.get("deal") || "");
  const [company, setCompany] = useState(searchParams.get("company") || "");
  const [participants, setParticipants] = useState(searchParams.get("participants") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("analysis");

  async function handleAnalyze() {
    if (transcript.length < 50) {
      setError("Transcript must be at least 50 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeTranscript(transcript, dealName, company, participants);
      setResult(res);
      setActiveTab("analysis");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "analysis", label: "Call Analysis" },
    { key: "medpicc", label: "MEDPICC" },
    { key: "dealroom", label: "Deal Room" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="text-gray-400 hover:text-gray-900"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Analyze Call</h1>
            <p className="text-sm text-gray-500">Paste a transcript or import from Granola</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {!result && (
          <div className="space-y-6">
          <GranolaNotesList
            onSelect={(t, title, p) => {
              setTranscript(t);
              setDealName(title);
              setParticipants(p);
            }}
          />

          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Or paste a transcript</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Deal Name (optional)"
                value={dealName}
                onChange={(e) => setDealName(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <input
                type="text"
                placeholder="Company (optional)"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <input
                type="text"
                placeholder="Participants (optional)"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <textarea
              rows={12}
              placeholder="Paste your sales call transcript here..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-y"
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {loading ? "Analyzing..." : "Analyze Call"}
            </button>
          </div>
          </div>
        )}

        {result && (
          <div>
            <button
              onClick={() => setResult(null)}
              className="text-sm text-gray-500 hover:text-gray-900 mb-4"
            >
              &larr; New Analysis
            </button>

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

            {activeTab === "analysis" && <CallAnalysisTab data={result.call_analysis} />}
            {activeTab === "medpicc" && <MEDPICCTab data={result.medpicc} />}
            {activeTab === "dealroom" && <DealRoomTab analysisId={result.id} />}
          </div>
        )}
      </main>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <AnalyzeContent />
    </Suspense>
  );
}
