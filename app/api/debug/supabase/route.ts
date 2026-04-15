import { createClient } from "@supabase/supabase-js";

const NEXTAUTH_TABLES = ["users", "accounts", "sessions", "verification_tokens"] as const;

export async function GET() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Check env vars are present (never expose values)
  if (!url || !key) {
    return Response.json(
      {
        ok: false,
        error: "Missing env vars",
        vars: {
          SUPABASE_URL: !!url,
          SUPABASE_SERVICE_ROLE_KEY: !!key,
        },
      },
      { status: 500 }
    );
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false },
  });

  // Probe each NextAuth table: check it exists and count rows
  const tables: Record<string, { exists: boolean; rows?: number; error?: string }> = {};

  for (const table of NEXTAUTH_TABLES) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    if (error) {
      tables[table] = { exists: false, error: error.message };
    } else {
      tables[table] = { exists: true, rows: count ?? 0 };
    }
  }

  const allTablesExist = Object.values(tables).every((t) => t.exists);

  return Response.json({
    ok: allTablesExist,
    vars: {
      SUPABASE_URL: !!url,
      SUPABASE_SERVICE_ROLE_KEY: !!key,
    },
    tables,
  });
}
