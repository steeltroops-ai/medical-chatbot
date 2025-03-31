"use client";

import { ChatMessage } from "@/types/chat";
import { useState, useEffect, memo, useCallback, useMemo } from "react";
import { useChat } from "@/context/ChatContext";

interface MessageProps {
  message: ChatMessage;
  isLastMessage?: boolean;
}

// Memoized Avatar component for bot
const BotAvatar = memo(() => (
  <div className="flex-shrink-0 mr-3 self-start mt-2">
    <div className="w-10 h-10 rounded-xl primary-gradient flex items-center justify-center text-white shadow-md">
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
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
  </div>
));

// Memoized Avatar component for user
const UserAvatar = memo(() => (
  <div className="flex-shrink-0 ml-3 self-start mt-2">
    <div className="w-10 h-10 rounded-xl teal-gradient flex items-center justify-center text-white shadow-md">
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
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    </div>
  </div>
));

// Memoized Delete Button component
const DeleteButton = memo(
  ({ onDelete, isDeleting }: { onDelete: () => void; isDeleting: boolean }) => (
    <button
      onClick={onDelete}
      disabled={isDeleting}
      className="ml-2 text-xs opacity-0 group-hover:opacity-70 hover:opacity-100 transition-opacity"
      aria-label="Delete message"
    >
      {isDeleting ? (
        <span className="animate-pulse">...</span>
      ) : (
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
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      )}
    </button>
  )
);

// The main Message component
function Message({ message, isLastMessage = false }: MessageProps) {
  const { removeMessage } = useChat();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Optimized animation effect with cleanup
  useEffect(() => {
    // Use requestAnimationFrame for better performance
    const animationId = requestAnimationFrame(() => {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 50); // Reduced delay for faster rendering

      return () => {
        clearTimeout(timer);
        cancelAnimationFrame(animationId);
      };
    });

    return () => cancelAnimationFrame(animationId);
  }, []);

  // Memoized formatting of timestamp
  const formattedTime = useMemo(
    () =>
      new Date(message.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [message.timestamp]
  );

  // Optimized delete handler
  const handleDelete = useCallback(async () => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      await removeMessage(message.id);
    } catch (error) {
      console.error("Error deleting message:", error);
      setIsDeleting(false);
    }
  }, [isDeleting, message.id, removeMessage]);

  // Memoized class names calculation
  const containerClassNames = useMemo(
    () =>
      `flex w-full ${
        message.is_bot ? "justify-start" : "justify-end"
      } group transition-opacity duration-200 ease-in-out ${
        isVisible ? "opacity-100" : "opacity-0"
      } ${isLastMessage ? "animate-slide-up" : ""}`,
    [message.is_bot, isVisible, isLastMessage]
  );

  const bubbleClassNames = useMemo(
    () =>
      `max-w-[85%] rounded-2xl p-4 ${
        message.is_bot
          ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 shadow-md"
          : "primary-gradient text-white shadow-md"
      } ${message.is_bot ? "rounded-tl-sm" : "rounded-tr-sm"}`,
    [message.is_bot]
  );

  const contentClassNames = useMemo(
    () =>
      `whitespace-pre-wrap text-sm md:text-base ${
        message.is_bot
          ? "prose dark:prose-invert max-w-none prose-sm md:prose-base"
          : ""
      }`,
    [message.is_bot]
  );

  return (
    <div className={containerClassNames}>
      {message.is_bot && <BotAvatar />}

      <div className={bubbleClassNames}>
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-sm flex items-center">
              {message.is_bot ? (
                <>
                  <span>Medical Assistant</span>
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 rounded">
                    AI
                  </span>
                </>
              ) : (
                "You"
              )}
            </span>
            <div className="flex items-center ml-4">
              <span className="text-xs opacity-70">{formattedTime}</span>
              {!message.is_bot && (
                <DeleteButton onDelete={handleDelete} isDeleting={isDeleting} />
              )}
            </div>
          </div>
          <div className={contentClassNames}>{message.content}</div>
        </div>
      </div>

      {!message.is_bot && <UserAvatar />}
    </div>
  );
}

// Export memoized component with custom comparison function for performance
export default memo(Message, (prevProps, nextProps) => {
  // Only re-render if essential props changed
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.timestamp === nextProps.message.timestamp &&
    prevProps.isLastMessage === nextProps.isLastMessage
  );
});
