"use client";
import { useState, useEffect, useCallback, useMemo, memo } from "react";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import { useChat } from "@/context/ChatContext";

// Memoized menu button component to prevent re-renders
const MenuButton = memo(({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
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
));

// Memoized logo component
const Logo = memo(() => (
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
));

// Memoized new chat button
const NewChatButton = memo(({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
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
));

// Main component with performance optimizations
function ChatLayout() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { messages, clearAllMessages } = useChat();

  // Handle initial animation once on mount
  useEffect(() => {
    setMounted(true);

    // Handle initial media query for mobile devices
    if (window.matchMedia("(max-width: 768px)").matches) {
      setSidebarOpen(false);
    }

    return () => {
      // Cleanup on unmount if needed
    };
  }, []);

  // Optimized event handlers with useCallback
  const handleNewChat = useCallback(() => {
    // Reset the selected chat and clear messages without page reload
    setSelectedChatId(null);
    clearAllMessages();
  }, [clearAllMessages]);

  const handleSelectChat = useCallback((chatId: string) => {
    setSelectedChatId(chatId);
    // In a real app, you would load the selected chat here

    // On mobile, close sidebar after selection
    if (window.matchMedia("(max-width: 768px)").matches) {
      setSidebarOpen(false);
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prevState) => !prevState);
  }, []);

  // Memoized message count to prevent unnecessary calculations
  const messageCount = useMemo(() => {
    return messages.length > 0
      ? `${messages.length} messages`
      : "New conversation";
  }, [messages.length]);

  // Memoized classes for sidebar to prevent string concatenation on every render
  const sidebarClasses = useMemo(
    () => `
    fixed md:relative z-30 h-full transition-all duration-300 ease-in-out
    ${
      sidebarOpen
        ? "translate-x-0"
        : "-translate-x-full md:translate-x-0 md:w-0"
    }
  `,
    [sidebarOpen]
  );

  // Memoized container classes
  const containerClasses = useMemo(
    () => `
    flex h-screen bg-background text-foreground
    transition-opacity duration-300 ease-in-out
    ${mounted ? "opacity-100" : "opacity-0"}
  `,
    [mounted]
  );

  return (
    <div className={containerClasses}>
      {/* Sidebar - with responsive behavior */}
      <div className={sidebarClasses}>
        <Sidebar
          onNewChat={handleNewChat}
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
        />
      </div>

      {/* Overlay for mobile - only render when needed */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Header */}
        <header className="bg-card-bg border-b border-border-color shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center">
            {/* Menu button for mobile */}
            <MenuButton onClick={toggleSidebar} />
            <Logo />
          </div>

          <div className="flex items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">
              {messageCount}
            </span>
            <NewChatButton onClick={handleNewChat} />
          </div>
        </header>

        {/* Messages and Input */}
        <ChatWindow />
      </div>
    </div>
  );
}

// Export memoized component for better performance
export default memo(ChatLayout);
