"use client";

import { Check, X, Minus, AlertTriangle } from "lucide-react";
import { ScriptAnalysis } from "@/lib/types";

interface AnalysisCardProps {
  analysis: ScriptAnalysis;
  filename: string;
}

export function AnalysisCard({ analysis, filename }: AnalysisCardProps) {
  const checks = [
    {
      ok: analysis.usesDocx,
      label: "Uses docx library",
      required: true,
    },
    {
      ok: analysis.hasPacker,
      label: "Packer detected",
      required: true,
    },
    {
      ok: !!analysis.outputFile,
      label: analysis.outputFile
        ? `Output: ${analysis.outputFile}`
        : "Output filename",
      required: false,
    },
    {
      ok: !!analysis.claudePath,
      warn: true,
      label: analysis.claudePath
        ? "Claude path detected — will patch"
        : "No Claude-specific paths",
      required: false,
    },
  ];

  const stats = [
    { label: "Est. pages", value: analysis.estimatedPages },
    { label: "Headings", value: analysis.headings },
    { label: "Tables", value: analysis.tables },
    { label: "Paragraphs", value: analysis.paragraphs },
    { label: "Images", value: analysis.images },
    { label: "Code blocks", value: analysis.codeBlocks },
  ];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Script analysis
        </p>
        <span className="text-xs font-mono text-muted-foreground">{filename}</span>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 mb-4">
        {checks.map((c, i) => (
          <div key={i} className="flex items-center gap-2.5 text-sm">
            {c.warn && c.ok ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : c.ok ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : c.required ? (
              <X className="w-3.5 h-3.5 text-red-400 shrink-0" />
            ) : (
              <Minus className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            )}
            <span
              className={
                c.ok
                  ? c.warn
                    ? "text-amber-300"
                    : "text-foreground"
                  : c.required
                  ? "text-red-400"
                  : "text-muted-foreground"
              }
            >
              {c.label}
            </span>
          </div>
        ))}
      </div>

      <div className="px-4 pb-4 grid grid-cols-3 sm:grid-cols-6 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-secondary rounded-lg px-3 py-2 text-center">
            <p className="text-base font-medium tabular-nums">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
