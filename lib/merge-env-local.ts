import fs from "fs";
import path from "path";

/** Keys the setup wizard may write (must match .env.example semantics). */
export const SETUP_ENV_KEYS = [
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "AI_PROVIDER",
  "AI_MODE",
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_MODEL",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "OLLAMA_BASE_URL",
  "OLLAMA_MODEL",
  "OBSIDIAN_VAULT_PATH",
  "OBSIDIAN_REST_API_PORT",
  "OBSIDIAN_REST_API_KEY",
  "APPLE_CALDAV_USERNAME",
  "APPLE_CALDAV_PASSWORD",
  "APPLE_CALDAV_URL",
  "DEMO_MODE",
  "ARIA_USER_NAME",
  "ARIA_USER_CONTEXT",
  "SETUP_WIZARD_ENABLED",
] as const;

export type SetupEnvKey = (typeof SETUP_ENV_KEYS)[number];

const KEY_SET = new Set<string>(SETUP_ENV_KEYS);

function formatEnvLine(key: string, value: string): string {
  if (/[\r\n]/.test(value)) {
    throw new Error(`Value for ${key} must not contain line breaks`);
  }
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `${key}="${escaped}"`;
}

function parseLineKey(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const exportStripped = trimmed.startsWith("export ")
    ? trimmed.slice(7).trim()
    : trimmed;
  const eq = exportStripped.indexOf("=");
  if (eq <= 0) return null;
  return exportStripped.slice(0, eq).trim();
}

/**
 * Merge updates into `.env.local` at project root. Unknown lines are preserved.
 */
export function mergeEnvLocal(
  projectRoot: string,
  updates: Partial<Record<SetupEnvKey, string>>,
): void {
  const target = path.join(projectRoot, ".env.local");
  const incoming: Record<string, string> = {};
  for (const [k, v] of Object.entries(updates)) {
    if (v === undefined || v === "") continue;
    if (!KEY_SET.has(k)) continue;
    incoming[k] = v;
  }

  let lines: string[] = [];
  if (fs.existsSync(target)) {
    lines = fs.readFileSync(target, "utf-8").split(/\r?\n/);
  }

  const replaced = new Set<string>();
  const nextLines = lines.map((line) => {
    const key = parseLineKey(line);
    if (key && incoming[key] !== undefined) {
      replaced.add(key);
      return formatEnvLine(key, incoming[key]!);
    }
    return line;
  });

  for (const key of Object.keys(incoming)) {
    if (!replaced.has(key)) {
      nextLines.push(formatEnvLine(key, incoming[key]!));
    }
  }

  const body = nextLines.join("\n").replace(/\n+$/, "") + "\n";
  const tmp = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, body, "utf-8");
  fs.renameSync(tmp, target);
}

export function validateVaultPathForSetup(raw: string): string | null {
  const v = raw.trim();
  if (!v) return "Vault path is required.";
  if (v.includes("\0")) return "Invalid path.";
  if (!path.isAbsolute(v)) {
    return "Use an absolute path to your vault (e.g. /Users/you/Obsidian or C:\\Users\\you\\Obsidian).";
  }
  const resolved = path.resolve(v);
  if (!fs.existsSync(resolved)) {
    return "That path does not exist yet. Create the folder or pick an existing vault.";
  }
  if (!fs.statSync(resolved).isDirectory()) {
    return "OBSIDIAN_VAULT_PATH must be a directory.";
  }
  return null;
}
