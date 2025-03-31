"use client";
import { useState } from "react";
import { useChat } from "@/context/ChatContext";
import Image from "next/image";

interface SidebarProps {
  onNewChat: () => void;
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

export default function Sidebar({ onNewChat, selectedChatId, onSelectChat }: SidebarProps) {
  const { messages } = useChat();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Group messages by date for the sidebar
  const chatGroups = messages.reduce<Record<string, typeof messages>>((acc, message) => {
    if (message.is_bot) return acc; // Only group by user messages
    
    const date = new Date(message.timestamp).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(message);
    return acc;
  }, {});

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-full border-r border-gray-800">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold">Medical Assistant</h1>
      </div>
      
      <div className="p-3">
        <button 
          className="w-full bg-white/10 hover:bg-white/20 text-white rounded-md p-3 flex items-center justify-center transition-colors"
          onClick={onNewChat}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <h2 className="text-sm font-semibold text-gray-400 mb-2">Your Chats</h2>
          {Object.entries(chatGroups).map(([date, msgs]) => (
            <div key={date} className="mb-4">
              <h3 className="text-xs text-gray-500 mb-1">{date}</h3>
              {msgs.map((msg) => (
                <button
                  key={msg.id}
                  className={`w-full text-left p-2 rounded-md hover:bg-gray-700 mb-1 text-sm truncate ${selectedChatId === String(msg.id) ? 'bg-gray-700' : ''}`}
                  onClick={() => onSelectChat(String(msg.id))}
                >
                  {msg.content.substring(0, 30)}{msg.content.length > 30 ? '...' : ''}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 border-t border-gray-800">
        <button 
          className="w-full text-gray-400 hover:text-white p-2 rounded-md hover:bg-gray-700 text-sm flex items-center"
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </button>

        <button className="w-full text-gray-400 hover:text-white p-2 rounded-md hover:bg-gray-700 text-sm flex items-center mt-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );
}