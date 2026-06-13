"use client";

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepState } from "@/lib/types";

interface ProgressStepsProps {
  steps: StepState[];
}

export function ProgressSteps({ steps }: ProgressStepsProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Progress
        </p>
      </div>
      <div className="p-2">
        {steps.map((step, i) => (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
              step.status === "running" && "bg-white/[0.03]"
            )}
          >
            <div
              className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all",
                step.status === "done" &&
                  "bg-emerald-500/20 border border-emerald-500/30",
                step.status === "running" &&
                  "bg-blue-500/20 border border-blue-500/30",
                step.status === "error" &&
                  "bg-red-500/20 border border-red-500/30",
                step.status === "pending" && "bg-secondary border border-border"
              )}
            >
              {step.status === "done" && (
                <Check className="w-3 h-3 text-emerald-400" />
              )}
              {step.status === "running" && (
                <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
              )}
              {step.status === "error" && (
                <span className="text-red-400 text-xs font-bold">!</span>
              )}
            </div>

            <span
              className={cn(
                "text-sm transition-colors",
                step.status === "done" && "text-foreground",
                step.status === "running" && "text-blue-300",
                step.status === "error" && "text-red-400",
                step.status === "pending" && "text-muted-foreground"
              )}
            >
              {step.label}
            </span>

            {step.status === "done" && (
              <span className="ml-auto text-xs text-emerald-500">✓</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
