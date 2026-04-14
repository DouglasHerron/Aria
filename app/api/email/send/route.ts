import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getConfig } from "@/lib/config";
import { sendReply } from "@/lib/gmail";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const config = getConfig();
  if (config.demoMode) {
    return NextResponse.json(
      { error: "Writes disabled in demo mode" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const { to, subject, replyBody, threadId } = body as Record<
    string,
    unknown
  >;

  if (
    typeof to !== "string" ||
    typeof subject !== "string" ||
    typeof replyBody !== "string" ||
    typeof threadId !== "string"
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  try {
    await sendReply(session.accessToken, {
      to,
      subject: subject.startsWith("Re:") ? subject : `Re: ${subject}`,
      body: replyBody,
      threadId,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Gmail send error:", error);
    return NextResponse.json(
      { error: "Failed to send reply" },
      { status: 500 },
    );
  }
}
