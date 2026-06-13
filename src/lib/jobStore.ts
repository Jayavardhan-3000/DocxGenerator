import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface JobEntry {
  workDir: string;
  docxPath: string | null;
  pdfPath: string | null;
  filename: string;
  createdAt: number;
  docxBase64?: string;
}

// ── Upstash Redis helpers ────────────────────────────────────────────────────
async function kvSet(jobId: string, entry: JobEntry) {
  const { Redis } = await import("@upstash/redis");
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  await redis.set(`cdr:${jobId}`, JSON.stringify(entry), { ex: 600 });
}

async function kvGet(jobId: string): Promise<JobEntry | undefined> {
  const { Redis } = await import("@upstash/redis");
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  const raw = await redis.get<string>(`cdr:${jobId}`);
  if (!raw) return undefined;
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  return parsed as JobEntry;
}

async function kvDel(jobId: string) {
  const { Redis } = await import("@upstash/redis");
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  await redis.del(`cdr:${jobId}`);
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
const isVercel = !!process.env.UPSTASH_REDIS_REST_URL;

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
