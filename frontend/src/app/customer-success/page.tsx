"use client";

import { useRouter } from "next/navigation";

export default function CustomerSuccessPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6">🤝</div>
        <h1 className="text-3xl font-bold mb-3">Customer Success</h1>
        <p className="text-gray-400 mb-2">Health scores, churn risk, expansion tracking & playbooks</p>
        <div className="inline-block bg-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
          Coming Soon
        </div>
        <div className="space-y-3 text-left bg-gray-900 rounded-xl border border-gray-800 p-6">
          <p className="text-sm text-gray-300 font-medium mb-3">What&apos;s coming:</p>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span className="text-blue-400">◆</span> Customer health scoring & alerts
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span className="text-blue-400">◆</span> Churn prediction & prevention playbooks
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span className="text-blue-400">◆</span> Expansion opportunity identification
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span className="text-blue-400">◆</span> Automated QBR prep & insights
          </div>
        </div>
        <button
          onClick={() => router.push("/")}
          className="mt-8 text-gray-500 hover:text-white text-sm transition-colors"
        >
          ← Back to Melow
        </button>
      </div>
    </div>
  );
}
