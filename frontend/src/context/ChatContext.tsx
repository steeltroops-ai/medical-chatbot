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

interface ChatContextType {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  sendUserMessage: (message: string) => Promise<void>;
  removeMessage: (messageId: number) => Promise<void>;
  clearError: () => void;
  clearAllMessages: () => void;
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
};

const ChatContext = createContext<ChatContextType>(defaultContextValue);

export function ChatProvider({ children }: { children: ReactNode }) {
  // Use refs for values that don't need to trigger re-renders
  const isInitialLoadRef = useRef(true);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Main state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

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

  // Monitor online status
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

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
      }

      // Then try to fetch from API if online
      if (isOnline) {
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
          if (isOnline) {
            console.error("Error fetching chat history:", err);
          }
        } finally {
          setLoadingDebounced(false);
          isInitialLoadRef.current = false;
        }
      } else {
        isInitialLoadRef.current = false;
      }
    };

    loadData();
  }, [isOnline, setLoadingDebounced]);

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

        // If offline, simulate a response
        if (!isOnline) {
          const offlineResponse: ChatMessage = {
            id: tempId + 1,
            content:
              "I'm currently offline. Your message has been saved and will be processed when you're back online.",
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
          const errorMessage =
            err instanceof Error ? err.message : "An unknown error occurred";
          setError(`Failed to get response: ${errorMessage}`);

          // Create an error message from the bot
          const errorBotMessage: ChatMessage = {
            id: tempId + 1,
            content:
              "Sorry, I couldn't process your request. Please try again later.",
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
    [isOnline, setLoadingDebounced]
  );

  const removeMessage = useCallback(
    async (messageId: number) => {
      try {
        // First update local state
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));

        // Then try to sync with server if online
        if (isOnline) {
          await deleteMessage(messageId).catch((err) => {
            console.error("Error deleting message from server:", err);
            // We don't revert the UI change even if the server call fails
          });
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(`Failed to delete message: ${errorMessage}`);
        console.error("Error deleting message:", err);
      }
    },
    [isOnline]
  );

  const clearError = useCallback(() => setError(null), []);

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
      sendUserMessage,
      removeMessage,
      clearError,
      clearAllMessages,
    }),
    [
      messages,
      loading,
      error,
      sendUserMessage,
      removeMessage,
      clearError,
      clearAllMessages,
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
