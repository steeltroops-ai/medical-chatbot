"use client";

import { ChatProvider } from "@/context/ChatContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ErrorSuppressor } from "@/components/ErrorSuppressor";
import "./globals.css";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ChatProvider>
        <ErrorSuppressor />
        {children}
      </ChatProvider>
    </ThemeProvider>
  );
}
