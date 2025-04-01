"use client";

import {
  useState,
  useRef,
  FormEvent,
  KeyboardEvent,
  useEffect,
  memo,
  useCallback,
} from "react";
import { useChat } from "@/context/ChatContext";

// Tooltip component for small hints
const Tooltip = memo(
  ({ text, children }: { text: string; children: React.ReactNode }) => (
    <div className="group relative inline-block">
      {children}
      <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-md shadow-lg transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
        {text}
        <svg
          className="absolute text-gray-900 dark:text-gray-700 h-2 w-full left-0 top-full"
          x="0px"
          y="0px"
          viewBox="0 0 255 255"
        >
          <polygon points="0,0 127.5,127.5 255,0" fill="currentColor"></polygon>
        </svg>
      </div>
    </div>
  )
);

// Optimized send button component with animation and feedback
const SendButton = memo(
  ({ loading, disabled }: { loading: boolean; disabled: boolean }) => (
    <button
      type="submit"
      disabled={disabled}
      className="
      rounded-xl primary-gradient px-4 py-2.5 text-white font-medium 
      shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 
      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
      transition-all duration-200 transform active:scale-95
      min-w-[80px] self-end
    "
      aria-label="Send message"
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
          <span>Sending</span>
        </span>
      ) : (
        <span className="flex items-center justify-center">
          <span className="mr-1">Send</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 ml-1 transform rotate-90"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11h2v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </span>
      )}
    </button>
  )
);

// Action button component for additional input options
const ActionButton = memo(
  ({
    icon,
    tooltip,
    onClick,
    disabled = false,
  }: {
    icon: React.ReactNode;
    tooltip: string;
    onClick: () => void;
    disabled?: boolean;
  }) => (
    <Tooltip text={tooltip}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {icon}
      </button>
    </Tooltip>
  )
);

// Network status indicator
const NetworkStatus = memo(() => {
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  return (
    <div className="flex items-center text-xs">
      <div
        className={`w-2 h-2 rounded-full mr-1.5 ${
          isOnline ? "bg-green-500" : "bg-red-500"
        }`}
      ></div>
      <span
        className={`text-xs ${
          isOnline
            ? "text-green-600 dark:text-green-400"
            : "text-red-600 dark:text-red-400"
        }`}
      >
        {isOnline ? "Connected" : "Offline"}
      </span>
    </div>
  );
});

function ChatInput() {
  const [message, setMessage] = useState("");
  const { sendUserMessage, loading } = useChat();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState<number | null>(null);
  const submittingRef = useRef(false);
  const maxLength = 2000; // Maximum character limit

  // Auto-focus the textarea on mount but only once
  useEffect(() => {
    // Short delay to ensure rendering is complete
    const timer = setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Clear message handler
  const handleClearMessage = useCallback(() => {
    setMessage("");
    setTextareaHeight(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  }, []);

  // Get suggested questions (could be expanded to fetch from server)
  const handleGetSuggestions = useCallback(() => {
    const suggestions = [
      "What are the symptoms of COVID-19?",
      "How can I reduce my blood pressure naturally?",
      "What causes migraines and how can I prevent them?",
      "Is it normal to feel tired all the time?",
    ];

    const randomSuggestion =
      suggestions[Math.floor(Math.random() * suggestions.length)];
    setMessage(randomSuggestion);

    // Adjust height after setting suggestion
    setTimeout(() => {
      if (textareaRef.current) {
        adjustHeight();
        textareaRef.current.focus();
      }
    }, 10);
  }, []);

  // Optimized submit handler with debounce protection
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      // Prevent double submissions
      if (submittingRef.current || loading || !message.trim()) return;

      submittingRef.current = true;

      try {
        // Get message before clearing the state
        const messageToSend = message;

        // Reset UI immediately for better UX
        setMessage("");
        setTextareaHeight(null);

        // Reset the textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }

        // Then process the message asynchronously
        await sendUserMessage(messageToSend);
      } catch (error) {
        console.error("Error sending message:", error);
      } finally {
        submittingRef.current = false;
      }
    },
    [message, loading, sendUserMessage]
  );

  // Optimized key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as unknown as FormEvent);
      }
    },
    [handleSubmit]
  );

  // Debounced height adjustment function
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";

    // Set height with a max limit
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${newHeight}px`;

    // Update state only if height changed
    if (newHeight !== textareaHeight) {
      setTextareaHeight(newHeight);
    }
  }, [textareaHeight]);

  // Optimized change handler with debouncing
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      // Limit input to maxLength characters
      if (e.target.value.length <= maxLength) {
        setMessage(e.target.value);
      }

      // Use requestAnimationFrame for better performance
      requestAnimationFrame(adjustHeight);
    },
    [adjustHeight, maxLength]
  );

  // Focus handlers
  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);

  // Calculate character count percentage
  const characterPercentage = Math.min((message.length / maxLength) * 100, 100);
  const isNearLimit = characterPercentage > 85;

  return (
    <div className="bg-card-bg border-t border-border-color p-4 md:p-6 transition-all duration-200 ease-in-out z-10 relative">
      {/* Optional offline banner */}
      {typeof navigator !== "undefined" && !navigator.onLine && (
        <div className="connection-error mb-4 text-sm mx-auto max-w-5xl animate-fade-in">
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
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            You're offline - message will be sent when connection is restored
          </span>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col">
          {/* Input area with buttons */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-start mb-1">
              <NetworkStatus />

              <div className="ml-auto flex items-center gap-1">
                <ActionButton
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                  tooltip="Get suggestion"
                  onClick={handleGetSuggestions}
                  disabled={loading}
                />

                <ActionButton
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                  tooltip="Clear message"
                  onClick={handleClearMessage}
                  disabled={!message.length || loading}
                />
              </div>
            </div>

            <div
              className={`
                flex items-end gap-2 bg-input-bg rounded-xl 
                border-2 ${
                  isFocused
                    ? "border-primary-400 dark:border-primary-600"
                    : "border-input-border"
                }
                shadow-sm hover:shadow transition-all duration-200 p-1 md:p-2 relative
              `}
            >
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="Ask any medical question..."
                className="flex-1 resize-none border-0 bg-transparent p-2 focus:outline-none text-foreground min-h-[50px] transition-none"
                style={{
                  height: textareaHeight ? `${textareaHeight}px` : "auto",
                }}
                disabled={loading}
                aria-label="Message input"
                maxLength={maxLength}
              />

              {/* Character count indicator - only visible when typing */}
              {message.length > 0 && (
                <div
                  className={`absolute top-0 right-0 text-xs font-medium mr-2 mt-2 
                    ${
                      isNearLimit
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                >
                  {message.length}/{maxLength}
                </div>
              )}

              {/* Progress bar for character count */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ease-out ${
                    isNearLimit ? "bg-amber-500" : "bg-primary-500"
                  }`}
                  style={{ width: `${characterPercentage}%` }}
                ></div>
              </div>

              {/* Send button component */}
              <SendButton
                loading={loading}
                disabled={!message.trim() || loading}
              />
            </div>
          </form>

          {/* Input hints and keyboard shortcuts */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
            <span>
              Press{" "}
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 font-sans">
                Enter
              </kbd>{" "}
              to send
            </span>
            <span>All messages are encrypted and secure</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export memoized component for better performance
export default memo(ChatInput);
