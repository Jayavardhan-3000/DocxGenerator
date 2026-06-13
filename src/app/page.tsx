"use client";

import { useState, useCallback, useEffect } from "react";
import { FileCode, ArrowLeft, Sparkles } from "lucide-react";
import { DropZone } from "@/components/DropZone";
import { AnalysisCard } from "@/components/AnalysisCard";
import { ProgressSteps } from "@/components/ProgressSteps";
import { Terminal } from "@/components/Terminal";
import { DownloadCenter } from "@/components/DownloadCenter";
import { RecentFiles } from "@/components/RecentFiles";
import { ErrorCard } from "@/components/ErrorCard";
import {
  ProcessingStep,
  StepState,
  UploadResponse,
  RecentFile,
  ScriptAnalysis,
} from "@/lib/types";
import { formatBytes } from "@/lib/utils";

const STEP_DEFS: { id: ProcessingStep; label: string }[] = [
  { id: "upload", label: "File uploaded" },
  { id: "analyze", label: "Script analyzed" },
  { id: "patch", label: "Claude output path repaired" },
  { id: "execute", label: "Executing JavaScript" },
  { id: "docx", label: "DOCX generated" },
  { id: "pdf", label: "PDF converted" },
];

type Phase = "idle" | "processing" | "done" | "error";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const LOCAL_STORAGE_KEY = "cdr_recent_v2";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [steps, setSteps] = useState<StepState[]>(
    STEP_DEFS.map((s) => ({ ...s, status: "pending" }))
  );
  const [logs, setLogs] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<ScriptAnalysis | null>(null);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorLogs, setErrorLogs] = useState<string[]>([]);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem(LOCAL_STORAGE_KEY) || "[]"
      );
      setRecentFiles(stored.slice(0, 5));
    } catch {}
  }, []);

  const setStepStatus = useCallback(
    (id: ProcessingStep, status: StepState["status"]) => {
      setSteps((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status } : s))
      );
    },
    []
  );

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, msg]);
  }, []);

  const reset = useCallback(() => {
    setPhase("idle");
    setFile(null);
    setSteps(STEP_DEFS.map((s) => ({ ...s, status: "pending" })));
    setLogs([]);
    setAnalysis(null);
    setResult(null);
    setError(null);
    setErrorLogs([]);
  }, []);

  const processFile = useCallback(
    async (f: File) => {
      setFile(f);
      setPhase("processing");
      setLogs([]);
      setSteps(STEP_DEFS.map((s) => ({ ...s, status: "pending" })));

      addLog(`Reading ${f.name} (${formatBytes(f.size)})...`);

      // Step 1: Upload (immediate)
      setStepStatus("upload", "running");
      await sleep(200);
      setStepStatus("upload", "done");
      addLog("File received.");

      // Step 2: Analyze (client-side preview while uploading)
      setStepStatus("analyze", "running");
      addLog("Analyzing script structure...");

      const code = await f.text();

      // Quick client-side analysis for immediate feedback
      const quickAnalysis = quickAnalyzeScript(code);
      setAnalysis(quickAnalysis);
      addLog(
        `Found ${quickAnalysis.headings} headings, ${quickAnalysis.paragraphs} paragraphs, ${quickAnalysis.tables} tables`
      );
      setStepStatus("analyze", "done");

      // Step 3: Patch
      setStepStatus("patch", "running");
      if (quickAnalysis.claudePath) {
        addLog(`Detected Claude output path: ${quickAnalysis.claudePath}`);
        addLog("Patching path to temp directory...");
      } else {
        addLog("No Claude-specific paths detected.");
      }
      await sleep(300);
      setStepStatus("patch", "done");
      addLog("Output path configured.");

      // Step 4: Execute (server round-trip)
      setStepStatus("execute", "running");
      addLog("Sending script to execution engine...");

      try {
        const formData = new FormData();
        formData.append("file", f);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data: UploadResponse = await response.json();

        if (!response.ok || data.error) {
          throw new Error(data.error || `Server error: ${response.status}`);
        }

        // Add server logs
        for (const log of data.logs || []) {
          addLog(log);
        }

        setStepStatus("execute", "done");
        addLog("Script executed successfully.");

        // Step 5: DOCX
        setStepStatus("docx", "running");
        await sleep(200);
        addLog(`DOCX created: ${data.filename} (${formatBytes(data.docxSize)})`);
        setStepStatus("docx", "done");

        // Step 6: PDF
        setStepStatus("pdf", "running");
        await sleep(200);
        if (data.pdfAvailable) {
          addLog(`PDF created (${formatBytes(data.pdfSize ?? 0)})`);
          setStepStatus("pdf", "done");
        } else {
          addLog(`PDF conversion skipped: ${data.pdfError}`);
          setStepStatus("pdf", "done");
        }

        addLog(`✓ Complete in ${(data.durationMs / 1000).toFixed(2)}s`);

        setResult(data);
        setAnalysis(data.analysis);
        setPhase("done");

        // Save to recent files
        const entry: RecentFile = {
          jobId: data.jobId,
          filename: data.filename,
          docxSize: data.docxSize,
          pdfAvailable: data.pdfAvailable,
          generatedAt: new Date().toISOString(),
        };
        try {
          const prev = JSON.parse(
            localStorage.getItem(LOCAL_STORAGE_KEY) || "[]"
          ) as RecentFile[];
          const updated = [
            entry,
            ...prev.filter((r) => r.jobId !== entry.jobId),
          ].slice(0, 5);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
          setRecentFiles(updated);
        } catch {}
      } catch (err: unknown) {
        const e = err as Error;
        setStepStatus("execute", "error");
        setError(e.message || "Script execution failed");
        setErrorLogs(logs);
        addLog(`Error: ${e.message}`);
        setPhase("error");
      }
    },
    [addLog, setStepStatus, logs]
  );

  const handleDownload = useCallback(
    async (type: "docx" | "pdf" | "zip", name: string) => {
      if (!result) return;
      const params = new URLSearchParams({ jobId: result.jobId, type, name });
      window.location.href = `/api/download?${params}`;
    },
    [result]
  );

  const handleRecentDownload = useCallback(
    (file: RecentFile, type: "docx" | "pdf") => {
      const name = (file.customName || file.filename).replace(/\.docx$/, "");
      const params = new URLSearchParams({ jobId: file.jobId, type, name });
      window.location.href = `/api/download?${params}`;
    },
    []
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
              <FileCode className="w-4 h-4 text-white/80" />
            </div>
            <h1 className="text-lg font-medium">Claude Doc Recovery</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Recover Word documents that Claude couldn't finish generating.
          </p>
        </div>

        {/* Main content */}
        {phase === "idle" && (
          <div className="space-y-8">
            <DropZone onFile={processFile} />
            <RecentFiles files={recentFiles} onDownload={handleRecentDownload} />
          </div>
        )}

        {(phase === "processing" || phase === "done" || phase === "error") && (
          <div className="space-y-3">
            {/* File info */}
            {file && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border">
                <FileCode className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium flex-1 truncate">
                  {file.name}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatBytes(file.size)}
                </span>
              </div>
            )}

            {/* Analysis */}
            {analysis && phase !== "error" && (
              <AnalysisCard analysis={analysis} filename={file?.name || ""} />
            )}

            {/* Steps */}
            <ProgressSteps steps={steps} />

            {/* Result */}
            {phase === "done" && result && (
              <DownloadCenter
                result={result}
                initialName={result.filename.replace(".docx", "")}
                onDownload={handleDownload}
              />
            )}

            {/* Error */}
            {phase === "error" && error && (
              <ErrorCard error={error} logs={errorLogs} onRetry={reset} />
            )}

            {/* Terminal */}
            <Terminal logs={logs} defaultOpen={phase === "error"} />

            {/* Back button */}
            <button
              onClick={reset}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Start over
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="w-3 h-3" />
          <span>Built for Claude users · Files auto-deleted after 10 minutes</span>
        </div>
      </div>
    </div>
  );
}

// Client-side analysis (mirrors server-side for instant feedback)
function quickAnalyzeScript(code: string): ScriptAnalysis {
  const usesDocx =
    /require\s*\(\s*['"]docx['"]\s*\)|from\s+['"]docx['"]/i.test(code);
  const hasPacker = /Packer\s*\./i.test(code);

  const fileMatches = [
    ...code.matchAll(/['"]([^'"]*?([A-Za-z0-9_\-. ]+\.docx))['"]/gi),
  ];
  let outputFile: string | null = null;
  let claudePath: string | null = null;

  if (fileMatches.length > 0) {
    const fullPath = fileMatches[0][1];
    outputFile =
      fileMatches[0][2] || fullPath.split("/").pop() || null;
    if (
      /\/mnt\/user-data|\/tmp\/sandbox|\/home\/sandbox|\/outputs\//i.test(
        fullPath
      )
    ) {
      claudePath = fullPath;
    }
  }

  const headings = (code.match(/HeadingLevel\.|new\s+Heading\b/gi) || [])
    .length;
  const tables = (code.match(/new\s+Table\b/gi) || []).length;
  const images = (code.match(/new\s+ImageRun\b/gi) || []).length;
  const codeBlocks = (
    code.match(/font.*Courier|CodeBlock|monospace/gi) || []
  ).length;
  const paragraphs = (code.match(/new\s+Paragraph\b/gi) || []).length;

  return {
    usesDocx,
    hasPacker,
    outputFile,
    outputDir: null,
    claudePath,
    headings,
    tables,
    images,
    codeBlocks,
    paragraphs,
    estimatedPages: Math.max(1, Math.ceil(paragraphs / 8)),
    isValid: usesDocx && hasPacker,
    errors: [],
  };
}
