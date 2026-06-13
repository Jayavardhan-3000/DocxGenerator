import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { analyzeScript, patchScript } from "@/lib/scriptPatcher";
import { executeScript, writeScriptToTemp } from "@/lib/scriptExecutor";
import { createWorkDir, scheduleCleanup } from "@/lib/cleanup";
import { jobStore } from "@/lib/jobStore";

const isVercel = !!process.env.KV_REST_API_URL;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!file.name.endsWith(".js") && !file.name.endsWith(".cjs")) {
      return NextResponse.json({ error: "Only .js and .cjs files are supported" }, { status: 400 });
    }

    const code = await file.text();
    const analysis = analyzeScript(code);

    if (!analysis.usesDocx) {
      return NextResponse.json(
        { error: "This script does not appear to use the 'docx' library" },
        { status: 422 }
      );
    }

    const workDir = createWorkDir();
    if (!isVercel) scheduleCleanup(workDir);

    const patchedCode = patchScript(code, workDir);
    const scriptPath = await writeScriptToTemp(patchedCode, workDir);
    const execResult = await executeScript(scriptPath, workDir);

    if (!execResult.success || !execResult.outputPath) {
      return NextResponse.json(
        { error: execResult.error || "Script execution failed", logs: execResult.logs, analysis },
        { status: 422 }
      );
    }

    const jobId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const filename = path.basename(execResult.outputPath);
    const docxSize = fs.statSync(execResult.outputPath).size;

    // On Vercel: read file into base64 and store in KV (filesystem is ephemeral)
    // Locally: just store the path
    let docxBase64: string | undefined;
    if (isVercel) {
      docxBase64 = fs.readFileSync(execResult.outputPath).toString("base64");
    }

    await jobStore.set(jobId, {
      workDir,
      docxPath: execResult.outputPath,
      pdfPath: null,
      filename,
      createdAt: Date.now(),
      docxBase64,
    });

    return NextResponse.json({
      success: true,
      jobId,
      filename,
      docxSize,
      pdfAvailable: false,
      pdfSize: null,
      pdfError: isVercel ? "PDF conversion not available on Vercel" : "LibreOffice not installed",
      logs: execResult.logs,
      durationMs: execResult.durationMs,
      analysis,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Upload handler error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
