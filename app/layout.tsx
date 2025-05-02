import type React from "react";
import "@/app/globals.css";
import { Inter } from "next/font/google";
// Remove cookies, SessionProvider, Notification imports

import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });
// Remove SessionData interface definition

export const metadata = {
  title: "Exam Schedule System",
  description: "A system for managing exam schedules and invigilation",
    generator: 'v0.dev'
}

// Remove async and return type annotation
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Remove cookie reading and parsing logic

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Remove SessionProvider wrapper */}
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
