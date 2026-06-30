import { createServerClient } from "@/lib/supabase/server";
import {
  MaterialiClient,
  type MaterialeRow,
} from "./_components/MaterialiClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EventoMaterialiPage({ params }: Props) {
  const { id } = await params;
  const sb = createServerClient();

  const { data, error } = await sb
    .from("evento_materiali")
    .select(
      "id, articolo, quantita, prezzo_unitario, a_cosa_serve, fonti, preso, gia_disponibile, note, pagato_da",
    )
    .eq("evento_id", id)
    .order("articolo");

  type DbRow = Omit<MaterialeRow, "fonti"> & { fonti: unknown };
  const rows: MaterialeRow[] = (data ?? []).map((r) => {
    const row = r as DbRow;
    const fonti = Array.isArray(row.fonti)
      ? (row.fonti as { label?: string | null; url?: string | null }[]).map(
          (f) => ({
            label: f?.label ?? null,
            url: f?.url ?? null,
          }),
        )
      : [];
    return { ...row, fonti };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
          Materiali
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Tutti i materiali necessari per l&apos;evento. Segnate bene quello
          che serve e tenete aggiornato lo stato: marcate come
          &quot;preso&quot; quando avete fisicamente in mano l&apos;oggetto.
          I materiali &quot;già disponibili&quot; non rientrano nel totale
          da comprare.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Errore: {error.message}
        </p>
      )}

      <MaterialiClient eventoId={id} rows={rows} />
    </div>
  );
}
