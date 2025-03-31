"use client";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import { useChat } from "@/context/ChatContext";

export default function ChatLayout() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { messages } = useChat();

  // Handle initial animation
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNewChat = () => {
    // Reset the selected chat and reload the page to start fresh
    setSelectedChatId(null);
    window.location.reload();
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    // In a real app, you would load the selected chat here
    // For now, we'll just set the ID

    // On mobile, close sidebar after selection
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div
      className={`
      flex h-screen bg-background text-foreground
      transition-opacity duration-500 ease-in-out
      ${mounted ? "opacity-100" : "opacity-0"}
    `}
    >
      {/* Sidebar - with responsive behavior */}
      <div
        className={`
        fixed md:relative z-30 h-full transition-all duration-300 ease-in-out
        ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0 md:w-0"
        }
      `}
      >
        <Sidebar
          onNewChat={handleNewChat}
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
        />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Header */}
        <header className="bg-card-bg border-b border-border-color shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center">
            {/* Menu button for mobile */}
            <button
              onClick={toggleSidebar}
              className="mr-3 md:hidden text-gray-500 hover:text-primary-600 transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full primary-gradient flex items-center justify-center text-white mr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold">Medical Assistant</h2>
            </div>
          </div>

          <div className="flex items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">
              {messages.length > 0
                ? `${messages.length} messages`
                : "New conversation"}
            </span>
            <button
              onClick={handleNewChat}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="New chat"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-primary-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </header>

        {/* Messages and Input */}
        <ChatWindow />
      </div>
    </div>
  );
}
