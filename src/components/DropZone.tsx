"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function DropZone({ onFile, disabled }: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith(".js") || file.name.endsWith(".cjs"))) {
        onFile(file);
      }
    },
    [onFile, disabled]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => e.key === "Enter" && !disabled && inputRef.current?.click()}
      aria-label="Upload JavaScript file"
      className={cn(
        "relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 select-none",
        dragOver
          ? "border-white/30 bg-white/5"
          : "border-border hover:border-white/20 hover:bg-white/[0.02]",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".js,.cjs"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />

      <div className="flex flex-col items-center gap-4">
        <div className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
          dragOver ? "bg-white/10" : "bg-secondary"
        )}>
          {dragOver ? (
            <FileCode className="w-7 h-7 text-white/70" />
          ) : (
            <Upload className="w-7 h-7 text-muted-foreground" />
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-foreground mb-1">
            {dragOver ? "Drop to recover" : "Drop your JavaScript file here"}
          </p>
          <p className="text-sm text-muted-foreground">
            Scripts from Claude using the <code className="text-xs bg-secondary px-1.5 py-0.5 rounded font-mono">docx</code> package
          </p>
        </div>

        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-muted-foreground bg-secondary border border-border rounded-md px-3 py-1.5 font-mono">
            .js
          </span>
          <span className="text-xs text-muted-foreground bg-secondary border border-border rounded-md px-3 py-1.5 font-mono">
            .cjs
          </span>
        </div>
      </div>
    </div>
  );
}
