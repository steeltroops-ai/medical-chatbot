/**
 * API service for communicating with the backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Send a message to the chatbot API
 * @param message - The user's message
 * @returns The response from the API
 */
export async function sendMessage(message: string) {
  try {
    const response = await fetch(`${API_URL}/chat/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

/**
 * Get chat history from the API
 * @returns The chat history
 */
export async function getChatHistory() {
  try {
    const response = await fetch(`${API_URL}/chat/history`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching chat history:", error);
    throw error;
  }
}

/**
 * Delete a message from the chat history
 * @param messageId - The ID of the message to delete
 * @returns The response from the API
 */
export async function deleteMessage(messageId: number) {
  try {
    const response = await fetch(`${API_URL}/chat/message/${messageId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
}
