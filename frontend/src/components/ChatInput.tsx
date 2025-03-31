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

// Separate button components to optimize renders
const SendButton = memo(
  ({ loading, disabled }: { loading: boolean; disabled: boolean }) => (
    <button
      type="submit"
      disabled={disabled}
      className="
      rounded-lg primary-gradient px-4 py-2.5 text-white font-medium 
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

function ChatInput() {
  const [message, setMessage] = useState("");
  const { sendUserMessage, loading } = useChat();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState<number | null>(null);
  const submittingRef = useRef(false);

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
      setMessage(e.target.value);

      // Use requestAnimationFrame for better performance
      requestAnimationFrame(adjustHeight);
    },
    [adjustHeight]
  );

  // Focus handlers
  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card-bg border-t border-border-color p-4 md:p-6 transition-all duration-200 ease-in-out z-10 relative"
    >
      <div className="max-w-5xl mx-auto">
        <div
          className={`
            flex items-end gap-2 bg-input-bg rounded-xl 
            border border-input-border shadow-sm
            ${isFocused ? "ring-2 ring-primary-200 dark:ring-primary-900" : ""}
            transition-all duration-200 p-1 md:p-2
          `}
        >
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="Type your medical question..."
            className="flex-1 resize-none border-0 bg-transparent p-2 focus:outline-none text-foreground min-h-[40px] transition-none"
            style={{ height: textareaHeight ? `${textareaHeight}px` : "auto" }}
            disabled={loading}
            aria-label="Message input"
          />

          {/* Send button component */}
          <SendButton loading={loading} disabled={!message.trim() || loading} />
        </div>

        {/* Small prompt hint */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Press Enter to send, Shift+Enter for a new line
        </div>
      </div>
    </form>
  );
}

// Export memoized component for better performance
export default memo(ChatInput);
