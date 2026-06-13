"use client";

import { Clock, Download, FileText } from "lucide-react";
import { RecentFile } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/utils";

interface RecentFilesProps {
  files: RecentFile[];
  onDownload: (file: RecentFile, type: "docx" | "pdf") => void;
}

export function RecentFiles({ files, onDownload }: RecentFilesProps) {
  if (files.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Recent
        </p>
      </div>
      <div className="space-y-2">
        {files.map((f, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-card border border-border hover:border-border/80 transition-colors group"
          >
            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {f.customName || f.filename}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(f.docxSize)} · {formatDate(f.generatedAt)}
              </p>
            </div>
            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onDownload(f, "docx")}
                title="Download DOCX"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <Download className="w-3 h-3" /> DOCX
              </button>
              {f.pdfAvailable && (
                <button
                  onClick={() => onDownload(f, "pdf")}
                  title="Download PDF"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  <Download className="w-3 h-3" /> PDF
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
