import "server-only";
import { createServerClient } from "@/lib/supabase/server";

export async function getSaldoConto(): Promise<number> {
  const sb = createServerClient();
  const { data, error } = await sb
    .from("conto_movimenti")
    .select("importo");
  if (error || !data) return 0;
  return data.reduce((s, r) => s + Number(r.importo ?? 0), 0);
}
