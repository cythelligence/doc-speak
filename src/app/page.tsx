"use client";

import { useState, useEffect, useRef } from "react";
import ChatSidebar from "@/components/ChatSidebar";
import ChatView from "@/components/ChatView";

export default function Home() {
  const [vendors, setVendors] = useState<string[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [sessions, setSessions] = useState<Array<{ id: string; title: string; createdAt: string }>>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch available vendors
    fetchVendors();
    fetchSessions();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await fetch("/api/vendors");
      const data = await response.json();
      setVendors(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
      setIsLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/sessions");
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    }
  };

  const handleCreateSession = async () => {
    if (selectedVendors.length === 0) {
      alert("Please select at least one vendor");
      return;
    }

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Session ${new Date().toLocaleString()}`,
          vendorIds: selectedVendors,
        }),
      });

      const session = await response.json();
      setCurrentSessionId(session.id);
      setSessions([...sessions, session]);
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Doc-Speak...</h1>
          <div className="animate-spin">⟳</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      <ChatSidebar
        vendors={vendors}
        selectedVendors={selectedVendors}
        onVendorChange={setSelectedVendors}
        onCreateSession={handleCreateSession}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
      />
      <ChatView sessionId={currentSessionId} vendors={selectedVendors} />
    </div>
  );
}
