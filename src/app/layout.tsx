import { AiAssistantChatbot } from "@/components/shared/AiAssistantChatbot";
import { AuthErrorNotifier } from "@/components/shared/AuthErrorNotifier";
import { AuthProvider } from "@/components/shared/AuthProvider";
import { Footer } from "@/components/shared/Footer";
import { Navbar } from "@/components/shared/Navbar";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { Suspense } from "react";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "redBusMalaysia",
  description: "Modern Malaysian bus ticket booking platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground" suppressHydrationWarning>
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <Footer />
          <Toaster position="top-center" richColors />
          <AiAssistantChatbot />
          <Suspense fallback={null}>
            <AuthErrorNotifier />
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
