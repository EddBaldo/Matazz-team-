import { createServerClient } from "@/lib/supabase/server";
import {
  ScoutingPageClient,
  type ScoutingRow,
} from "./_components/ScoutingPageClient";

type DbRow = {
  id: string;
  nome: string;
  cognome: string;
  tipo_arte: string;
  residenza: string | null;
  link: string | null;
  link_opera: string | null;
  creato_da: { nome: string } | null;
};

export default async function ArtistiPage() {
  const sb = createServerClient();
  const { data, error } = await sb
    .from("artisti")
    .select(
      `id, nome, cognome, tipo_arte, residenza, link, link_opera,
       creato_da:team_matazz(nome)`,
    )
    .order("cognome");

  const dbRows = (data ?? []) as unknown as DbRow[];
  const rows: ScoutingRow[] = dbRows.map((r) => ({
    id: r.id,
    nome: r.nome,
    cognome: r.cognome,
    tipo_arte: r.tipo_arte,
    residenza: r.residenza,
    link: r.link,
    link_opera: r.link_opera,
    creatoDaNome: r.creato_da?.nome ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
          Scouting Artisti
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Qui a tempo perso cerchiamo artisti interessanti da coinvolgere nei
          prossimi eventi. Rubrica condivisa: aggiungete chiunque vi colpisca,
          anche senza un evento specifico in mente.
        </p>
        <p className="text-sm text-neutral-600 mt-2">
          Documenti, proposal e info raccolti sugli artisti vivono qui:{" "}
          <a
            href="https://drive.google.com/drive/u/0/folders/1RlUrxRrUEDyvflQVbYjefuio-eXkUVzT"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-700 hover:text-amber-800 underline"
          >
            cartella Google Drive
          </a>
          .
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Errore: {error.message}
        </p>
      )}

      <ScoutingPageClient rows={rows} />
    </div>
  );
}
