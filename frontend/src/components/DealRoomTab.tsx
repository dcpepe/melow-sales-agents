"use client";

import { useState } from "react";
import { createDealRoom, DealRoom } from "@/lib/api";

export default function DealRoomTab({ analysisId }: { analysisId: string }) {
  const [loading, setLoading] = useState(false);
  const [dealRoom, setDealRoom] = useState<DealRoom | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await createDealRoom(analysisId);
      setDealRoom(res.deal_room);
      setShareUrl(res.shareable_url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate deal room");
    } finally {
      setLoading(false);
    }
  }

  if (!dealRoom) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Deal Room</h3>
        <p className="text-sm text-gray-500 mb-6">
          Create a shareable, prospect-facing deal room with executive summary,
          takeaways, and next steps.
        </p>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Generating..." : "Create Deal Room"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {shareUrl && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900">Shareable Link</p>
            <p className="text-sm text-blue-700 font-mono">{shareUrl}</p>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(shareUrl)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            Copy
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{dealRoom.company_name}</h2>
        <p className="text-gray-500 text-sm mb-4">
          {dealRoom.participants.join(", ")}
        </p>
        <p className="text-gray-700">{dealRoom.meeting_summary}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Call Summary</h3>
        <p className="text-gray-700 text-sm leading-relaxed">{dealRoom.call_summary}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="Key Takeaways" items={dealRoom.key_takeaways} />
        <Section title="Pain Points" items={dealRoom.pain_points} />
        <Section title="Objectives" items={dealRoom.objectives} />
        <Section title="Opportunities" items={dealRoom.opportunities} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Next Steps</h3>
        <ol className="space-y-2 list-decimal list-inside">
          {dealRoom.next_steps.map((step, i) => (
            <li key={i} className="text-sm text-gray-700">{step}</li>
          ))}
        </ol>
      </div>

      <div className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-xl p-6 text-white">
        <h3 className="font-semibold mb-2">Value Proposition</h3>
        <p className="text-sm leading-relaxed opacity-90">{dealRoom.value_proposition}</p>
      </div>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-gray-700">{item}</li>
        ))}
      </ul>
    </div>
  );
}
