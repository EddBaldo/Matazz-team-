import { createServerClient } from "@/lib/supabase/server";
import {
  ContoClient,
  type MovimentoRow,
} from "./_components/ContoClient";

type DbRow = {
  id: string;
  data: string;
  descrizione: string;
  importo: number;
  creato_da: { nome: string } | null;
};

export default async function ContoPage() {
  const sb = createServerClient();
  const { data, error } = await sb
    .from("conto_movimenti")
    .select(
      `id, data, descrizione, importo,
       creato_da:team_matazz(nome)`,
    )
    .order("data", { ascending: false });

  const dbRows = (data ?? []) as unknown as DbRow[];
  const rows: MovimentoRow[] = dbRows.map((r) => ({
    id: r.id,
    data: r.data,
    descrizione: r.descrizione,
    importo: Number(r.importo),
    creatoDaNome: r.creato_da?.nome ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
          Conto
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Tutti i movimenti del conto Matazz: entrate (sponsor, biglietti,
          incassi bar) e uscite (fatture, fornitori, materiali). Il saldo qui
          è il punto di partenza per ogni nuovo evento — non dimenticate di
          registrare ogni movimento appena succede.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Errore: {error.message}
        </p>
      )}

      <ContoClient rows={rows} />
    </div>
  );
}
