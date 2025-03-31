"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
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

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
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

  // Load messages from localStorage and then try to fetch from API
  useEffect(() => {
    // First load from localStorage
    const loadFromLocalStorage = () => {
      try {
        const storedMessages = localStorage.getItem(STORAGE_KEY);
        if (storedMessages) {
          setMessages(JSON.parse(storedMessages));
        }
      } catch (err) {
        console.error("Error loading messages from localStorage:", err);
      }
    };

    // Then try to fetch from API
    const fetchChatHistory = async () => {
      if (!isOnline) return;

      try {
        setLoading(true);
        const data = await getChatHistory();

        // Only update messages if we got something from the server
        if (data.history && data.history.length > 0) {
          setMessages(data.history);
        }
      } catch (err) {
        // Don't show error if we're offline, just use localStorage
        if (isOnline) {
          console.error("Error fetching chat history:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    // Execute both functions
    loadFromLocalStorage();
    fetchChatHistory();
  }, [isOnline]);

  const sendUserMessage = useCallback(
    async (message: string) => {
      try {
        setLoading(true);

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

          setTimeout(() => {
            setMessages((prev) => [...prev, offlineResponse]);
            setLoading(false);
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
        setLoading(false);
      }
    },
    [isOnline]
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

  return (
    <ChatContext.Provider
      value={{
        messages,
        loading,
        error,
        sendUserMessage,
        removeMessage,
        clearError,
        clearAllMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
