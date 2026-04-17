"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("App Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="flex-1 p-6 lg:p-8 flex items-center justify-center">
      <div className="max-w-md w-full border border-red-500/20 bg-red-500/5 rounded-xl p-6 text-center space-y-4">
        <div className="mx-auto w-12 h-12 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500/80" />
        </div>
        
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-red-500">Failed to load content</h2>
          <p className="text-zinc-400 text-sm">
            We encountered a problem loading this section.
          </p>
        </div>

        <button
          onClick={() => reset()}
          className="mt-4 flex items-center justify-center gap-2 mx-auto bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800 transition-colors py-2 px-4 rounded-lg font-medium text-sm"
        >
          <RefreshCcw className="w-4 h-4" />
          Try again
        </button>
      </div>
    </div>
  );
}
