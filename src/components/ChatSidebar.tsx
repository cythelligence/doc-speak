"use client";

import React from "react";

interface ChatSidebarProps {
  vendors: string[];
  selectedVendors: string[];
  onVendorChange: (vendors: string[]) => void;
  onCreateSession: () => void;
  sessions: Array<{ id: string; title: string; createdAt: string }>;
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
}

export default function ChatSidebar({
  vendors,
  selectedVendors,
  onVendorChange,
  onCreateSession,
  sessions,
  currentSessionId,
  onSelectSession,
}: ChatSidebarProps) {
  const handleVendorToggle = (vendor: string) => {
    if (selectedVendors.includes(vendor)) {
      onVendorChange(selectedVendors.filter((v) => v !== vendor));
    } else {
      onVendorChange([...selectedVendors, vendor]);
    }
  };

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col overflow-hidden border-r border-slate-700">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-cyan-500">Doc-Speak</h1>
        <p className="text-sm text-slate-400 mt-1">Local RAG Assistant</p>
      </div>

      {/* Vendors Section */}
      <div className="flex-1 overflow-y-auto p-6">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
          Documentation Sources
        </h2>

        {vendors.length === 0 ? (
          <p className="text-sm text-slate-500">No vendors available</p>
        ) : (
          <div className="space-y-2">
            {vendors.map((vendor) => (
              <label key={vendor} className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedVendors.includes(vendor)}
                  onChange={() => handleVendorToggle(vendor)}
                  className="w-4 h-4 rounded border-slate-500 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="ml-3 text-sm text-slate-300 group-hover:text-cyan-400 transition">
                  {vendor}
                </span>
              </label>
            ))}
          </div>
        )}

        {/* Create Session Button */}
        <button
          onClick={onCreateSession}
          disabled={selectedVendors.length === 0}
          className="mt-6 w-full py-2 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium transition"
        >
          New Chat
        </button>
      </div>

      {/* Sessions List */}
      <div className="border-t border-slate-700 p-6 max-h-48 overflow-y-auto">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
          Recent Chats
        </h3>
        <div className="space-y-2">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`w-full text-left p-2 rounded transition textsm truncate ${
                currentSessionId === session.id
                  ? "bg-cyan-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
              title={session.title}
            >
              {session.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
