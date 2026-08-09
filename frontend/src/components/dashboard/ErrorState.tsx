"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="animate-scale-in flex flex-col items-center justify-center gap-6 py-20 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: "var(--color-error-bg)" }}
      >
        <AlertCircle
          size={28}
          style={{ color: "var(--color-error)" }}
          strokeWidth={1.5}
        />
      </div>

      <div className="max-w-sm">
        <h3
          className="text-lg font-semibold tracking-tight mb-2"
          style={{ color: "var(--color-text-primary)" }}
        >
          Optimization failed
        </h3>
        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {message}
        </p>
      </div>

      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:opacity-90 active:scale-95"
        style={{
          background: "var(--color-navy-900)",
          color: "var(--color-text-inverse)",
        }}
      >
        <RefreshCw size={14} />
        Try again
      </button>
    </div>
  );
}
