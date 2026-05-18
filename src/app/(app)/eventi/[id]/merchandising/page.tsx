import { createServerClient } from "@/lib/supabase/server";
import {
  MerchandisingClient,
  type MerchandisingRow,
} from "./_components/MerchandisingClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EventoMerchandisingPage({ params }: Props) {
  const { id } = await params;
  const sb = createServerClient();

  const { data, error } = await sb
    .from("evento_merchandising")
    .select("id, articolo, quantita, costo_unitario, note")
    .eq("evento_id", id)
    .order("articolo");

  const rows = (data ?? []) as MerchandisingRow[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
          Merchandising
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Articoli che produciamo per venderli all&apos;evento — t-shirt,
          poster, sticker, tote bag. Segnate quantità da produrre e costo
          unitario: il totale entra automaticamente fra le uscite del Budget.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Errore: {error.message}
        </p>
      )}

      <MerchandisingClient eventoId={id} rows={rows} />
    </div>
  );
}
