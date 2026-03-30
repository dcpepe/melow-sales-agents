"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getDealRoom, DealRoom } from "@/lib/api";

export default function DealRoomPage() {
  const params = useParams();
  const id = params.id as string;
  const [dealRoom, setDealRoom] = useState<DealRoom | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDealRoom(id)
      .then(setDealRoom)
      .catch(() => setError("Deal room not found"));
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  if (!dealRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Deal Room</p>
          <h1 className="text-2xl font-bold text-gray-900">{dealRoom.company_name}</h1>
          <p className="text-sm text-gray-500 mt-1">{dealRoom.participants.join(", ")}</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Meeting Summary */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Meeting Summary</h2>
          <p className="text-gray-700 leading-relaxed">{dealRoom.meeting_summary}</p>
        </div>

        {/* Call Summary */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Call Summary</h2>
          <p className="text-gray-700 text-sm leading-relaxed">{dealRoom.call_summary}</p>
        </div>

        {/* Grid sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Section title="Key Takeaways" items={dealRoom.key_takeaways} />
          <Section title="Identified Challenges" items={dealRoom.pain_points} />
          <Section title="Objectives" items={dealRoom.objectives} />
          <Section title="Opportunities" items={dealRoom.opportunities} />
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Next Steps</h2>
          <ol className="space-y-3 list-decimal list-inside">
            {dealRoom.next_steps.map((step, i) => (
              <li key={i} className="text-sm text-gray-700">{step}</li>
            ))}
          </ol>
        </div>

        {/* Value Proposition */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-xl p-6 text-white">
          <h2 className="font-semibold mb-2">How We Can Help</h2>
          <p className="text-sm leading-relaxed opacity-90">{dealRoom.value_proposition}</p>
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-400">Powered by Melow Sales Intelligence</p>
        </div>
      </main>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-gray-700 flex gap-2">
            <span className="text-gray-300 mt-0.5">&#8226;</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
