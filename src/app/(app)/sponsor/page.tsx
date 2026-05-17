import { createServerClient } from "@/lib/supabase/server";
import { ScoutingSponsorClient } from "./_components/ScoutingSponsorClient";
import type { SponsorEdit } from "./_components/SponsorModal";

export default async function SponsorPage() {
  const sb = createServerClient();
  const { data, error } = await sb
    .from("sponsor")
    .select(
      "id, nome, tipo, contatto, indirizzo, telefono, sito_web, note",
    )
    .order("nome");

  const rows = (data ?? []) as SponsorEdit[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
          Scouting Sponsor
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Qui a tempo perso cerchiamo sponsor che potrebbero sostenere i
          nostri eventi. Rubrica condivisa: aggiungete qualsiasi realtà vi
          venga in mente, anche senza un evento specifico già pianificato.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Errore: {error.message}
        </p>
      )}

      <ScoutingSponsorClient rows={rows} />
    </div>
  );
}
