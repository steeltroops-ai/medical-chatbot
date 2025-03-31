"use client";

import { ChatMessage } from "@/types/chat";
import { useState } from "react";
import { useChat } from "@/context/ChatContext";

interface MessageProps {
  message: ChatMessage;
}

export default function Message({ message }: MessageProps) {
  const { removeMessage } = useChat();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await removeMessage(message.id);
    } catch (error) {
      console.error("Error deleting message:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`flex w-full ${
        message.is_bot ? "justify-start" : "justify-end"
      } mb-4 group`}
    >
      {message.is_bot && (
        <div className="flex-shrink-0 mr-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-lg p-4 shadow-sm ${
          message.is_bot
            ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
            : "bg-blue-600 text-white"
        }`}
      >
        <div className="flex flex-col">
          <div className="flex justify-between items-start mb-1">
            <span className="font-semibold">
              {message.is_bot ? "Medical Assistant" : "You"}
            </span>
            <div className="flex items-center ml-2">
              <span className="text-xs opacity-70">{formattedTime}</span>
              {!message.is_bot && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="ml-2 text-xs opacity-0 group-hover:opacity-70 hover:opacity-100 transition-opacity"
                  aria-label="Delete message"
                >
                  {isDeleting ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
      {!message.is_bot && (
        <div className="flex-shrink-0 ml-3">
          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
