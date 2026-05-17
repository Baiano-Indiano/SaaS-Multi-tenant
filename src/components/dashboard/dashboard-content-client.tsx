"use client";

import * as React from "react";

interface DashboardContentClientProps {
  children: React.ReactNode;
}

/**
 * Basic wrapper for dashboard content. 
 * Animation is handled by the parent DashboardClient to avoid conflicts.
 */
export function DashboardContentClient({ children }: DashboardContentClientProps) {
  return (
    <div className="w-full">
      {children}
    </div>
  );
}
