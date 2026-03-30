"use client";

import { useState, useEffect } from "react";
import { Deal, listDeals } from "@/lib/api";

interface DealSelectorProps {
  onSelect: (dealId: string) => void;
  onCreateNew: (dealName: string, company: string) => void;
  selectedDealId?: string;
}

export default function DealSelector({ onSelect, onCreateNew, selectedDealId }: DealSelectorProps) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"select" | "create">(selectedDealId ? "select" : "create");
  const [search, setSearch] = useState("");
  const [newDealName, setNewDealName] = useState("");
  const [newCompany, setNewCompany] = useState("");

  useEffect(() => {
    listDeals()
      .then((data) => {
        setDeals(data);
        if (data.length === 0) setMode("create");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? deals.filter(
        (d) =>
          d.deal_name.toLowerCase().includes(search.toLowerCase()) ||
          d.company.toLowerCase().includes(search.toLowerCase())
      )
    : deals;

  function handleCreateNew() {
    if (!newDealName.trim()) return;
    onCreateNew(newDealName.trim(), newCompany.trim());
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      {/* Mode Toggle */}
      <div className="flex border-b">
        <button
          onClick={() => setMode("select")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            mode === "select" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Existing Deal ({deals.length})
        </button>
        <button
          onClick={() => setMode("create")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            mode === "create" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          + New Deal
        </button>
      </div>

      <div className="p-4">
        {mode === "create" ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Deal Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp Enterprise"
                  value={newDealName}
                  onChange={(e) => setNewDealName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Company</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>
            <button
              onClick={handleCreateNew}
              disabled={!newDealName.trim()}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Create Deal &amp; Continue
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search deals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1">
              {loading ? (
                <p className="text-sm text-gray-400 text-center py-4">Loading deals...</p>
              ) : filtered.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-400">
                    {deals.length === 0 ? "No deals yet" : "No matching deals"}
                  </p>
                  <button
                    onClick={() => setMode("create")}
                    className="text-sm text-gray-900 font-medium hover:underline mt-1"
                  >
                    Create a new deal
                  </button>
                </div>
              ) : (
                filtered.map((deal) => (
                  <button
                    key={deal.id}
                    onClick={() => onSelect(deal.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      selectedDealId === deal.id
                        ? "bg-gray-900 text-white"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className={`font-medium truncate ${selectedDealId === deal.id ? "text-white" : "text-gray-900"}`}>
                          {deal.deal_name}
                        </p>
                        <p className={`text-xs truncate ${selectedDealId === deal.id ? "text-gray-300" : "text-gray-500"}`}>
                          {deal.company} · {deal.call_count} call{deal.call_count !== 1 ? "s" : ""}
                        </p>
                      </div>
                      {deal.latest_risk_assessment && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          selectedDealId === deal.id
                            ? "bg-white/20 text-white"
                            : deal.latest_risk_assessment === "High" ? "bg-red-50 text-red-600"
                            : deal.latest_risk_assessment === "Medium" ? "bg-yellow-50 text-yellow-600"
                            : "bg-green-50 text-green-600"
                        }`}>
                          {deal.latest_risk_assessment}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
