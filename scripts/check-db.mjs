// Smoke test: verifica che la connessione a Supabase funzioni con la service_role key.
// Uso: node --env-file=.env.local scripts/check-db.mjs

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("ENV mancanti: NEXT_PUBLIC_SUPABASE_URL e/o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

const { data, error } = await sb
  .from("team_matazz")
  .select("id, nome")
  .order("nome");

if (error) {
  console.error("ERRORE Supabase:", error.message);
  process.exit(1);
}

console.log(`✓ Connessione OK. Righe in team_matazz: ${data.length}`);
console.log("Nomi:", data.map((r) => r.nome).join(", "));
