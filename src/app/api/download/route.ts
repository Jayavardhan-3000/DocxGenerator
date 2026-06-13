import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { jobStore } from "@/lib/jobStore";
import { cleanupNow } from "@/lib/cleanup";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");
  const type = searchParams.get("type") as "docx" | "pdf" | "zip" | null;
  const customName = searchParams.get("name");

  if (!jobId || !type) {
    return NextResponse.json({ error: "Missing jobId or type" }, { status: 400 });
  }

  const job = await jobStore.get(jobId);
  if (!job) {
    return NextResponse.json(
      { error: "Job not found or expired. Please re-upload your script." },
      { status: 404 }
    );
  }

  const baseName = customName
    ? customName.replace(/\.docx$|\.pdf$|\.zip$/, "")
    : path.basename(job.filename, ".docx");

  try {
    if (type === "docx") {
      let buffer: Buffer;

      // On Vercel: reconstruct from base64 stored in KV
      if (job.docxBase64) {
        buffer = Buffer.from(job.docxBase64, "base64");
      } else if (job.docxPath && fs.existsSync(job.docxPath)) {
        buffer = fs.readFileSync(job.docxPath);
      } else {
        return NextResponse.json({ error: "DOCX file not found" }, { status: 404 });
      }

      // Clean up after download
      if (job.docxPath) {
        try { cleanupNow(job.workDir); } catch {}
      }
      await jobStore.delete(jobId);

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${baseName}.docx"`,
          "Content-Length": buffer.length.toString(),
        },
      });
    }

    if (type === "pdf") {
      return NextResponse.json({ error: "PDF not available" }, { status: 404 });
    }

    if (type === "zip") {
      // ZIP = just DOCX on Vercel (no PDF)
      let buffer: Buffer;
      if (job.docxBase64) {
        buffer = Buffer.from(job.docxBase64, "base64");
      } else if (job.docxPath && fs.existsSync(job.docxPath)) {
        buffer = fs.readFileSync(job.docxPath);
      } else {
        return NextResponse.json({ error: "DOCX file not found" }, { status: 404 });
      }

      // Return DOCX directly when there's nothing to zip alongside it
      await jobStore.delete(jobId);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${baseName}.docx"`,
          "Content-Length": buffer.length.toString(),
        },
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Download error:", error);
    return NextResponse.json({ error: error.message || "Download failed" }, { status: 500 });
  }
}
