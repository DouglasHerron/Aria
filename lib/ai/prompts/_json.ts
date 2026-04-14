function stripCodeFences(text: string): string {
  return text.replace(/```json\s*|\s*```/g, "").trim();
}

export function parseJsonFromAI<T>(
  raw: string,
): { ok: true; value: T } | { ok: false; error: string } {
  try {
    const cleaned = stripCodeFences(raw);
    return { ok: true, value: JSON.parse(cleaned) as T };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

