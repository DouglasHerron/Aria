import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type CacheEntry<T> = {
  value: T;
  createdAt: number;
  expiresAt: number;
};

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function getCacheDir(): string {
  // Local dev: prefer repo-local cache. On serverless, fall back to /tmp.
  return process.env.VERCEL ? "/tmp/aria-ai" : path.join(process.cwd(), ".cache", "aria-ai");
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeJson<T>(filePath: string, data: T): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(data), "utf8");
}

export function makeCacheKey(input: unknown): string {
  return sha256(JSON.stringify(input));
}

export async function getCachedText(options: {
  namespace: string;
  key: string;
}): Promise<string | null> {
  const dir = getCacheDir();
  const filePath = path.join(dir, options.namespace, `${options.key}.json`);
  const entry = await readJson<CacheEntry<string>>(filePath);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) return null;
  return entry.value;
}

export async function setCachedText(options: {
  namespace: string;
  key: string;
  value: string;
  ttlMs: number;
}): Promise<void> {
  const dir = getCacheDir();
  const filePath = path.join(dir, options.namespace, `${options.key}.json`);
  const now = Date.now();
  const entry: CacheEntry<string> = {
    value: options.value,
    createdAt: now,
    expiresAt: now + options.ttlMs,
  };
  await writeJson(filePath, entry);
}

