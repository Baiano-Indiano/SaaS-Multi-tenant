"use client";

export default function AppLoading() {
  return (
    <div className="flex-1 p-6 lg:p-8 w-full max-w-6xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-zinc-900 rounded-md animate-pulse" />
        <div className="h-4 w-96 bg-zinc-900 rounded-md animate-pulse" />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-zinc-900 rounded-xl animate-pulse" />
        ))}
      </div>

      <div className="h-64 mt-8 bg-zinc-900 rounded-xl animate-pulse" />
    </div>
  );
}
