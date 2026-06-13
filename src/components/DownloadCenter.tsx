"use client";

import { useState } from "react";
import { Download, FileText, FileType, Archive, Pencil, Check } from "lucide-react";
import { cn, formatBytes, formatDate } from "@/lib/utils";
import { UploadResponse } from "@/lib/types";

interface DownloadCenterProps {
  result: UploadResponse;
  onDownload: (type: "docx" | "pdf" | "zip", name: string) => void;
  initialName: string;
}

export function DownloadCenter({
  result,
  onDownload,
  initialName,
}: DownloadCenterProps) {
  const [name, setName] = useState(initialName.replace(/\.docx$/, ""));
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleSaveName = () => {
    const trimmed = editValue.trim();
    if (trimmed) setName(trimmed);
    setEditing(false);
  };

  const handleDownload = async (type: "docx" | "pdf" | "zip") => {
    setDownloading(type);
    try {
      await onDownload(type, name);
    } finally {
      setTimeout(() => setDownloading(null), 1000);
    }
  };

  const generatedAt = new Date().toISOString();

  return (
    <div className="space-y-3">
      {/* Success banner */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
          <Check className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-emerald-300">
            Generated in {(result.durationMs / 1000).toFixed(2)}s
          </p>
          <p className="text-xs text-emerald-500/70 mt-0.5">
            Your document is ready to download
          </p>
        </div>
      </div>

      {/* Rename */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Rename before download
        </p>
        {editing ? (
          <div className="flex gap-2">
            <input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveName();
                if (e.key === "Escape") setEditing(false);
              }}
              className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-white/20"
            />
            <span className="self-center text-sm text-muted-foreground font-mono">
              .docx
            </span>
            <button
              onClick={handleSaveName}
              className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm transition-colors"
            >
              Save
            </button>
          </div>
        ) : (
          <div
            onClick={() => {
              setEditValue(name);
              setEditing(true);
            }}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <span className="text-sm font-mono text-foreground">
              {name}
              <span className="text-muted-foreground">.docx</span>
            </span>
            <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>

      {/* Download cards */}
      <div className="grid grid-cols-2 gap-3">
        <DownloadCard
          icon={<FileText className="w-5 h-5" />}
          label="Word Document"
          ext=".docx"
          name={name}
          size={result.docxSize}
          color="blue"
          loading={downloading === "docx"}
          onClick={() => handleDownload("docx")}
        />
        <DownloadCard
          icon={<FileType className="w-5 h-5" />}
          label="PDF"
          ext=".pdf"
          name={name}
          size={result.pdfSize}
          color="red"
          available={result.pdfAvailable}
          unavailableReason={result.pdfError || undefined}
          loading={downloading === "pdf"}
          onClick={() => result.pdfAvailable && handleDownload("pdf")}
        />
      </div>

      {/* Download all */}
      <button
        onClick={() => handleDownload("zip")}
        disabled={downloading === "zip"}
        className={cn(
          "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors text-sm font-medium",
          downloading === "zip" && "opacity-60 cursor-not-allowed"
        )}
      >
        <Archive className="w-4 h-4" />
        {downloading === "zip" ? "Preparing ZIP..." : "Download all as ZIP"}
      </button>
    </div>
  );
}

interface DownloadCardProps {
  icon: React.ReactNode;
  label: string;
  ext: string;
  name: string;
  size: number | null;
  color: "blue" | "red";
  available?: boolean;
  unavailableReason?: string;
  loading: boolean;
  onClick: () => void;
}

function DownloadCard({
  icon,
  label,
  ext,
  name,
  size,
  color,
  available = true,
  unavailableReason,
  loading,
  onClick,
}: DownloadCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 flex flex-col gap-3",
        available ? "border-border" : "border-border opacity-60"
      )}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            color === "blue" ? "bg-blue-500/15 text-blue-400" : "bg-red-500/15 text-red-400"
          )}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          {size && (
            <p className="text-xs text-muted-foreground">{formatBytes(size)}</p>
          )}
        </div>
      </div>

      <p className="text-xs font-mono text-muted-foreground truncate">
        {name}
        {ext}
      </p>

      {!available && unavailableReason ? (
        <div className="text-xs text-amber-400/80 bg-amber-500/5 border border-amber-500/20 rounded-lg px-2.5 py-2">
          ⚠ PDF conversion unavailable
        </div>
      ) : (
        <button
          onClick={onClick}
          disabled={loading || !available}
          className={cn(
            "flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium transition-all",
            color === "blue"
              ? "bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/20"
              : "bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/20",
            (loading || !available) && "opacity-60 cursor-not-allowed"
          )}
        >
          <Download className="w-3.5 h-3.5" />
          {loading ? "Downloading..." : "Download"}
        </button>
      )}
    </div>
  );
}
