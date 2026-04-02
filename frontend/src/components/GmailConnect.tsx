"use client";

import { useState, useEffect } from "react";

interface GmailStatus {
  connected: boolean;
  email?: string;
  messagesTotal?: number;
}

export default function GmailConnect() {
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gmail/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ connected: false }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  if (status?.connected) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
        <span>{status.email}</span>
      </div>
    );
  }

  return (
    <a
      href="/api/gmail/auth"
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 text-xs hover:bg-gray-100 transition-colors"
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
        <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor"/>
      </svg>
      Connect Gmail
    </a>
  );
}
