"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface FeedbackBannerProps {
  title?: string;
  message: string;
  variant?: "error" | "info" | "success";
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const variantClasses: Record<NonNullable<FeedbackBannerProps["variant"]>, string> = {
  error: "bg-red-900/20 border-red-900/50 text-red-300",
  info: "bg-zinc-900/60 border-zinc-700/70 text-zinc-300",
  success: "bg-emerald-900/20 border-emerald-900/50 text-emerald-300",
};

export function FeedbackBanner({
  title,
  message,
  variant = "info",
  actionLabel,
  onAction,
  className,
}: FeedbackBannerProps) {
  return (
    <div className={cn("rounded-md border p-3 text-sm", variantClasses[variant], className)}>
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      <p>{message}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 underline underline-offset-4 hover:opacity-90"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

