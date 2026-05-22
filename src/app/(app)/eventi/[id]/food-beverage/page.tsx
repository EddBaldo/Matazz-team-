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
  quota_stimata: number;
  note: string | null;
};

type EventoRow = {
  persone_stimati: number;
  bevande_per_persona: number;
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function FoodBeveragePage({ params }: Props) {
  const { id } = await params;
  const sb = createServerClient();

  const [evRes, barRes, ftRes] = await Promise.all([
    sb
      .from("eventi")
      .select("persone_stimati, bevande_per_persona")
      .eq("id", id)
      .maybeSingle(),
    sb
      .from("evento_bar_articoli")
      .select(
        "id, articolo, fonte, fornitore, costo_unitario, prezzo_vendita, quota_stimata, note",
      )
      .eq("evento_id", id)
      .order("fonte", { ascending: true })
      .order("articolo", { ascending: true }),
    sb
      .from("evento_food_truck")
      .select(
        "id, nome, modello, incasso_lordo_stimato, percentuale_matazz, costo_unitario, prezzo_vendita, quota_stimata, selezionata, note",
      )
      .eq("evento_id", id)
      .order("modello", { ascending: true })
      .order("nome", { ascending: true }),
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
    quota_stimata: r.quota_stimata,
    note: r.note,
  }));
  type FtRow = Omit<FoodTruckEdit, "modello"> & { modello: string };
  const foodTruck: FoodTruckEdit[] = ((ftRes.data ?? []) as FtRow[]).map(
    (r) => ({
      ...r,
      modello: r.modello === "Acquisto" ? "Acquisto" : "Percentuale",
    }),
  );

  const err = barRes.error ?? ftRes.error;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
          Food &amp; Beverage
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Bar e food truck per l&apos;evento. Imposta sopra il numero di persone
          attese e le bevande medie a testa: ogni articolo ha una quota %, e la
          quantità stimata di vendita si calcola in automatico. (Le offerte cena
          le gestite nella pagina <strong>Cena</strong>.)
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
        bevandePerPersona={Number(evento.bevande_per_persona ?? 0)}
        bar={bar}
        foodTruck={foodTruck}
      />
    </div>
  );
}
