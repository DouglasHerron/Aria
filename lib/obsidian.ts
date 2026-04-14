import fs from "fs";
import path from "path";

import matter from "gray-matter";

import { getConfig } from "@/lib/config";
import { ObsidianVaultConfigurationError } from "@/lib/obsidian-vault-error";
import type { ObsidianNote, ObsidianTask } from "@/types";

function vaultRoot(): string {
  const root = getConfig().obsidianVaultPath.trim();
  if (!root) {
    throw new ObsidianVaultConfigurationError(
      "Set OBSIDIAN_VAULT_PATH in .env.local (or /setup) to your Obsidian vault root directory.",
    );
  }
  if (!fs.existsSync(root)) {
    throw new ObsidianVaultConfigurationError(
      `Obsidian vault path does not exist: ${root}`,
    );
  }
  if (!fs.statSync(root).isDirectory()) {
    throw new ObsidianVaultConfigurationError(
      `OBSIDIAN_VAULT_PATH must be a directory: ${root}`,
    );
  }
  return root;
}

function normalizeTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map(String);
  }
  if (typeof raw === "string") {
    return raw
      .split(/[,\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

function stringifyMetaDate(raw: unknown, fallback: string): string {
  if (raw instanceof Date) {
    return raw.toISOString();
  }
  if (typeof raw === "string" || typeof raw === "number") {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return fallback;
}

export function readAllTasks(): ObsidianTask[] {
  const VAULT = vaultRoot();
  const markdownFiles = getAllMarkdownFiles(VAULT);
  const tasks: ObsidianTask[] = [];

  for (const filePath of markdownFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    lines.forEach((line, lineNumber) => {
      const taskMatch = line.match(/^(\s*)-\s+\[([ x])\]\s+(.+)$/);
      if (!taskMatch) return;

      const [, , checkmark, text] = taskMatch;
      const completed = checkmark === "x";

      const dueDateMatch = text.match(/📅\s*(\d{4}-\d{2}-\d{2})/);
      const dueDate = dueDateMatch?.[1];

      const tags = Array.from(text.matchAll(/#([\w-]+)/g), (m) => m[1]);

      tasks.push({
        id: `${path.relative(VAULT, filePath)}:${lineNumber}`,
        text: text
          .replace(/📅\s*\d{4}-\d{2}-\d{2}/g, "")
          .replace(/#[\w-]+/g, "")
          .trim(),
        completed,
        filePath: path.relative(VAULT, filePath),
        lineNumber,
        dueDate,
        tags,
      });
    });
  }

  return tasks
    .filter((t) => !t.completed)
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });
}

export function readRecentNotes(limit = 10): ObsidianNote[] {
  const VAULT = vaultRoot();
  const markdownFiles = getAllMarkdownFiles(VAULT);

  return markdownFiles
    .map((filePath) => {
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, "utf-8");
      const { data: frontmatter, content: body } = matter(content);
      const relativePath = path.relative(VAULT, filePath);
      const folder = path.dirname(relativePath);

      return {
        path: relativePath,
        title:
          (typeof frontmatter.title === "string" && frontmatter.title) ||
          path.basename(filePath, ".md"),
        content: body.slice(0, 500),
        folder,
        created: stringifyMetaDate(
          frontmatter.created,
          stats.birthtime.toISOString(),
        ),
        modified: stats.mtime.toISOString(),
        tags: normalizeTags(frontmatter.tags),
      } satisfies ObsidianNote;
    })
    .sort((a, b) => b.modified.localeCompare(a.modified))
    .slice(0, limit);
}

export function searchNotes(query: string, limit = 20): ObsidianNote[] {
  const VAULT = vaultRoot();
  const markdownFiles = getAllMarkdownFiles(VAULT);
  const lowerQuery = query.toLowerCase();

  return markdownFiles
    .filter((filePath) => {
      const content = fs.readFileSync(filePath, "utf-8").toLowerCase();
      return content.includes(lowerQuery);
    })
    .map((filePath) => {
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, "utf-8");
      const { data: frontmatter, content: body } = matter(content);
      const relativePath = path.relative(VAULT, filePath);

      return {
        path: relativePath,
        title:
          (typeof frontmatter.title === "string" && frontmatter.title) ||
          path.basename(filePath, ".md"),
        content: body.slice(0, 500),
        folder: path.dirname(relativePath),
        created: stringifyMetaDate(
          frontmatter.created,
          stats.birthtime.toISOString(),
        ),
        modified: stats.mtime.toISOString(),
        tags: normalizeTags(frontmatter.tags),
      } satisfies ObsidianNote;
    })
    .slice(0, limit);
}

function getAllMarkdownFiles(dir: string): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllMarkdownFiles(fullPath));
    } else if (entry.name.endsWith(".md")) {
      results.push(fullPath);
    }
  }

  return results;
}

function resolveSafeVaultPath(relativePath: string): string {
  const VAULT = vaultRoot();
  const resolved = path.resolve(VAULT, relativePath);
  const root = path.resolve(VAULT);
  if (
    resolved !== root &&
    !resolved.startsWith(root + path.sep)
  ) {
    throw new Error("Path escapes vault");
  }
  return resolved;
}

export function markTaskComplete(filePath: string, lineNumber: number): void {
  const absolutePath = resolveSafeVaultPath(filePath);
  const content = fs.readFileSync(absolutePath, "utf-8");
  const lines = content.split("\n");

  const line = lines[lineNumber];
  if (line === undefined) {
    throw new Error(`Line ${lineNumber} not found in ${filePath}`);
  }

  const today = new Date().toISOString().split("T")[0]!;
  lines[lineNumber] =
    line.replace(/- \[ \]/, "- [x]").trimEnd() + ` ✅ ${today}`;

  fs.writeFileSync(absolutePath, lines.join("\n"), "utf-8");
}

export function createTask(
  text: string,
  options: {
    targetFile?: string;
    dueDate?: string;
    tags?: string[];
  } = {},
): { filePath: string; lineNumber: number } {
  const targetFile = options.targetFile ?? "Tasks/Inbox.md";
  const absolutePath = resolveSafeVaultPath(targetFile);

  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  if (!fs.existsSync(absolutePath)) {
    fs.writeFileSync(absolutePath, "# Inbox\n\n", "utf-8");
  }

  const duePart = options.dueDate ? ` 📅 ${options.dueDate}` : "";
  const tagPart = options.tags?.length
    ? ` ${options.tags.map((t) => `#${t}`).join(" ")}`
    : "";
  const taskLine = `- [ ] ${text}${duePart}${tagPart}`;

  const fileContent = fs.readFileSync(absolutePath, "utf-8");
  const lines = fileContent.split("\n");
  lines.push(taskLine);
  fs.writeFileSync(absolutePath, lines.join("\n"), "utf-8");

  return { filePath: targetFile, lineNumber: lines.length - 1 };
}

export function createNote(
  title: string,
  content: string,
  options: {
    folder?: string;
    tags?: string[];
  } = {},
): { path: string } {
  const folder = options.folder ?? "Notes";
  const slug = title
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  const filename = `${slug || "Untitled"}.md`;
  const relativePath = path.join(folder, filename);
  const absolutePath = resolveSafeVaultPath(relativePath);

  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });

  const today = new Date().toISOString().split("T")[0]!;
  const tagYaml =
    (options.tags ?? []).length > 0
      ? (options.tags ?? []).map((t) => JSON.stringify(t)).join(", ")
      : "";
  const frontmatter = [
    "---",
    `title: ${JSON.stringify(title)}`,
    `created: ${today}`,
    `tags: [${tagYaml}]`,
    "---",
    "",
  ].join("\n");

  fs.writeFileSync(absolutePath, frontmatter + content, "utf-8");

  return { path: relativePath };
}

