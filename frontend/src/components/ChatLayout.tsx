"use client";
import { useState } from "react";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import { useChat } from "@/context/ChatContext";

export default function ChatLayout() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const { messages } = useChat();

  const handleNewChat = () => {
    // Reset the selected chat and reload the page to start fresh
    setSelectedChatId(null);
    window.location.reload();
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    // In a real app, you would load the selected chat here
    // For now, we'll just set the ID
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <Sidebar 
        onNewChat={handleNewChat} 
        selectedChatId={selectedChatId} 
        onSelectChat={handleSelectChat} 
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-semibold">Chat with Medical Assistant</h2>
        </header>

        {/* Messages and Input */}
        <ChatWindow />
      </div>
    </div>
  );
}