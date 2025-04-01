"use client";
import { useEffect, useRef, memo, useState } from "react";
import { useChat } from "@/context/ChatContext";
import ChatInput from "./ChatInput";
import Message from "./Message";

// Memoized Message component for better performance
const MemoizedMessage = memo(Message);

// Memoized Empty State component to prevent unnecessary re-renders
const EmptyState = memo(() => (
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
      Ask any medical questions and get reliable information. Your conversations
      are private and secure.
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
          Ask about symptoms, conditions, medications, or general health
          concerns.
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
          Learn about treatments, procedures, preventative care, and healthy
          living.
        </p>
      </div>
    </div>
  </div>
));

// Improved connection status banner component
const ConnectionBanner = memo(() => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [showBanner, setShowBanner] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);

  // Check backend connectivity
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/health", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(3000), // 3 second timeout
        });
        setBackendAvailable(response.ok);
      } catch (error) {
        setBackendAvailable(false);
      }
    };

    // Only check backend if we're online
    if (isOnline) {
      checkBackend();
      const interval = setInterval(checkBackend, 15000); // Check every 15 seconds
      return () => clearInterval(interval);
    }
  }, [isOnline]);

  // Setup online/offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 5000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Don't render anything if everything is working fine
  if (isOnline && backendAvailable && !showBanner) return null;

  return (
    <div
      className={`
      transition-all duration-300 ease-in-out
      ${showBanner ? "max-h-24 opacity-100" : "max-h-0 opacity-0"}
      ${
        isOnline && backendAvailable
          ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"
          : isOnline
          ? "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800"
          : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800"
      }
      border-b overflow-hidden
    `}
    >
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center">
        <div
          className={`
          rounded-full w-3 h-3 mr-3 flex-shrink-0
          ${
            isOnline && backendAvailable
              ? "bg-green-500"
              : isOnline
              ? "bg-amber-500"
              : "bg-red-500"
          }
        `}
        ></div>

        <div className="flex-1">
          {!isOnline && (
            <p className="text-red-700 dark:text-red-300 text-sm">
              You're offline. Messages will be sent when your connection is
              restored.
            </p>
          )}

          {isOnline && !backendAvailable && (
            <p className="text-amber-700 dark:text-amber-300 text-sm">
              Backend server unavailable. Your messages are saved locally and
              will sync when services resume.
            </p>
          )}

          {isOnline && backendAvailable && showBanner && (
            <p className="text-green-700 dark:text-green-300 text-sm">
              You're back online! All your messages will be synced.
            </p>
          )}
        </div>

        {showBanner && (
          <button
            onClick={() => setShowBanner(false)}
            className={`
              p-1 rounded-full flex-shrink-0
              ${
                isOnline && backendAvailable
                  ? "text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800"
                  : isOnline
                  ? "text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-800"
                  : "text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800"
              }
              transition-colors
            `}
            aria-label="Dismiss"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
});

// Improved toast notification system
const ToastNotification = memo(
  ({
    message,
    type = "error",
    onDismiss,
  }: {
    message: string;
    type?: "success" | "error" | "warning" | "info";
    onDismiss: () => void;
  }) => {
    // Define styles based on type
    const styles = {
      error:
        "bg-red-100 dark:bg-red-900/50 border-red-400 dark:border-red-700 text-red-700 dark:text-red-300",
      success:
        "bg-green-100 dark:bg-green-900/50 border-green-400 dark:border-green-700 text-green-700 dark:text-green-300",
      warning:
        "bg-amber-100 dark:bg-amber-900/50 border-amber-400 dark:border-amber-700 text-amber-700 dark:text-amber-300",
      info: "bg-blue-100 dark:bg-blue-900/50 border-blue-400 dark:border-blue-700 text-blue-700 dark:text-blue-300",
    };

    // Define icons based on type
    const icons = {
      error: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
      success: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
      warning: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
      info: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      ),
    };

    return (
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in animate-slide-up max-w-md w-full px-4">
        <div
          className={`${styles[type]} px-4 py-3 rounded-lg shadow-lg border flex items-center`}
        >
          <div className="flex-shrink-0 mr-3">{icons[type]}</div>
          <div className="flex-1 mr-2">
            <p className="text-sm font-medium">{message}</p>
          </div>
          <button
            onClick={onDismiss}
            className={`flex-shrink-0 rounded-full p-1.5 inline-flex items-center justify-center 
              ${
                type === "error"
                  ? "hover:bg-red-200 dark:hover:bg-red-800"
                  : type === "success"
                  ? "hover:bg-green-200 dark:hover:bg-green-800"
                  : type === "warning"
                  ? "hover:bg-amber-200 dark:hover:bg-amber-800"
                  : "hover:bg-blue-200 dark:hover:bg-blue-800"
              } transition-colors`}
            aria-label="Dismiss"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  }
);

function ChatWindow() {
  const { messages, error, clearError, loading } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [prevMessagesLength, setPrevMessagesLength] = useState(0);
  const [toastType, setToastType] = useState<
    "success" | "error" | "warning" | "info"
  >("error");

  // Determine toast type based on error message
  useEffect(() => {
    if (!error) return;

    // Categorize errors by content
    if (
      error.includes("offline") ||
      error.includes("network") ||
      error.includes("connection")
    ) {
      setToastType("warning");
    } else if (
      error.includes("unavailable") ||
      error.includes("server") ||
      error.includes("backend")
    ) {
      setToastType("warning");
    } else if (error.includes("saved") || error.includes("local")) {
      setToastType("info");
    } else {
      setToastType("error");
    }
  }, [error]);

  // Optimize scroll behavior to maintain position when new messages aren't at the bottom
  useEffect(() => {
    if (!messagesContainerRef.current) return;

    // Calculate if we were at the bottom before new messages
    const container = messagesContainerRef.current;
    const isAtBottom =
      container.scrollHeight - container.clientHeight <=
      container.scrollTop + 50;

    // If we were at the bottom or a new message was added, scroll to bottom
    if (isAtBottom || messages.length > prevMessagesLength) {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }

    setPrevMessagesLength(messages.length);
  }, [messages, prevMessagesLength]);

  // Clear error after 5 seconds (but not for connection-related errors which stay visible)
  useEffect(() => {
    if (
      error &&
      !error.includes("offline") &&
      !error.includes("connection") &&
      !error.includes("unavailable")
    ) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  return (
    <div className="flex-1 flex flex-col relative">
      {/* Connection status banner */}
      <ConnectionBanner />

      {/* Main chat area with message list */}
      <div
        className="flex-1 overflow-y-auto p-4 md:p-6 bg-background-secondary"
        ref={messagesContainerRef}
      >
        {/* Toast notification */}
        {error && (
          <ToastNotification
            message={error}
            type={toastType}
            onDismiss={clearError}
          />
        )}

        <div className="max-w-5xl mx-auto w-full">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-6 py-4">
              {messages.map((message, index) => (
                <MemoizedMessage
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

      {/* Improved loading indicator with status message */}
      {loading && (
        <div className="fixed bottom-24 right-8 bg-white dark:bg-gray-800 rounded-full px-4 py-2 shadow-lg z-20 flex items-center">
          <svg
            className="animate-spin h-5 w-5 text-primary-600 mr-2"
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
          <span className="text-sm text-primary-700 dark:text-primary-300 font-medium">
            Processing
          </span>
        </div>
      )}

      {/* Input */}
      <ChatInput />
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export default memo(ChatWindow);
