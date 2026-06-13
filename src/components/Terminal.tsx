"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TerminalProps {
  logs: string[];
  defaultOpen?: boolean;
}

export function Terminal({ logs, defaultOpen = false }: TerminalProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, open]);

  const handleCopy = async () => {
    const text = logs.map((l) => `> ${l}`).join("\n");
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
          </div>
          <span className="text-xs font-mono text-muted-foreground ml-1">
            execution log
          </span>
          <span className="text-xs text-muted-foreground">
            ({logs.length} lines)
          </span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="bg-[#0a0a0a] relative">
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 z-10 flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors bg-white/5 hover:bg-white/10 border border-white/10 rounded px-2 py-1"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> Copy
              </>
            )}
          </button>

          <div
            ref={scrollRef}
            className="p-4 max-h-56 overflow-y-auto font-mono text-xs leading-relaxed"
          >
            {logs.map((log, i) => (
              <div key={i} className="flex gap-2 animate-fade-in">
                <span className="text-white/20 select-none shrink-0">›</span>
                <span
                  className={cn(
                    log.toLowerCase().includes("error") ||
                      log.toLowerCase().includes("failed")
                      ? "text-red-400"
                      : log.toLowerCase().includes("success") ||
                        log.includes("✓")
                      ? "text-emerald-400"
                      : log.toLowerCase().includes("warning")
                      ? "text-amber-400"
                      : "text-white/60"
                  )}
                >
                  {log}
                </span>
              </div>
            ))}
            {logs.length === 0 && (
              <span className="text-white/20">Waiting for output...</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
