"use client";

import { useState, useRef, useEffect } from "react";
import { useProperties } from "../../../contexts/PropertyContext";
import { chat, ChatMessage } from "../../../lib/aiService";
import { PropertyRecord } from "../../../lib/types";
import Card from "../../../components/Card";

// Simple markdown-like rendering
function renderContent(content: string) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

// General questions that don't require a property
const GENERAL_QUESTIONS = [
  "What is an ADU?",
  "How do zoning setbacks work?",
  "What's the difference between septic and sewer?",
  "What permits are typically needed for new construction?",
  "How do wetlands affect development?",
  "What is lot coverage and FAR?",
];

// Create a mock property for general questions
const generalProperty: PropertyRecord = {
  id: "general",
  userId: "system",
  address: "General Questions",
  city: "",
  state: "",
  zipCode: "",
  centroid: { lat: 0, lng: 0 },
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default function AssistantPage() {
  const { properties, currentProperty } = useProperties();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("general");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeProperty = selectedPropertyId === "general" 
    ? generalProperty 
    : properties.find(p => p.id === selectedPropertyId) || generalProperty;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chat(activeProperty, text, messages);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        content: "Sorry, I couldn't process that request. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-semibold text-slate-900">AI Assistant</h1>
        <p className="text-slate-500 mt-2">Ask questions about zoning, permits, and land use</p>
      </div>

      {/* Property selector */}
      <Card className="mb-6" padding="sm">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-slate-700">Context:</label>
          <select
            value={selectedPropertyId}
            onChange={(e) => {
              setSelectedPropertyId(e.target.value);
              clearChat();
            }}
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="general">General Questions (no property)</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.address}
              </option>
            ))}
          </select>
        </div>
        {selectedPropertyId !== "general" && activeProperty.zoningDistrict && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-lg">
              {activeProperty.zoningDistrict.code}
            </span>
            <span>{activeProperty.areaSqft?.toLocaleString()} sq ft</span>
          </div>
        )}
      </Card>

      {/* Chat area */}
      <Card className="mb-6" padding="none">
        <div className="h-[500px] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center">
                  <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {selectedPropertyId === "general" 
                    ? "Ask general questions" 
                    : `Ask about ${activeProperty.address}`}
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                  {selectedPropertyId === "general"
                    ? "I can explain zoning concepts, permit processes, and land use regulations."
                    : "I'll provide answers specific to this property with citations."}
                </p>
                
                {/* Suggested questions */}
                <div className="grid gap-2 max-w-md mx-auto">
                  {GENERAL_QUESTIONS.slice(0, 4).map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      className="text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm text-slate-700 transition-all hover:translate-x-1"
                    >
                      "{q}"
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
                        : "bg-slate-100 text-slate-900"
                    }`}
                  >
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content.split("\n").map((line, i) => (
                        <p key={i} className={line.startsWith("•") ? "pl-0 my-0.5" : "my-1"}>
                          {renderContent(line)}
                        </p>
                      ))}
                    </div>
                    
                    {message.citations && message.citations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200/50">
                        <p className="text-xs text-slate-500 mb-1">Sources:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {message.citations.map((citation, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-white/80 rounded text-xs text-slate-600 border border-slate-200"
                            >
                              {citation.section ? `§${citation.section}` : citation.source}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-sm text-slate-500">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-200">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about zoning, permits, setbacks..."
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl transition-all"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </Card>

      {/* Disclaimer */}
      <div className="text-center">
        <p className="text-xs text-slate-400">
          AI explains rules from our database. All compliance decisions are based on deterministic rules, not AI guesses.
        </p>
      </div>
    </div>
  );
}
