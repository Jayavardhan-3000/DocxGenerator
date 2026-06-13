"use client";

import { AlertCircle, RotateCcw } from "lucide-react";

interface ErrorCardProps {
  error: string;
  logs?: string[];
  onRetry: () => void;
}

export function ErrorCard({ error, logs, onRetry }: ErrorCardProps) {
  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 overflow-hidden">
      <div className="px-4 py-3 border-b border-red-500/10 flex items-center gap-2.5">
        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
        <p className="text-sm font-medium text-red-300">Generation failed</p>
      </div>

      <div className="p-4">
        <p className="text-sm text-red-400/90 mb-4 leading-relaxed">{error}</p>

        {logs && logs.length > 0 && (
          <div className="bg-black/30 rounded-lg p-3 mb-4 font-mono text-xs max-h-32 overflow-y-auto">
            {logs.slice(-10).map((l, i) => (
              <div key={i} className="text-white/50">
                <span className="text-white/20 mr-2">›</span>
                {l}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onRetry}
          className="flex items-center gap-2 text-sm text-red-300 hover:text-red-200 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Try again
        </button>
      </div>
    </div>
  );
}
