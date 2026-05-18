import { createServerClient } from "@/lib/supabase/server";
import {
  MerchandisingClient,
  type MerchandisingRow,
} from "./_components/MerchandisingClient";
import { MERCH_STIMA_CHIAVE } from "./actions";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EventoMerchandisingPage({ params }: Props) {
  const { id } = await params;
  const sb = createServerClient();

  const [merchRes, stimaRes] = await Promise.all([
    sb
      .from("evento_merchandising")
      .select("id, articolo, quantita, costo_totale, note")
      .eq("evento_id", id)
      .order("articolo"),
    sb
      .from("evento_budget_stime")
      .select("importo")
      .eq("evento_id", id)
      .eq("chiave", MERCH_STIMA_CHIAVE)
      .maybeSingle(),
  ]);

  const rows = (merchRes.data ?? []) as MerchandisingRow[];
  const stimaVendite = Number(stimaRes.data?.importo ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
          Merchandising
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Articoli che produciamo per venderli all&apos;evento — t-shirt,
          poster, sticker, tote bag. Sotto elencate ogni articolo con pezzi e
          costo totale. In alto vedi la spesa totale e la stima di quanto
          incasseremo, sincronizzata con la voce corrispondente in Budget e
          Costi.
        </p>
      </div>

      {merchRes.error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Errore: {merchRes.error.message}
        </p>
      )}

      <MerchandisingClient
        eventoId={id}
        rows={rows}
        stimaVendite={stimaVendite}
      />
    </div>
  );
}
