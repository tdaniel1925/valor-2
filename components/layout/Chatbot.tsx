"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Chatbot({ darkMode }: { darkMode: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your Valor Insurance assistant. I can help you with questions about this platform, insurance products, and how to use our tools. How can I assist you today?",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: inputMessage };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const responses = [
        "The Valor platform helps insurance agents manage their cases, get quotes, and track commissions. You can access quotes from the Quotes menu, manage cases in the Cases section, and view your earnings in the Commissions dashboard.",
        "To get a life insurance quote, navigate to Quotes > Life Insurance, fill out the client information form, and you'll receive multiple carrier options with competitive rates.",
        "For term life insurance quotes, go to Quotes > Term Life, enter the client's details including age, coverage amount, and term length. The system will return quotes from top-rated carriers.",
        "Annuity quotes are available under Quotes > Annuity. Enter the premium amount, term, and state to compare rates from multiple carriers.",
        "Your commissions can be tracked in the Commissions section. You can view pending, paid, and forecasted earnings, as well as download reports.",
        "Need help with a specific feature? Let me know what you're trying to do and I'll guide you through the process.",
      ];

      const randomResponse =
        responses[Math.floor(Math.random() * responses.length)];
      const assistantMessage: Message = {
        role: "assistant",
        content: randomResponse,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div
          className={cn(
            "fixed bottom-20 sm:bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 max-w-md h-[70vh] sm:h-[500px] rounded-lg shadow-2xl flex flex-col z-50",
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
          )}
        >
          {/* Header */}
          <div className={cn(
            "flex items-center justify-between p-4 border-b rounded-t-lg",
            darkMode ? "bg-gray-700 border-gray-600" : "bg-blue-600 border-blue-700"
          )}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold">Valor Assistant</h3>
                <p className="text-xs text-white/80">Always here to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    darkMode ? "bg-blue-900/30" : "bg-blue-100"
                  )}>
                    <svg className={cn("w-4 h-4", darkMode ? "text-blue-400" : "text-blue-600")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[75%] rounded-lg px-4 py-2",
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : darkMode
                      ? "bg-gray-700 text-gray-100"
                      : "bg-gray-100 text-gray-900"
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  darkMode ? "bg-blue-900/30" : "bg-blue-100"
                )}>
                  <svg className={cn("w-4 h-4", darkMode ? "text-blue-400" : "text-blue-600")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className={cn(
                  "rounded-lg px-4 py-2",
                  darkMode ? "bg-gray-700" : "bg-gray-100"
                )}>
                  <div className="flex gap-1">
                    <div className={cn("w-2 h-2 rounded-full animate-bounce", darkMode ? "bg-gray-400" : "bg-gray-500")} style={{ animationDelay: "0ms" }} />
                    <div className={cn("w-2 h-2 rounded-full animate-bounce", darkMode ? "bg-gray-400" : "bg-gray-500")} style={{ animationDelay: "150ms" }} />
                    <div className={cn("w-2 h-2 rounded-full animate-bounce", darkMode ? "bg-gray-400" : "bg-gray-500")} style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className={cn(
            "border-t p-4",
            darkMode ? "border-gray-700" : "border-gray-200"
          )}>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your question..."
                className={cn(
                  "flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500",
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                )}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110",
          darkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-600 hover:bg-blue-700"
        )}
        aria-label="Toggle chatbot"
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>
    </>
  );
}
