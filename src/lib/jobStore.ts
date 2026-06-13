// Vercel KV-backed job store.
// Falls back to a local file-based store when running locally (no KV env vars).
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface JobEntry {
  workDir: string;
  docxPath: string | null;
  pdfPath: string | null;
  filename: string;
  createdAt: number;
  // On Vercel we store the file as base64 inside KV (files don't persist on serverless)
  docxBase64?: string;
}

// ── Vercel KV helpers ────────────────────────────────────────────────────────
// Imported lazily so the app still works locally without @vercel/kv installed.

async function kvSet(jobId: string, entry: JobEntry) {
  const { kv } = await import("@vercel/kv");
  await kv.set(`cdr:${jobId}`, JSON.stringify(entry), { ex: 600 }); // 10 min TTL
}

async function kvGet(jobId: string): Promise<JobEntry | undefined> {
  const { kv } = await import("@vercel/kv");
  const raw = await kv.get<string>(`cdr:${jobId}`);
  if (!raw) return undefined;
  return JSON.parse(raw) as JobEntry;
}

async function kvDel(jobId: string) {
  const { kv } = await import("@vercel/kv");
  await kv.del(`cdr:${jobId}`);
}

// ── Local file-based fallback ────────────────────────────────────────────────
const STORE_DIR = path.join(os.tmpdir(), "cdr_jobs");

function ensureStoreDir() {
  if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
}

function localSet(jobId: string, entry: JobEntry) {
  ensureStoreDir();
  fs.writeFileSync(path.join(STORE_DIR, `${jobId}.json`), JSON.stringify(entry), "utf-8");
}

function localGet(jobId: string): JobEntry | undefined {
  ensureStoreDir();
  const file = path.join(STORE_DIR, `${jobId}.json`);
  if (!fs.existsSync(file)) return undefined;
  try { return JSON.parse(fs.readFileSync(file, "utf-8")) as JobEntry; } catch { return undefined; }
}

function localDel(jobId: string) {
  const file = path.join(STORE_DIR, `${jobId}.json`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

// ── Public API ───────────────────────────────────────────────────────────────
const isVercel = !!process.env.KV_REST_API_URL;

export const jobStore = {
  async set(jobId: string, entry: JobEntry) {
    if (isVercel) await kvSet(jobId, entry);
    else localSet(jobId, entry);
  },

  async get(jobId: string): Promise<JobEntry | undefined> {
    if (isVercel) return kvGet(jobId);
    return localGet(jobId);
  },

  async delete(jobId: string) {
    if (isVercel) await kvDel(jobId);
    else localDel(jobId);
  },
};
