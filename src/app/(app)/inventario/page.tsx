import { createServerClient } from "@/lib/supabase/server";
import {
  InventarioClient,
  type InventarioRow,
} from "./_components/InventarioClient";

type DbRow = {
  id: string;
  articolo: string;
  quantita: number;
  dove_si_trova: string | null;
  condizione: string;
  note: string | null;
  creato_da: { nome: string } | null;
};

export default async function InventarioPage() {
  const sb = createServerClient();
  const { data, error } = await sb
    .from("inventario")
    .select(
      `id, articolo, quantita, dove_si_trova, condizione, note,
       creato_da:team_matazz(nome)`,
    )
    .order("articolo");

  const dbRows = (data ?? []) as unknown as DbRow[];
  const rows: InventarioRow[] = dbRows.map((r) => ({
    id: r.id,
    articolo: r.articolo,
    quantita: r.quantita,
    dove_si_trova: r.dove_si_trova,
    condizione: r.condizione,
    note: r.note,
    creatoDaNome: r.creato_da?.nome ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
          Inventario
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Tutti gli articoli raggruppati per condizione. Aggiorna lo stato
          quando qualcosa si rompe o serve buttarlo.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Errore: {error.message}
        </p>
      )}

      <InventarioClient rows={rows} />
    </div>
  );
}
