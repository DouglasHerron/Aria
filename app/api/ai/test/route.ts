import { NextResponse } from "next/server";

import { getAI } from "@/lib/ai";

export async function GET() {
  try {
    const result = await getAI().complete({
      system: "You are a helpful assistant. Be very brief.",
      prompt: 'Say "ARIA AI service is working" and nothing else.',
      maxTokens: 50,
    });

    return NextResponse.json({
      success: true,
      provider: result.provider,
      model: result.model,
      text: result.text,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
