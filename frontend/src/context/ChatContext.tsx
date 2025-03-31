"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
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
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch chat history on component mount
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        setLoading(true);
        const data = await getChatHistory();
        setMessages(data.history);
      } catch (err) {
        setError("Failed to load chat history. Please try again later.");
        console.error("Error fetching chat history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChatHistory();
  }, []);

  const sendUserMessage = async (message: string) => {
    try {
      setLoading(true);

      // Add user message to the chat immediately with a temporary ID
      const tempId = Date.now();
      const tempUserMessage: ChatMessage = {
        id: tempId,
        content: message,
        is_bot: false,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempUserMessage]);

      try {
        // Send message to API
        const response = await sendMessage(message);

        // Update messages, replacing the temporary message with the actual one
        const botMessage: ChatMessage = {
          id: response.message_id,
          content: response.message,
          is_bot: true,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [
          ...prev.filter((msg) => msg.id !== tempId),
          tempUserMessage,
          botMessage,
        ]);
      } catch (err) {
        // Remove the temporary message if the API call fails
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        throw err;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(`Failed to send message: ${errorMessage}`);
      console.error("Error sending message:", err);
    } finally {
      setLoading(false);
    }
  };

  const removeMessage = async (messageId: number) => {
    try {
      await deleteMessage(messageId);
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(`Failed to delete message: ${errorMessage}`);
      console.error("Error deleting message:", err);
    }
  };

  const clearError = () => setError(null);

  return (
    <ChatContext.Provider
      value={{
        messages,
        loading,
        error,
        sendUserMessage,
        removeMessage,
        clearError,
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
