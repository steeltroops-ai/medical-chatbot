/**
 * Types for the chat functionality
 */

/**
 * Chat message interface
 */
export interface ChatMessage {
  id: number;
  content: string;
  is_bot: boolean;
  timestamp: string;
}

/**
 * Chat history interface
 */
export interface ChatHistory {
  history: ChatMessage[];
}

/**
 * Message response interface
 */
export interface MessageResponse {
  message: string;
  message_id: number;
}

/**
 * Error response interface
 */
export interface ErrorResponse {
  error: string;
}
