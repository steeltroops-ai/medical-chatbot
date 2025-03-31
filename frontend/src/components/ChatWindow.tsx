"use client";
import { useEffect, useRef } from "react";
import { useChat } from "@/context/ChatContext";
import ChatInput from "./ChatInput";
import Message from "./Message";

export default function ChatWindow() {
  const { messages, error, clearError, loading } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col relative">
      {/* Main chat area with message list */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-background-secondary">
        {/* Error toast notification */}
        {error && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in animate-slide-up">
            <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-6 py-3 rounded-lg shadow-md max-w-md flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="max-w-5xl mx-auto w-full">
          {messages.length === 0 ? (
            <div className="h-full min-h-[60vh] flex flex-col items-center justify-center text-center p-8 animate-fade-in">
              <div className="w-20 h-20 primary-gradient rounded-2xl flex items-center justify-center mb-6 shadow-lg transform transition-transform hover:scale-105">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-primary-700 dark:text-primary-400">
                Welcome to Your Medical Assistant
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-lg mb-8 text-lg">
                Ask any medical questions and get reliable information. Your
                conversations are private and secure.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl w-full">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full teal-gradient flex items-center justify-center text-white mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 3a1 1 0 012 0v5.5a.5.5 0 001 0V4a1 1 0 112 0v4.5a.5.5 0 001 0V6a1 1 0 112 0v5a7 7 0 11-14 0V9a1 1 0 012 0v2.5a.5.5 0 001 0V4a1 1 0 012 0v4.5a.5.5 0 001 0V3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <h4 className="text-primary-700 dark:text-primary-400 font-semibold">
                      Health Advice
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ask about symptoms, conditions, medications, or general
                    health concerns.
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full teal-gradient flex items-center justify-center text-white mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <h4 className="text-primary-700 dark:text-primary-400 font-semibold">
                      Medical Information
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Learn about treatments, procedures, preventative care, and
                    healthy living.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {messages.map((message, index) => (
                <Message
                  key={message.id}
                  message={message}
                  isLastMessage={index === messages.length - 1}
                />
              ))}
              {/* This div helps us scroll to the bottom */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Loading indicator overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-10 dark:bg-opacity-20 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg">
            <svg
              className="animate-spin h-6 w-6 text-primary-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        </div>
      )}

      {/* Input */}
      <ChatInput />
    </div>
  );
}
