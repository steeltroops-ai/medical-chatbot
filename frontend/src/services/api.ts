/**
 * API service for communicating with the backend
 */

const API_BASE_URL = "http://localhost:3001"; // adjust this to match your backend URL

export const checkBackendConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Update API URL to match Flask backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Configure retry settings
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // in milliseconds

// Update fetch options to include credentials
const defaultFetchOptions: RequestInit = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};

/**
 * Check if we're online
 * @returns True if online, false otherwise
 */
export function isOnline() {
  return typeof navigator !== "undefined" && navigator.onLine;
}

/**
 * Helper function to add retry logic to fetch requests
 * @param url - The URL to fetch
 * @param options - The fetch options
 * @returns The response from the API
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = MAX_RETRIES
) {
  const fetchOptions = {
    ...defaultFetchOptions,
    ...options,
    headers: {
      ...defaultFetchOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      // Add timeout
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    return response;
  } catch (error) {
    if (
      retries > 0 &&
      !(error instanceof DOMException && error.name === "AbortError")
    ) {
      console.log(`Retrying request to ${url}, ${retries} retries left`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }

    throw error;
  }
}

/**
 * Send a message to the chatbot API
 * @param message - The user's message
 * @returns The response from the API
 */
export async function sendMessage(message: string) {
  if (!isOnline()) {
    throw new Error(
      "You are currently offline. Your message has been saved locally."
    );
  }

  try {
    const response = await fetchWithRetry(`${API_URL}/api/chat/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      // Handle different error status codes
      if (response.status === 503) {
        throw new Error(
          "The service is currently busy. Please try again in a moment."
        );
      }

      // Try to parse error data
      try {
        const errorData = await response.json();
        const errorMessage = errorData.error || `API error: ${response.status}`;

        // Create a custom error object with additional properties
        const customError = new Error(errorMessage);
        // Add status code to the error for better handling
        (customError as any).code = response.status;
        (customError as any).statusText = response.statusText;
        throw customError;
      } catch (jsonError) {
        // If we can't parse JSON, return a generic error with status code
        const genericError = new Error(
          `Server error (${response.status}): ${response.statusText}`
        );
        (genericError as any).code = response.status;
        throw genericError;
      }
    }

    return await response.json();
  } catch (error) {
    // Only log the error if it's not an offline error we already created
    if (!(error instanceof Error && error.message.includes("offline"))) {
      console.error("Error sending message:", error);
    }
    throw error;
  }
}

/**
 * Get chat history from the API
 * @returns The chat history
 */
export async function getChatHistory() {
  // If offline, immediately return empty history
  if (!isOnline()) {
    return { history: [] };
  }

  try {
    const response = await fetchWithRetry(`${API_URL}/api/chat/history`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      // If the user is not authenticated, return empty history instead of error
      if (response.status === 401) {
        return { history: [] };
      }

      try {
        const errorData = await response.json();
        console.warn(
          `Error fetching chat history: ${
            errorData.error || response.statusText
          }`
        );
      } catch (jsonError) {
        console.warn(`Error fetching chat history: ${response.statusText}`);
      }

      // Return empty history on error to prevent app from crashing
      return { history: [] };
    }

    return await response.json();
  } catch (error) {
    console.warn("Error fetching chat history:", error);
    // Return empty history on error to prevent app from crashing
    return { history: [] };
  }
}

/**
 * Delete a message from the chat history
 * @param messageId - The ID of the message to delete
 * @returns The response from the API
 */
export async function deleteMessage(messageId: number) {
  if (!isOnline()) {
    throw new Error(
      "You are currently offline. The message was removed locally."
    );
  }

  try {
    const response = await fetchWithRetry(
      `${API_URL}/api/chat/message/${messageId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      // For 404 (message not found), we can just proceed since it's already gone
      if (response.status === 404) {
        return { message: "Message already deleted" };
      }

      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.status}`);
      } catch (jsonError) {
        throw new Error(
          `Server error (${response.status}): ${response.statusText}`
        );
      }
    }

    return await response.json();
  } catch (error) {
    // Only log deletion errors if they're not offline errors
    if (!(error instanceof Error && error.message.includes("offline"))) {
      console.error("Error deleting message:", error);
    }
    throw error;
  }
}

/**
 * Check the health of the API
 * @returns True if the API is healthy, false otherwise
 */
export async function checkApiHealth(): Promise<boolean> {
  if (!isOnline()) {
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/api/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Add timeout
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.warn(`Health check failed with status: ${response.status}`);
      return false;
    }

    const data = await response.json();
    return data.status === "ok";
  } catch (error) {
    console.warn("Health check failed:", error);
    return false;
  }
}
