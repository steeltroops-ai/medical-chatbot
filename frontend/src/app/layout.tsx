import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ChatProvider } from "@/context/ChatContext";
import { ThemeProvider } from "@/context/ThemeContext";
import ErrorSuppressor from "@/components/ErrorSuppressor";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Medical Assistant | AI-Powered Healthcare Chat",
  description:
    "Get reliable medical information through an AI-powered chat interface. Ask questions, receive guidance, and learn about health topics.",
  keywords:
    "medical assistant, healthcare AI, medical chatbot, health information",
  authors: [{ name: "Medical Assistant Team" }],
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <ThemeProvider>
          <ChatProvider>
            <ErrorSuppressor />
            {children}
          </ChatProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
