import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getConfig } from "@/lib/config";
import { MOCK_EMAIL_THREADS } from "@/lib/mock-data";
import { processEmailThread } from "@/lib/ai/prompts/email";
import { fetchInboxThreads, fetchThreadBody } from "@/lib/gmail";

async function processInBatches<T>(
  items: T[],
  processor: (item: T) => Promise<T>,
  batchSize = 3,
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch.map(processor));
    results.push(
      ...batchResults.map((r, idx) =>
        r.status === "fulfilled" ? r.value : batch[idx]!,
      ),
    );
  }
  return results;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = getConfig();
  const { searchParams } = new URL(request.url);
  const rawOnly = searchParams.get("rawOnly") === "true";

  if (config.demoMode) {
    const threads = rawOnly
      ? MOCK_EMAIL_THREADS.map(({ summary, urgency, category, draftReply, ...t }) => t)
      : MOCK_EMAIL_THREADS;
    return NextResponse.json(
      { threads },
      {
        headers: {
          "Cache-Control": "private, max-age=0, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  }

  try {
    const rawThreads = await fetchInboxThreads(session.accessToken, 10);

    if (rawOnly) {
      return NextResponse.json(
        { threads: rawThreads },
        {
          headers: {
            "Cache-Control": "private, max-age=0, s-maxage=60, stale-while-revalidate=120",
          },
        },
      );
    }

    const threads = await processInBatches(
      rawThreads,
      async (thread) => {
        try {
          const body = await fetchThreadBody(session.accessToken!, thread.id);
          const aiData = await processEmailThread(thread, body);
          return { ...thread, ...aiData };
        } catch (error) {
          console.error(`AI processing failed for thread ${thread.id}:`, error);
          return thread;
        }
      },
      3,
    );

    return NextResponse.json(
      { threads },
      {
        headers: {
          "Cache-Control": "private, max-age=0, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    console.error("Gmail fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Gmail threads" },
      { status: 500 },
    );
  }
}
