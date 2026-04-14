import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getConfig } from "@/lib/config";
import { interpretCommand } from "@/lib/ai/prompts/command";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const config = getConfig();
  if (config.demoMode) {
    return NextResponse.json(
      { error: "Writes disabled in demo mode" },
      { status: 403 },
    );
  }

  const body = (await request.json()) as Record<string, unknown>;
  const command = typeof body.command === "string" ? body.command.trim() : "";
  if (!command) {
    return NextResponse.json({ error: "command is required" }, { status: 400 });
  }

  try {
    const result = await interpretCommand(command);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

