"use client";

import { useState, useEffect, useRef } from "react";
import { TEAM_MEMBERS, TeamMember, getCurrentUser, setCurrentUser } from "@/lib/team";

export default function TeamSelector() {
  const [current, setCurrent] = useState<TeamMember | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrent(user);
    } else {
      // First visit — prompt to pick
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(member: TeamMember) {
    setCurrentUser(member.id);
    setCurrent(member);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/10 transition-colors"
      >
        {current ? (
          <>
            <div className={`w-6 h-6 ${current.color} rounded-full flex items-center justify-center text-white text-[10px] font-bold`}>
              {current.initials}
            </div>
            <span className="text-sm text-current opacity-70 hidden sm:block">{current.name.split(" ")[0]}</span>
          </>
        ) : (
          <>
            <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-white/40 text-[10px]">?</div>
          </>
        )}
        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border rounded-xl shadow-lg py-1 w-52 z-50">
          <p className="px-3 py-2 text-xs text-gray-400 uppercase tracking-wider font-semibold">Team</p>
          {TEAM_MEMBERS.map((member) => (
            <button
              key={member.id}
              onClick={() => handleSelect(member)}
              className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                current?.id === member.id ? "bg-gray-50" : ""
              }`}
            >
              <div className={`w-8 h-8 ${member.color} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                {member.initials}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">{member.name}</p>
              </div>
              {current?.id === member.id && (
                <svg className="w-4 h-4 text-green-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
