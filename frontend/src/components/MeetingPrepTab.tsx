"use client";

import CachedAnalysis from "./CachedAnalysis";

export default function MeetingPrepTab({ dealId }: { dealId: string }) {
  return (
    <CachedAnalysis
      dealId={dealId}
      type="meeting_prep"
      title="Meeting Prep"
      icon="📋"
      generateLabel="Prep for Next Meeting"
      gradientFrom="from-blue-950"
      gradientTo="to-indigo-900"
    />
  );
}
