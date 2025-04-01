"use client";
import { useState, useEffect } from "react";
import { useChat } from "@/context/ChatContext";
import ThemeToggle from "./ThemeToggle";

interface SidebarProps {
  onNewChat: () => void;
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

export default function Sidebar({
  onNewChat,
  selectedChatId,
  onSelectChat,
}: SidebarProps) {
  const { messages, isBackendAvailable, error, errorType, clearError } =
    useChat();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Animation on mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Group messages by date for the sidebar
  const chatGroups = messages.reduce<Record<string, typeof messages>>(
    (acc, message) => {
      if (message.is_bot) return acc; // Only group by user messages

      const date = new Date(message.timestamp).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(message);
      return acc;
    },
    {}
  );

  // State for online status (client-side only)
  const [isOnline, setIsOnline] = useState(true);

  // Update online status on client side only
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Function to get status text and color
  const getConnectionStatus = () => {
    if (!isOnline) {
      return {
        color: "bg-red-500",
        text: "Offline",
        textColor: "text-red-500 dark:text-red-400",
      };
    } else if (!isBackendAvailable) {
      return {
        color: "bg-amber-500",
        text: "Online - Backend Unavailable",
        textColor: "text-amber-500 dark:text-amber-400",
      };
    } else {
      return {
        color: "bg-green-500",
        text: "Connected",
        textColor: "text-green-500 dark:text-green-400",
      };
    }
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div
      className={`
      w-72 bg-sidebar-bg text-foreground flex flex-col h-full border-r border-border-color
      shadow-md md:shadow-none transition-all duration-300
      ${mounted ? "translate-x-0" : "-translate-x-72"}
    `}
    >
      <div className="p-5 border-b border-border-color">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full primary-gradient flex items-center justify-center shadow-md mr-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
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
          <h1 className="text-xl font-bold">Medical Assistant</h1>
        </div>
      </div>

      <div className="p-4">
        <button
          className="w-full primary-gradient text-white rounded-lg p-3 flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
          onClick={onNewChat}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          New Conversation
        </button>
      </div>

      {/* Connection status banner */}
      <div className="px-4" suppressHydrationWarning>
        {typeof window !== "undefined" &&
          (!isOnline || !isBackendAvailable) && (
            <div
              className={`
            mb-3 text-xs px-3 py-2 rounded-lg
            ${
              !isOnline
                ? "bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                : "bg-amber-100 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
            }
            animate-fade-in flex items-center
          `}
            >
              <div
                className={`w-2 h-2 rounded-full mr-2 ${connectionStatus.color}`}
              ></div>
              <span className={connectionStatus.textColor}>
                {!isOnline
                  ? "Offline - Messages saved locally"
                  : "Backend unavailable - Using local storage"}
              </span>
            </div>
          )}
      </div>

      <div className="flex-1 overflow-y-auto px-3">
        <div className="sticky top-0 bg-sidebar-bg py-2 z-10">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Recent Conversations
          </h2>
        </div>

        <div className="mt-2 space-y-4">
          {Object.entries(chatGroups).length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm italic">
              No conversations yet
            </div>
          ) : (
            Object.entries(chatGroups).map(([date, msgs]) => (
              <div key={date} className="animate-fade-in">
                <h3 className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {date}
                </h3>
                <div className="space-y-1.5">
                  {msgs.map((msg) => (
                    <button
                      key={msg.id}
                      className={`
                        w-full text-left p-2.5 rounded-lg mb-1 text-sm transition-all duration-200
                        flex items-center hover:shadow-sm truncate
                        ${
                          selectedChatId === String(msg.id)
                            ? "bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-400 border-l-2 border-primary-500"
                            : "hover:bg-sidebar-hover border-l-2 border-transparent"
                        }
                      `}
                      onClick={() => onSelectChat(String(msg.id))}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2 flex-shrink-0 text-gray-400"
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
                      <span className="truncate">
                        {msg.content.substring(0, 30)}
                        {msg.content.length > 30 ? "..." : ""}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-4 border-t border-border-color bg-sidebar-bg">
        {/* Settings section */}
        <div className="flex flex-col space-y-2">
          {/* Settings dropdown toggle */}
          <button
            className="w-full text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-500 p-2.5 rounded-lg hover:bg-sidebar-hover text-sm flex items-center justify-between transition-colors"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          >
            <span className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>Settings</span>
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 transition-transform duration-200 ${
                isSettingsOpen ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Settings content - expanded when isSettingsOpen is true */}
          {isSettingsOpen && (
            <div className="pl-10 pr-3 pb-2 pt-1 animate-fade-in">
              <div className="mb-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Appearance
                </p>
                <ThemeToggle />
              </div>
            </div>
          )}

          {/* Sign out button */}
          <button className="w-full text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-500 p-2.5 rounded-lg hover:bg-sidebar-hover text-sm flex items-center transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>

        {/* Version indicator with custom error badge overlay */}
        <div className="mt-4 pt-4 border-t border-border-color relative">
          {/* Custom badge overlay - covers the system badge */}
          {error && (
            <div
              className="absolute -bottom-12 -left-1 z-50 flex items-center status-badge offline animate-fade-in cursor-pointer"
              onClick={clearError}
              title="Click to dismiss"
            >
              <div className="h-5 w-5 bg-red-500 text-white flex items-center justify-center rounded-full mr-1 text-xs font-bold">
                !
              </div>
              <span className="text-xs">
                {errorType === "connection" ? "Connection Error" : "API Error"}
                <span className="ml-1 opacity-70">✕</span>
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center text-gray-500">
              <div className="w-2 h-2 rounded-full bg-teal-500 mr-2 animate-pulse"></div>
              <span>Medical Assistant v1.0</span>
            </div>

            {/* Improved connection status indicator */}
            <div className="flex items-center text-xs" suppressHydrationWarning>
              {typeof window !== "undefined" && (
                <>
                  <div
                    className={`w-2 h-2 rounded-full mr-1 ${connectionStatus.color}`}
                  ></div>
                  <span className={connectionStatus.textColor}>
                    {connectionStatus.text}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
