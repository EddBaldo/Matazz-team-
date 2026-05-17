import { createServerClient } from "@/lib/supabase/server";
import {
  PersonaleScoutingClient,
  type PersonaleScoutingRow,
} from "./_components/PersonaleScoutingClient";

type DbRow = {
  id: string;
  nome: string;
  cognome: string;
  ruolo_principale: string;
  categoria: string | null;
  contatti: string | null;
  note: string | null;
  creato_da: { nome: string } | null;
};

export default async function PersonalePage() {
  const sb = createServerClient();
  const { data, error } = await sb
    .from("personale_esterno")
    .select(
      `id, nome, cognome, ruolo_principale, categoria, contatti, note,
       creato_da:team_matazz(nome)`,
    )
    .order("cognome");

  const dbRows = (data ?? []) as unknown as DbRow[];
  const rows: PersonaleScoutingRow[] = dbRows.map((r) => ({
    id: r.id,
    nome: r.nome,
    cognome: r.cognome,
    ruolo_principale: r.ruolo_principale,
    categoria: r.categoria ?? "Altro",
    contatti: r.contatti,
    note: r.note,
    creatoDaNome: r.creato_da?.nome ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
          Scouting Staff
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Qui a tempo perso cerchiamo persone esterne da poter coinvolgere
          nei nostri eventi: fotografi, bar, tecnici audio, allestitori.
          Raggruppate per categoria, aggiungete chiunque possa servire.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Errore: {error.message}
        </p>
      )}

      <PersonaleScoutingClient rows={rows} />
    </div>
  );
}
