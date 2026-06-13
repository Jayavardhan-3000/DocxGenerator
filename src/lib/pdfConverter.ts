import * as fs from "fs";
import * as path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export interface ConversionResult {
  success: boolean;
  pdfPath: string | null;
  error: string | null;
}

export async function convertToPdf(
  docxPath: string,
  outputDir: string
): Promise<ConversionResult> {
  try {
    // Try LibreOffice first (most reliable)
    await execFileAsync(
      "libreoffice",
      ["--headless", "--convert-to", "pdf", "--outdir", outputDir, docxPath],
      { timeout: 60000 }
    );

    const baseName = path.basename(docxPath, ".docx");
    const pdfPath = path.join(outputDir, `${baseName}.pdf`);

    if (fs.existsSync(pdfPath)) {
      return { success: true, pdfPath, error: null };
    }

    return { success: false, pdfPath: null, error: "PDF file not found after conversion" };
  } catch {
    // Try soffice alias
    try {
      await execFileAsync(
        "soffice",
        ["--headless", "--convert-to", "pdf", "--outdir", outputDir, docxPath],
        { timeout: 60000 }
      );

      const baseName = path.basename(docxPath, ".docx");
      const pdfPath = path.join(outputDir, `${baseName}.pdf`);

      if (fs.existsSync(pdfPath)) {
        return { success: true, pdfPath, error: null };
      }
    } catch {
      // LibreOffice not available — fallback
    }

    return {
      success: false,
      pdfPath: null,
      error: "LibreOffice not available. Install it with: apt-get install libreoffice",
    };
  }
}
