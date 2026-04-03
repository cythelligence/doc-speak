"use client";

import React, { useState, useEffect, useRef } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface ChatViewProps {
  sessionId: string | null;
  vendors: string[];
}

export default function ChatView({ sessionId, vendors }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionId) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}/messages`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || !sessionId || vendors.length === 0) return;

    const userMessage = {
      id: `temp-${Date.now()}`,
      role: "user" as const,
      content: input,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`/api/chat/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          vendorIds: vendors,
        }),
      });

      const result = await response.json();

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? result.userMessage : msg
        )
      );

      if (result.assistantMessage) {
        setMessages((prev) => [...prev, result.assistantMessage]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // Remove the temporary user message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  if (!sessionId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Welcome to Doc-Speak
          </h2>
          <p className="text-slate-600">
            Select documentation sources and create a new chat to begin
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500">Start a new conversation</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-2xl rounded-lg p-4 ${
                  msg.role === "user"
                    ? "bg-cyan-500 text-white"
                    : "bg-white text-slate-900 border border-slate-200"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
                <p className={`text-xs mt-2 ${
                  msg.role === "user" ? "text-cyan-100" : "text-slate-500"
                }`}>
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-slate-900 border border-slate-200 rounded-lg p-4">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 bg-white p-6">
        <form onSubmit={handleSendMessage} className="flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask a question about the documentation..."
            className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-slate-100"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium transition"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
