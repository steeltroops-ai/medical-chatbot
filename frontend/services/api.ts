/**
 * API service for communicating with the backend
 */

// Update API URL to match Flask backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
 * Check backend connectivity
 * @returns True if backend is available, false otherwise
 */
export async function checkBackendConnection() {
  try {
    const response = await fetchWithRetry(`${API_URL}/api/health`);
    return response.ok;
  } catch (error) {
    console.error("Backend connection check failed:", error);
    return false;
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
    const response = await fetchWithRetry(`${API_URL}/api/chat/history`);

    if (!response.ok) {
      if (response.status === 401) {
        // User is not authenticated
        return { history: [] };
      }

      throw new Error(`Failed to fetch chat history: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching chat history:", error);
    // Return empty history on error
    return { history: [] };
  }
}

/**
 * Delete a message from the chat history
 * @param messageId - The ID of the message to delete
 */
export async function deleteMessage(messageId: number) {
  if (!isOnline()) {
    throw new Error("Cannot delete messages while offline");
  }

  try {
    const response = await fetchWithRetry(
      `${API_URL}/api/chat/message/${messageId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete message: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
}

/**
 * Register a new user
 * @param username - The username
 * @param email - The email address
 * @param password - The password
 */
export async function registerUser(username: string, email: string, password: string) {
  try {
    const response = await fetchWithRetry(`${API_URL}/api/auth/register`, {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Registration failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
}

/**
 * Log in a user
 * @param email - The email address
 * @param password - The password
 */
export async function loginUser(email: string, password: string) {
  try {
    const response = await fetchWithRetry(`${API_URL}/api/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Login failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
}

/**
 * Log out the current user
 */
export async function logoutUser() {
  try {
    const response = await fetchWithRetry(`${API_URL}/api/auth/logout`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Logout failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
}