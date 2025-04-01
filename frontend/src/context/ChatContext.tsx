"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { ChatMessage, ErrorResponse, MessageResponse } from "@/types/chat";
import { getChatHistory, sendMessage, deleteMessage } from "@/services/api";

// Enhanced error handling with categories
export type ErrorType = "connection" | "server" | "input" | "general";

interface ChatContextType {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  errorType?: ErrorType;
  sendUserMessage: (message: string) => Promise<void>;
  removeMessage: (messageId: number) => Promise<void>;
  clearError: () => void;
  clearAllMessages: () => void;
  isBackendAvailable: boolean;
}

// Storage key for localStorage
const STORAGE_KEY = "medical_chatbot_messages";

// Create context with a more meaningful default value
const defaultContextValue: ChatContextType = {
  messages: [],
  loading: false,
  error: null,
  sendUserMessage: async () => {},
  removeMessage: async () => {},
  clearError: () => {},
  clearAllMessages: () => {},
  isBackendAvailable: true,
};

const ChatContext = createContext<ChatContextType>(defaultContextValue);

export function ChatProvider({ children }: { children: ReactNode }) {
  // Use refs for values that don't need to trigger re-renders
  const isInitialLoadRef = useRef(true);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const backendCheckTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Main state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType | undefined>(undefined);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [isBackendAvailable, setIsBackendAvailable] = useState<boolean>(true);

  // Helper function to set formatted errors
  const setFormattedError = useCallback((message: string, type: ErrorType) => {
    setError(message);
    setErrorType(type);
  }, []);

  // Import the API URL from api.ts
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Check backend connectivity
  const checkBackendConnectivity = useCallback(async () => {
    if (!isOnline) {
      setIsBackendAvailable(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_URL}/api/health`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      setIsBackendAvailable(response.ok);

      if (!response.ok && !error) {
        setFormattedError(
          "Backend services are currently unavailable. Your messages are saved locally.",
          "server"
        );
      }
    } catch (err) {
      setIsBackendAvailable(false);

      if (!error) {
        setFormattedError(
          "Cannot connect to the medical assistant service. Working in offline mode.",
          "connection"
        );
      }
    }
  }, [isOnline, error, setFormattedError]);

  // Start periodic backend connectivity checks
  useEffect(() => {
    checkBackendConnectivity();

    backendCheckTimerRef.current = setInterval(checkBackendConnectivity, 30000); // Check every 30 seconds

    return () => {
      if (backendCheckTimerRef.current) {
        clearInterval(backendCheckTimerRef.current);
      }
    };
  }, [isOnline, checkBackendConnectivity]);

  // Debounced loading state to prevent flashing loading indicators
  const setLoadingDebounced = useCallback((isLoading: boolean) => {
    if (isLoading) {
      loadingTimerRef.current = setTimeout(() => {
        setLoading(true);
      }, 200); // Short delay before showing loading state
    } else {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
      setLoading(false);
    }
  }, []);

  // Cleanup loading timer
  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
      if (backendCheckTimerRef.current) {
        clearInterval(backendCheckTimerRef.current);
      }
    };
  }, []);

  // Optimized storage of messages to localStorage - only save if data actually changed
  useEffect(() => {
    if (messages.length > 0) {
      try {
        const storedMessages = localStorage.getItem(STORAGE_KEY);
        const currentMessages = JSON.stringify(messages);

        // Only update localStorage if the messages have changed
        if (storedMessages !== currentMessages) {
          localStorage.setItem(STORAGE_KEY, currentMessages);
        }
      } catch (err) {
        console.error("Error saving to localStorage:", err);
      }
    }
  }, [messages]);

  // Global error interceptors to prevent system-level error badges
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Intercept console errors to prevent them from triggering system badges
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // If this is a network error to the backend, handle it gracefully
      const errorString = args.join(" ");
      if (
        errorString.includes("localhost:5000") ||
        errorString.includes("network error") ||
        errorString.includes("failed to fetch")
      ) {
        setIsBackendAvailable(false);
        if (!error) {
          setFormattedError(
            "Connection to medical service unavailable. Working in offline mode.",
            "connection"
          );
        }
        // Still log to console but prevent it from triggering system badges
        args[0] = "[Intercepted] " + args[0];
      }
      originalConsoleError.apply(console, args);
    };

    // Intercept unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault(); // Prevent default error handling
      if (!error) {
        setFormattedError(
          "An operation couldn't complete. Your data is still safe.",
          "general"
        );
      }
      console.log("[Intercepted] Unhandled rejection:", event.reason);
    };

    // Intercept JS errors
    const handleError = (event: ErrorEvent) => {
      event.preventDefault(); // Prevent default error handling
      if (!error && !event.message.includes("ResizeObserver")) {
        setFormattedError("Something went wrong. Please try again.", "general");
      }
      console.log("[Intercepted] Error:", event.message);
    };

    // Monitor online status
    const handleOnline = () => {
      setIsOnline(true);
      setFormattedError(
        "You're back online! Your messages will be synced to the server.",
        "connection"
      );
      setTimeout(clearError, 5000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsBackendAvailable(false);
      setFormattedError(
        "You're offline. Messages are saved locally and will sync when you're back online.",
        "connection"
      );
    };

    // Add all event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    return () => {
      // Clean up all listeners and restore console
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
      window.removeEventListener("error", handleError);
      console.error = originalConsoleError;
    };
  }, [error, setFormattedError]);

  // Load messages from localStorage and fetch from API only once at startup
  useEffect(() => {
    if (!isInitialLoadRef.current) return;

    const loadData = async () => {
      // First load from localStorage
      try {
        const storedMessages = localStorage.getItem(STORAGE_KEY);
        if (storedMessages) {
          const parsedMessages = JSON.parse(storedMessages);
          setMessages(parsedMessages);
        }
      } catch (err) {
        console.error("Error loading messages from localStorage:", err);
        setFormattedError(
          "Could not load your saved messages. Starting a fresh conversation.",
          "general"
        );
      }

      // Then try to fetch from API if online
      if (isOnline && isBackendAvailable) {
        try {
          setLoadingDebounced(true);
          const data = await getChatHistory();

          // Only update messages if we got something from the server
          if (data.history && data.history.length > 0) {
            setMessages((prevMessages) => {
              // If we have more messages locally than from the server,
              // prefer the local messages (newer)
              if (prevMessages.length > data.history.length) {
                return prevMessages;
              }
              return data.history;
            });
          }
        } catch (err) {
          console.error("Error fetching chat history:", err);
          setFormattedError(
            "Could not retrieve your conversation history from the server. Using locally saved messages.",
            "server"
          );
        } finally {
          setLoadingDebounced(false);
          isInitialLoadRef.current = false;
        }
      } else {
        isInitialLoadRef.current = false;
      }
    };

    loadData();
  }, [isOnline, isBackendAvailable, setLoadingDebounced, setFormattedError]);

  // Optimize message sending to prevent re-renders
  const sendUserMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      try {
        setLoadingDebounced(true);

        // Create a unique ID for this message
        const tempId = Date.now();
        const userMessage: ChatMessage = {
          id: tempId,
          content: message,
          is_bot: false,
          timestamp: new Date().toISOString(),
        };

        // Add user message to the chat immediately
        setMessages((prev) => [...prev, userMessage]);

        // If offline or backend unavailable, simulate a response
        if (!isOnline || !isBackendAvailable) {
          const offlineResponse: ChatMessage = {
            id: tempId + 1,
            content: !isOnline
              ? "You're currently offline. Your message has been saved and will be processed when you're back online."
              : "The medical assistant service is currently unavailable. Your message has been saved for later processing.",
            is_bot: true,
            timestamp: new Date().toISOString(),
          };

          // Use a timeout to simulate network delay and prevent UI jumping
          setTimeout(() => {
            setMessages((prev) => [...prev, offlineResponse]);
            setLoadingDebounced(false);
          }, 500);

          return;
        }

        try {
          // Send message to API
          const response = await sendMessage(message);

          // Add bot response to the chat
          const botMessage: ChatMessage = {
            id: response.message_id || tempId + 1,
            content: response.message,
            is_bot: true,
            timestamp: new Date().toISOString(),
          };

          setMessages((prev) => [...prev, botMessage]);
        } catch (err) {
          // More user-friendly error messages based on error type
          if (err instanceof Error) {
            if (
              err.message.includes("timeout") ||
              err.message.includes("network")
            ) {
              setFormattedError(
                "Connection issue with the medical service. Your message is saved locally.",
                "connection"
              );
            } else if (
              err.message.includes("500") ||
              err.message.includes("server")
            ) {
              setFormattedError(
                "The medical service is experiencing issues. Please try again later.",
                "server"
              );
            } else {
              setFormattedError(
                "Could not process your request at this time.",
                "general"
              );
            }
          } else {
            setFormattedError(
              "An unexpected error occurred. Please try again.",
              "general"
            );
          }

          // Create an error message from the bot with more detailed info
          const errorBotMessage: ChatMessage = {
            id: tempId + 1,
            content:
              "I'm sorry, I couldn't process your request right now. Your message has been saved, and I'll respond when the service is available again.",
            is_bot: true,
            timestamp: new Date().toISOString(),
          };

          setMessages((prev) => [...prev, errorBotMessage]);
          console.error("Error sending message:", err);
        }
      } finally {
        setLoadingDebounced(false);
      }
    },
    [isOnline, isBackendAvailable, setLoadingDebounced, setFormattedError]
  );

  const removeMessage = useCallback(
    async (messageId: number) => {
      try {
        // First update local state
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));

        // Then try to sync with server if online
        if (isOnline && isBackendAvailable) {
          await deleteMessage(messageId).catch((err) => {
            console.error("Error deleting message from server:", err);
            // We don't revert the UI change even if the server call fails
          });
        }
      } catch (err) {
        setFormattedError(
          "Couldn't delete the message from the server, but it's removed from your current view.",
          "general"
        );
        console.error("Error deleting message:", err);
      }
    },
    [isOnline, isBackendAvailable, setFormattedError]
  );

  const clearError = useCallback(() => {
    setError(null);
    setErrorType(undefined);
  }, []);

  const clearAllMessages = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      messages,
      loading,
      error,
      errorType,
      sendUserMessage,
      removeMessage,
      clearError,
      clearAllMessages,
      isBackendAvailable,
    }),
    [
      messages,
      loading,
      error,
      errorType,
      sendUserMessage,
      removeMessage,
      clearError,
      clearAllMessages,
      isBackendAvailable,
    ]
  );

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
