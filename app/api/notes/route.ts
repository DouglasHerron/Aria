import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getConfig } from "@/lib/config";
import { ObsidianVaultConfigurationError } from "@/lib/obsidian-vault-error";
import { MOCK_NOTES } from "@/lib/mock-data";
import { createNote, readRecentNotes, searchNotes } from "@/lib/obsidian";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = getConfig();
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (config.demoMode) {
    const q = query?.trim().toLowerCase();
    const notes = q
      ? MOCK_NOTES.filter((n) => {
          const haystack = `${n.title}\n${n.content}\n${n.folder}\n${(n.tags ?? []).join(" ")}`.toLowerCase();
          return haystack.includes(q);
        })
      : MOCK_NOTES;
    return NextResponse.json({ notes });
  }

  try {
    const notes = query ? searchNotes(query) : readRecentNotes(10);
    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Obsidian notes error:", error);
    if (error instanceof ObsidianVaultConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Failed to read vault notes" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const configPost = getConfig();
  if (configPost.demoMode) {
    return NextResponse.json(
      { error: "Writes disabled in demo mode" },
      { status: 403 },
    );
  }

  const body = (await request.json()) as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const content =
    typeof body.content === "string" ? body.content : "";
  const folder =
    typeof body.folder === "string" ? body.folder : undefined;
  const tags = Array.isArray(body.tags)
    ? body.tags.filter((t): t is string => typeof t === "string")
    : undefined;

  try {
    const result = createNote(title, content ?? "", { folder, tags });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof ObsidianVaultConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
