import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../../globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

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

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!(routing.locales as unknown as string[]).includes(locale)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <Suspense fallback={null}>
            <GSAPProgressBar />
          </Suspense>
          <TooltipProvider>
            <NotificationProvider>
              {children}
              <Toaster position="top-right" richColors />
            </NotificationProvider>
          </TooltipProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
