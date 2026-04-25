import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SaaS Multi-tenant",
  description: "Enterprise multi-tenant architecture",
};

import { Toaster } from "sonner";
import { NotificationProvider } from "@/components/notifications/notification-provider";

import { GSAPProgressBar } from "@/components/layout/gsap-progress-bar";
import { Suspense } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Suspense fallback={null}>
          <GSAPProgressBar />
        </Suspense>
        <TooltipProvider>
          <NotificationProvider>
            {children}
            <Toaster position="top-right" richColors />
          </NotificationProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
