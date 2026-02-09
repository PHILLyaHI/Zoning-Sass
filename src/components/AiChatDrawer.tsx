"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PropertyRecord, ValidationResult } from "../lib/types";
import { chat, getSuggestedQuestions, ChatMessage } from "../lib/aiService";

type AiChatDrawerProps = {
  property: PropertyRecord;
  validationResult?: ValidationResult;
  isOpen: boolean;
  onClose: () => void;
};

// Markdown-like rendering
function renderContent(content: string) {
  // Handle bullet points
  if (content.startsWith("•") || content.startsWith("-")) {
    return <span className="flex gap-2"><span className="text-blue-400">•</span>{content.slice(1).trim()}</span>;
  }
  
  // Handle bold
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function AiChatDrawer({ property, validationResult, isOpen, onClose }: AiChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (property) {
      setSuggestedQuestions(getSuggestedQuestions(property));
    }
  }, [property]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

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
      const response = await chat(property, text, messages);
      setMessages(prev => [...prev, response]);
      if (response.suggestedQuestions?.length) {
        setSuggestedQuestions(response.suggestedQuestions);
      }
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
    setSuggestedQuestions(getSuggestedQuestions(property));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Glassmorphism Container */}
        <div className="flex-1 flex flex-col m-0 sm:m-4 bg-white/95 backdrop-blur-2xl sm:rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
          {/* Header with gradient */}
          <div className="relative px-6 py-5 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white">
            {/* Animated background effect */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-pink-500/30 to-transparent rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
            </div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <span className="text-2xl">✨</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold">AI Assistant</h2>
                  <p className="text-sm text-white/70">Powered by GPT-4</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                    title="Clear chat"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Property context pill */}
            <div className="relative mt-4 px-4 py-2.5 bg-white/10 rounded-xl backdrop-blur">
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="text-white/90 truncate">{property.address}</span>
                {property.zoningDistrict?.code && (
                  <span className="px-2 py-0.5 bg-white/20 text-white text-xs rounded-lg shrink-0">
                    {property.zoningDistrict.code}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* AI Disclaimer */}
          <div className="px-6 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
            <p className="text-xs text-amber-700 flex items-center gap-2">
              <span className="text-amber-500">ℹ️</span>
              AI explains rules from official sources — not legal advice
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col">
                {/* Welcome */}
                <div className="text-center mb-8">
                  <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-violet-100 via-purple-100 to-pink-100 flex items-center justify-center animate-in zoom-in duration-500">
                    <span className="text-4xl">💬</span>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">How can I help?</h3>
                  <p className="text-sm text-slate-500 max-w-xs mx-auto">
                    I can explain zoning rules, ADU requirements, setbacks, and more for your property.
                  </p>
                </div>
                
                {/* Feature Cards */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { icon: "🏠", label: "ADU Rules", query: "Can I build an ADU on this property?" },
                    { icon: "📏", label: "Setbacks", query: "What are the setback requirements?" },
                    { icon: "🚽", label: "Septic", query: "What are my septic options?" },
                    { icon: "📋", label: "Permits", query: "What permits do I need?" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => sendMessage(item.query)}
                      className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 hover:from-violet-50 hover:to-purple-50 border border-slate-200 hover:border-violet-200 transition-all group"
                    >
                      <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">{item.icon}</span>
                      <span className="text-sm font-medium text-slate-700 group-hover:text-violet-700">{item.label}</span>
                    </button>
                  ))}
                </div>
                
                {/* Suggested Questions */}
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Suggested Questions</p>
                  <div className="space-y-2">
                    {suggestedQuestions.slice(0, 4).map((q, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(q)}
                        className="w-full text-left px-4 py-3 bg-white hover:bg-violet-50 rounded-xl text-sm text-slate-700 hover:text-violet-700 transition-all border border-slate-200 hover:border-violet-200 flex items-center gap-3 group animate-in fade-in slide-in-from-bottom duration-300"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        <span className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-violet-100 flex items-center justify-center transition-colors">
                          <svg className="w-4 h-4 text-slate-400 group-hover:text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                        <span className="flex-1">{q}</span>
                        <svg className="w-4 h-4 text-slate-300 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom duration-300`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mr-3 shrink-0 shadow-lg shadow-violet-500/25">
                        <span className="text-white text-sm">✨</span>
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-lg"
                          : "bg-white border border-slate-200 text-slate-700 shadow-sm"
                      }`}
                    >
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content.split("\n").map((line, i) => (
                          <p key={i} className={`${line.startsWith("•") || line.startsWith("-") ? "ml-0 my-1" : "my-1"}`}>
                            {renderContent(line)}
                          </p>
                        ))}
                      </div>
                      
                      {/* Citations */}
                      {message.citations && message.citations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Sources
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {message.citations.map((citation, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-200"
                              >
                                {citation.section ? `§${citation.section}` : citation.source}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Follow-up suggestions */}
                {messages.length > 0 && !isLoading && (
                  <div className="pt-4">
                    <p className="text-xs text-slate-400 mb-2">Continue the conversation</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedQuestions.slice(0, 3).map((q, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(q)}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs text-slate-600 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 transition-all"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start animate-in fade-in duration-200 mt-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                    <span className="text-white text-sm">✨</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-sm text-slate-500">Analyzing your property...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-slate-100">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about zoning, setbacks, permits..."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all pr-12"
                  disabled={isLoading}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                  ↵
                </div>
              </div>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-5 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white rounded-2xl transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 disabled:shadow-none hover:scale-105 active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
            <p className="text-xs text-slate-400 text-center mt-3">
              Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">Enter</kbd> to send · <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">Esc</kbd> to close
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
