"use client";

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { NavDashboardButton } from '@/components/layout/nav-dashboard-button';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';

interface MarketingHeaderProps {
  brandName: string;
  loginText: string;
}

export function MarketingHeader({ brandName, loginText }: MarketingHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once on mount to capture initial scroll position
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header
      className={`fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        scrolled
          ? 'top-4 w-[calc(100%-2rem)] max-w-5xl px-6 py-3 rounded-2xl bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/80 shadow-2xl shadow-black/60'
          : 'top-6 w-[calc(100%-1.5rem)] max-w-6xl px-8 py-5 rounded-3xl bg-zinc-950/20 backdrop-blur-md border border-zinc-800/30 shadow-lg shadow-black/10'
      }`}
    >
      <div className="flex items-center justify-between w-full">
        {/* Brand/Logo */}
        <Link
          href="/"
          className={`font-bold tracking-tight text-white transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            scrolled ? 'text-lg scale-95 origin-left' : 'text-xl'
          } hover:opacity-80`}
        >
          {brandName}
        </Link>

        {/* Navigation & Controls */}
        <nav
          className={`flex items-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            scrolled ? 'gap-3' : 'gap-4'
          }`}
        >
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-300 hover:text-white transition-colors py-1.5 px-3 rounded-lg hover:bg-white/5"
          >
            {loginText}
          </Link>
          <div className="flex items-center gap-2">
            <NavDashboardButton />
            <LocaleSwitcher />
          </div>
        </nav>
      </div>
    </header>
  );
}
