import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { readSettingsFromCookies, settingsCookies, validateSettingsPatch } from "@/lib/settings";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(readSettingsFromCookies());
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  const patch = {
    aiProvider: body.aiProvider,
    aiMode: body.aiMode,
    anthropicModel: body.anthropicModel,
    openaiModel: body.openaiModel,
  } as any;

  const validated = validateSettingsPatch(patch);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const res = NextResponse.json({ success: true });
  const opts = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  };

  if (validated.value.aiProvider) {
    res.cookies.set(settingsCookies.provider, validated.value.aiProvider, opts);
  }
  if (validated.value.aiMode) {
    res.cookies.set(settingsCookies.aiMode, validated.value.aiMode, opts);
  }
  if (validated.value.anthropicModel) {
    res.cookies.set(settingsCookies.anthropicModel, validated.value.anthropicModel, opts);
  }
  if (validated.value.openaiModel) {
    res.cookies.set(settingsCookies.openaiModel, validated.value.openaiModel, opts);
  }

  return res;
}

