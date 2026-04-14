import { google } from "googleapis";

import type { EmailThread } from "@/types";

export function getGmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth });
}

export async function fetchInboxThreads(
  accessToken: string,
  maxResults = 20,
): Promise<EmailThread[]> {
  const gmail = getGmailClient(accessToken);

  const listResponse = await gmail.users.threads.list({
    userId: "me",
    maxResults,
    q: "in:inbox -category:promotions -category:social",
  });

  const threads = listResponse.data.threads ?? [];

  const threadDetails = await Promise.all(
    threads.map((t) =>
      gmail.users.threads.get({
        userId: "me",
        id: t.id!,
        format: "metadata",
        metadataHeaders: ["Subject", "From", "Date"],
      }),
    ),
  );

  return threadDetails.map((response) => {
    const thread = response.data;
    const messages = thread.messages ?? [];
    const latestMessage = messages[messages.length - 1];
    const headers = latestMessage?.payload?.headers ?? [];

    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
        ?.value ?? "";

    const unread = messages.some((m) =>
      (m.labelIds ?? []).includes("UNREAD"),
    );

    return {
      id: thread.id!,
      subject: getHeader("Subject") || "(No subject)",
      from: getHeader("From"),
      snippet: latestMessage?.snippet ?? "",
      date: getHeader("Date"),
      unread,
    } satisfies EmailThread;
  });
}

function decodeGmailBase64(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  return Buffer.from(padded, "base64").toString("utf-8");
}

function extractTextFromPayload(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";

  const mimeType = (payload as { mimeType?: unknown }).mimeType;
  const body = (payload as { body?: unknown }).body;
  const parts = (payload as { parts?: unknown }).parts;

  if (mimeType === "text/plain") {
    const data = (body as { data?: unknown } | undefined)?.data;
    if (typeof data === "string" && data.trim()) {
      return decodeGmailBase64(data);
    }
  }

  if (Array.isArray(parts)) {
    for (const part of parts) {
      const text = extractTextFromPayload(part);
      if (text) return text;
    }
  }

  return "";
}

export async function fetchThreadBody(
  accessToken: string,
  threadId: string,
): Promise<string> {
  const gmail = getGmailClient(accessToken);

  const response = await gmail.users.threads.get({
    userId: "me",
    id: threadId,
    format: "full",
  });

  const messages = response.data.messages ?? [];
  const latestMessage = messages[messages.length - 1];
  const text = extractTextFromPayload(latestMessage?.payload);
  return text;
}

export async function sendReply(
  accessToken: string,
  options: {
    to: string;
    subject: string;
    body: string;
    threadId: string;
    inReplyTo?: string;
  },
): Promise<void> {
  const gmail = getGmailClient(accessToken);

  const emailLines = [
    `To: ${options.to}`,
    `Subject: ${options.subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    "",
    options.body,
  ];

  const raw = Buffer.from(emailLines.join("\r\n"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw,
      threadId: options.threadId,
    },
  });
}
