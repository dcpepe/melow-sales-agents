"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import FrankAvatar from "./FrankAvatar";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const FRANK_PROMPTS = [
  "How's my pipeline looking, Frank?",
  "What am I doing wrong?",
  "Coach me on my weakest deal",
  "What should I focus on this week?",
  "Role-play a budget conversation with me",
  "Give me your honest take on our team",
];

export default function FrankChat({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/coaching/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages([...newMessages, { role: "assistant", content: data.message }]);
    } catch (e) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: `Error: ${e instanceof Error ? e.message : "Failed"}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white border-l shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center gap-3">
          <FrankAvatar size="sm" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Frank Golden</p>
            <p className="text-xs text-gray-500">Your Sales Coach &middot; NYC</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMessages([])}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-white/50"
            title="New conversation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-white/50"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="mt-4">
            <div className="text-center mb-6">
              <FrankAvatar size="lg" />
              <p className="mt-3 text-sm font-medium text-gray-900">Hey, it&apos;s Frank.</p>
              <p className="text-sm text-gray-500 mt-1">What do you want to work on today?</p>
            </div>
            <div className="space-y-2">
              {FRANK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  className="w-full text-left px-3 py-2.5 rounded-lg border text-sm text-gray-600 hover:bg-amber-50 hover:border-amber-300 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "flex justify-end" : "flex gap-2"}>
            {msg.role === "assistant" && (
              <div className="flex-shrink-0 mt-1">
                <FrankAvatar size="sm" />
              </div>
            )}
            {msg.role === "assistant" ? (
              <div className="prose prose-sm prose-gray max-w-none text-gray-800 [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_li]:pl-1 [&_h1]:text-base [&_h1]:font-semibold [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_hr]:my-3 [&_hr]:border-gray-200 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_blockquote]:border-l-2 [&_blockquote]:border-amber-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-600">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            ) : (
              <div className="bg-gray-900 text-white rounded-2xl px-4 py-2 text-sm max-w-[85%]">
                {msg.content}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <div className="flex-shrink-0 mt-1"><FrankAvatar size="sm" /></div>
            <div className="flex gap-1.5 py-2">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t px-4 py-3">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Frank anything..."
            rows={1}
            className="w-full resize-none border rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-gray-400 max-h-24"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="absolute right-2 bottom-2 text-gray-400 hover:text-amber-600 disabled:opacity-30 disabled:cursor-not-allowed p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
