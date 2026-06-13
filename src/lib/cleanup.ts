import * as fs from "fs";
import * as path from "path";

const CLEANUP_AFTER_MS = 10 * 60 * 1000; // 10 minutes

// Track temp dirs for cleanup
const pendingCleanup = new Map<string, ReturnType<typeof setTimeout>>();

export function scheduleCleanup(dirPath: string, delayMs = CLEANUP_AFTER_MS) {
  // Cancel any existing timer for this dir
  if (pendingCleanup.has(dirPath)) {
    clearTimeout(pendingCleanup.get(dirPath)!);
  }

  const timer = setTimeout(() => {
    cleanupDir(dirPath);
    pendingCleanup.delete(dirPath);
  }, delayMs);

  pendingCleanup.set(dirPath, timer);
}

export function cleanupNow(dirPath: string) {
  if (pendingCleanup.has(dirPath)) {
    clearTimeout(pendingCleanup.get(dirPath)!);
    pendingCleanup.delete(dirPath);
  }
  cleanupDir(dirPath);
}

function cleanupDir(dirPath: string) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch (err) {
    console.warn(`Cleanup failed for ${dirPath}:`, err);
  }
}

export function createWorkDir(): string {
  const tmpBase = require("os").tmpdir();
  const workDir = path.join(tmpBase, `cdr_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  fs.mkdirSync(workDir, { recursive: true });
  return workDir;
}
