import { execFile } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export interface ExecutionResult {
  success: boolean;
  outputPath: string | null;
  logs: string[];
  error: string | null;
  durationMs: number;
}

export async function executeScript(
  scriptPath: string,
  workDir: string,
  timeoutMs = 30000
): Promise<ExecutionResult> {
  const logs: string[] = [];
  const start = Date.now();

  try {
    const { stdout, stderr } = await execFileAsync(
      process.execPath, // node binary
      [scriptPath],
      {
        cwd: workDir,
        timeout: timeoutMs,
        env: {
          ...process.env,
          NODE_PATH: path.join(process.cwd(), "node_modules"),
        },
      }
    );

    if (stdout) logs.push(...stdout.split("\n").filter(Boolean));
    if (stderr) logs.push(...stderr.split("\n").filter(Boolean));

    // Find the generated .docx file in workDir
    const files = fs.readdirSync(workDir);
    const docxFile = files.find((f) => f.endsWith(".docx"));
    const outputPath = docxFile ? path.join(workDir, docxFile) : null;

    return {
      success: !!outputPath,
      outputPath,
      logs,
      error: outputPath ? null : "Script ran but no .docx file was created",
      durationMs: Date.now() - start,
    };
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException & { stdout?: string; stderr?: string; killed?: boolean };
    if (error.stdout) logs.push(...error.stdout.split("\n").filter(Boolean));
    if (error.stderr) logs.push(...error.stderr.split("\n").filter(Boolean));

    let errorMsg = "Script execution failed";
    if (error.killed) {
      errorMsg = `Execution timed out after ${timeoutMs / 1000}s`;
    } else if (error.message) {
      // Extract the useful part of the error
      const lines = error.message.split("\n");
      errorMsg = lines.find((l) => l.includes("Error:")) || lines[0] || errorMsg;
    }

    return {
      success: false,
      outputPath: null,
      logs,
      error: errorMsg,
      durationMs: Date.now() - start,
    };
  }
}

export async function writeScriptToTemp(
  code: string,
  workDir: string
): Promise<string> {
  const scriptPath = path.join(workDir, "_cdr_script.cjs");
  fs.writeFileSync(scriptPath, code, "utf-8");
  return scriptPath;
}
