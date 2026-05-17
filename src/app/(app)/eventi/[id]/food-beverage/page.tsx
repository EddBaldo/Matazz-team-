import { createServerClient } from "@/lib/supabase/server";
import { FoodBeverageClient } from "./_components/FoodBeverageClient";
import type { BarEdit } from "./_components/BarModal";
import type { CateringEdit } from "./_components/CateringModal";
import type { FoodTruckEdit } from "./_components/FoodTruckModal";

type BarRow = {
  id: string;
  articolo: string;
  fonte: string;
  fornitore: string | null;
  costo_unitario: number | null;
  prezzo_vendita: number | null;
  quantita_stimata: number;
  note: string | null;
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function FoodBeveragePage({ params }: Props) {
  const { id } = await params;
  const sb = createServerClient();

  const [barRes, catRes, ftRes] = await Promise.all([
    sb
      .from("evento_bar_articoli")
      .select(
        "id, articolo, fonte, fornitore, costo_unitario, prezzo_vendita, quantita_stimata, note",
      )
      .eq("evento_id", id)
      .order("fonte", { ascending: true })
      .order("articolo", { ascending: true }),
    sb
      .from("evento_catering")
      .select(
        "id, nome_fornitore, descrizione, prezzo_per_persona, numero_persone, selezionata, note",
      )
      .eq("evento_id", id)
      .order("nome_fornitore"),
    sb
      .from("evento_food_truck")
      .select(
        "id, nome, modello, incasso_lordo_stimato, percentuale_matazz, costo_unitario, prezzo_vendita, quantita_stimata, selezionata, note",
      )
      .eq("evento_id", id)
      .order("modello", { ascending: true })
      .order("nome", { ascending: true }),
  ]);

  const bar: BarEdit[] = ((barRes.data ?? []) as BarRow[]).map((r) => ({
    id: r.id,
    articolo: r.articolo,
    fonte: r.fonte === "Fornitore" ? "Fornitore" : "Noi",
    fornitore: r.fornitore,
    costo_unitario: r.costo_unitario,
    prezzo_vendita: r.prezzo_vendita,
    quantita_stimata: r.quantita_stimata,
    note: r.note,
  }));
  const catering = (catRes.data ?? []) as CateringEdit[];
  type FtRow = Omit<FoodTruckEdit, "modello"> & { modello: string };
  const foodTruck: FoodTruckEdit[] = ((ftRes.data ?? []) as FtRow[]).map(
    (r) => ({
      ...r,
      modello: r.modello === "Acquisto" ? "Acquisto" : "Percentuale",
    }),
  );

  const err = barRes.error ?? catRes.error ?? ftRes.error;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
          Food &amp; Beverage
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Bar (sempre nel budget), catering e food truck. Solo le voci catering
          e food truck marcate &quot;selezionata&quot; vengono conteggiate nel
          budget.
        </p>
      </div>

      {err && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Errore: {err.message}
        </p>
      )}

      <FoodBeverageClient
        eventoId={id}
        bar={bar}
        catering={catering}
        foodTruck={foodTruck}
      />
    </div>
  );
}
