"use client";

import { useState } from "react";
import { Deal, updateDeal } from "@/lib/api";

const STAGES = ["Discovery", "Qualification", "Demo", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];

export default function DealHeader({
  deal,
  onUpdate,
}: {
  deal: Deal;
  onUpdate: (updated: Deal) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(deal.deal_name);
  const [company, setCompany] = useState(deal.company);
  const [stage, setStage] = useState(deal.stage || "");
  const [notes, setNotes] = useState(deal.notes || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateDeal(deal.id, {
        deal_name: name,
        company,
        stage: stage || undefined,
        notes: notes || undefined,
      });
      onUpdate(updated);
      setEditing(false);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{deal.deal_name}</h1>
            <button
              onClick={() => setEditing(true)}
              className="text-gray-300 hover:text-gray-600 flex-shrink-0"
              title="Edit deal"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-500">{deal.company}</p>
            <span className="text-gray-300">·</span>
            <p className="text-sm text-gray-500">{deal.call_count} call{deal.call_count !== 1 ? "s" : ""}</p>
            {deal.stage && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{deal.stage}</span>
              </>
            )}
          </div>
          {deal.notes && (
            <p className="text-sm text-gray-400 mt-1 truncate max-w-xl">{deal.notes}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-xl border p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Deal Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Company</label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1 block">Stage</label>
        <div className="flex flex-wrap gap-1.5">
          {STAGES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStage(stage === s ? "" : s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                stage === s
                  ? "bg-gray-900 text-white"
                  : "bg-white border text-gray-600 hover:border-gray-400"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1 block">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Deal context, key info, anything to remember..."
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={() => {
            setName(deal.deal_name);
            setCompany(deal.company);
            setStage(deal.stage || "");
            setNotes(deal.notes || "");
            setEditing(false);
          }}
          className="border text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
