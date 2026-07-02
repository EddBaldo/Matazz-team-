import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { FoodBeverageClient } from "./_components/FoodBeverageClient";
import type { BarEdit } from "./_components/BarModal";
import type { FoodTruckEdit } from "./_components/FoodTruckModal";

type BarRow = {
  id: string;
  articolo: string;
  fonte: string;
  fornitore: string | null;
  costo_unitario: number | null;
  prezzo_vendita: number | null;
  consumo_per_persona: number;
  note: string | null;
};

type EventoRow = {
  persone_stimati: number;
  bar_attivo: boolean;
  food_truck_attivo: boolean;
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function FoodBeveragePage({ params }: Props) {
  const { id } = await params;
  const sb = createServerClient();

  const [evRes, barRes, ftRes, barCostiRealiRes, ftCostoRealeRes] =
    await Promise.all([
      sb
        .from("eventi")
        .select("persone_stimati, bar_attivo, food_truck_attivo")
        .eq("id", id)
        .maybeSingle(),
      sb
        .from("evento_bar_articoli")
        .select(
          "id, articolo, fonte, fornitore, costo_unitario, prezzo_vendita, consumo_per_persona, note",
        )
        .eq("evento_id", id)
        .order("fonte", { ascending: true })
        .order("articolo", { ascending: true }),
      sb
        .from("evento_food_truck")
        .select(
          "id, nome, modello, incasso_lordo_stimato, percentuale_matazz, costo_unitario, prezzo_vendita, consumo_per_persona, quantita_acquistata, selezionata, note",
        )
        .eq("evento_id", id)
        .order("modello", { ascending: true })
        .order("nome", { ascending: true }),
      // Graceful: table may not exist until migration 058 is applied
      sb
        .from("evento_bar_costi_reali")
        .select("fonte, costo_reale, pagato_da")
        .eq("evento_id", id),
      // Graceful: column may not exist until migration 058 is applied
      sb
        .from("eventi")
        .select("food_truck_costo_reale_acquisto")
        .eq("id", id)
        .maybeSingle(),
    ]);

  if (!evRes.data) notFound();
  const evento = evRes.data as EventoRow;

  const bar: BarEdit[] = ((barRes.data ?? []) as BarRow[]).map((r) => ({
    id: r.id,
    articolo: r.articolo,
    fonte: r.fonte === "Fornitore" ? "Fornitore" : "Noi",
    fornitore: r.fornitore,
    costo_unitario: r.costo_unitario,
    prezzo_vendita: r.prezzo_vendita,
    consumo_per_persona: r.consumo_per_persona,
    note: r.note,
  }));

  type FtRow = Omit<FoodTruckEdit, "modello"> & { modello: string };
  const foodTruck: FoodTruckEdit[] = ((ftRes.data ?? []) as FtRow[]).map(
    (r) => ({
      ...r,
      modello: r.modello === "Acquisto" ? "Acquisto" : "Percentuale",
    }),
  );

  type CostoRealeRow = { fonte: string; costo_reale: number | null; pagato_da: string | null };
  const barCostiReali = (!barCostiRealiRes.error && barCostiRealiRes.data
    ? (barCostiRealiRes.data as CostoRealeRow[])
    : []
  ).reduce(
    (acc, r) => ({
      ...acc,
      [r.fonte]: { costo_reale: r.costo_reale, pagato_da: r.pagato_da },
    }),
    {} as Record<string, { costo_reale: number | null; pagato_da: string | null }>,
  );

  const foodTruckCostoRealeAcquisto =
    !ftCostoRealeRes.error && ftCostoRealeRes.data
      ? ((ftCostoRealeRes.data as { food_truck_costo_reale_acquisto: number | null })
          .food_truck_costo_reale_acquisto ?? null)
      : null;

  const err = barRes.error ?? ftRes.error;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
          Food &amp; Beverage
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Bar e food truck per l&apos;evento. Inserisci il numero di persone
          attese; per ogni articolo scrivi a quanto lo compriamo, a quanto lo
          vendiamo e quante ne consuma in media una persona — il sito calcola
          le stime di vendita e il guadagno. Le offerte cena le gestite nella
          pagina <strong>Cena</strong>.
        </p>
      </div>

      {err && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Errore: {err.message}
        </p>
      )}

      <FoodBeverageClient
        eventoId={id}
        personeStimati={evento.persone_stimati ?? 0}
        barAttivo={evento.bar_attivo ?? true}
        foodTruckAttivo={evento.food_truck_attivo ?? true}
        bar={bar}
        foodTruck={foodTruck}
        barCostiReali={barCostiReali}
        foodTruckCostoRealeAcquisto={foodTruckCostoRealeAcquisto}
      />
    </div>
  );
}
