"use client";

import { useState, useEffect } from "react";
import { DealListItem, listDeals } from "@/lib/api";

interface SaveDealPromptProps {
  dealName: string;
  company: string;
  onSaveNew: () => void;
  onDismiss: () => void;
}

export default function SaveDealPrompt({
  dealName,
  company,
  onSaveNew,
  onDismiss,
}: SaveDealPromptProps) {
  const [existingDeals, setExistingDeals] = useState<DealListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listDeals()
      .then((data) => setExistingDeals(data.deals))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Analysis Complete</h3>
          <p className="text-sm text-gray-500">Save this as a deal to track it over time</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={onSaveNew}
          className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Save as New Deal
          {(dealName || company) && (
            <span className="text-gray-400 ml-1">
              ({dealName || company})
            </span>
          )}
        </button>
        <button
          onClick={onDismiss}
          className="border border-gray-300 text-gray-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Skip
        </button>
      </div>

      {!loading && existingDeals.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
            Or this is a follow-up to an existing deal:
          </p>
          <div className="flex flex-wrap gap-2">
            {existingDeals.slice(0, 8).map((deal) => (
              <button
                key={deal.id}
                onClick={onSaveNew}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                {deal.deal_name || deal.company || "Untitled"}
                {deal.call_score != null && (
                  <span className="text-xs text-gray-400 ml-1">({deal.call_score})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
