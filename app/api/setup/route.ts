import path from "path";

import { NextRequest, NextResponse } from "next/server";

import { invalidateConfigCache } from "@/lib/config";
import { getMissingCoreEnvKeys } from "@/lib/env-status";
import {
  mergeEnvLocal,
  SETUP_ENV_KEYS,
  validateVaultPathForSetup,
  type SetupEnvKey,
} from "@/lib/merge-env-local";

function setupApiAllowed(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.SETUP_WIZARD_ENABLED === "true";
}

function isLocalhost(req: NextRequest): boolean {
  const host = req.headers.get("host") ?? "";
  return (
    host.startsWith("localhost:") ||
    host === "localhost" ||
    host.startsWith("127.0.0.1:")
  );
}

export async function GET() {
  if (!setupApiAllowed()) {
    return NextResponse.json({ error: "Setup API disabled" }, { status: 403 });
  }
  return NextResponse.json({
    allowedKeys: SETUP_ENV_KEYS,
    missingCore: getMissingCoreEnvKeys(),
  });
}

export async function POST(req: NextRequest) {
  if (!setupApiAllowed()) {
    return NextResponse.json({ error: "Setup API disabled" }, { status: 403 });
  }
  if (process.env.NODE_ENV === "production" && !isLocalhost(req)) {
    return NextResponse.json(
      { error: "Setup is only allowed from localhost in production" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Expected JSON object" }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const updates: Partial<Record<SetupEnvKey, string>> = {};

  for (const key of SETUP_ENV_KEYS) {
    const v = record[key];
    if (typeof v === "string" && v.trim() !== "") {
      updates[key] = v.trim();
    }
  }

  const vaultErr = updates.OBSIDIAN_VAULT_PATH
    ? validateVaultPathForSetup(updates.OBSIDIAN_VAULT_PATH)
    : null;
  if (vaultErr) {
    return NextResponse.json({ error: vaultErr }, { status: 400 });
  }

  const projectRoot = process.cwd();
  const envPath = path.join(projectRoot, ".env.local");
  try {
    mergeEnvLocal(projectRoot, updates);
    invalidateConfigCache();
  } catch (e) {
    console.error("[setup] write failed", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Write failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    wrote: envPath,
    message:
      "Saved. Restart the dev server (Ctrl+C then npm run dev) so Next.js reloads environment variables.",
  });
}
