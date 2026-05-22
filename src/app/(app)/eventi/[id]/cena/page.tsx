import { createServerClient } from "@/lib/supabase/server";
import { CenaClient } from "./_components/CenaClient";
import type { CateringEdit } from "./_components/CateringModal";
import type { OspiteCena } from "./_components/OspitiModal";

type CateringRow = {
  id: string;
  nome_fornitore: string;
  descrizione: string | null;
  prezzo_per_persona: number;
  selezionata: boolean;
  note: string | null;
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CenaPage({ params }: Props) {
  const { id } = await params;
  const sb = createServerClient();

  const [catRes, ospitiRes, artistiRes, personaleRes] = await Promise.all([
    sb
      .from("evento_catering")
      .select(
        "id, nome_fornitore, descrizione, prezzo_per_persona, selezionata, note",
      )
      .eq("evento_id", id)
      .order("nome_fornitore"),
    sb
      .from("evento_cena_ospiti")
      .select("id, nome, note")
      .eq("evento_id", id)
      .order("created_at"),
    sb
      .from("evento_artisti")
      .select("id", { count: "exact", head: true })
      .eq("evento_id", id)
      .eq("presente_cena", true),
    sb
      .from("evento_personale")
      .select("id", { count: "exact", head: true })
      .eq("evento_id", id)
      .eq("presente_cena", true),
  ]);

  const catering = ((catRes.data ?? []) as CateringRow[]) as CateringEdit[];
  const ospiti = (ospitiRes.data ?? []) as OspiteCena[];
  const numeroArtistiCena = artistiRes.count ?? 0;
  const numeroPersonaleCena = personaleRes.count ?? 0;

  const err =
    catRes.error ??
    ospitiRes.error ??
    artistiRes.error ??
    personaleRes.error;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
          Cena
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Le offerte cena dei vari chef e l&apos;elenco degli ospiti che cenano
          con noi. Il totale ospiti combina artisti, personale e Family &amp;
          Friends — il numero entra automaticamente nel costo per ogni offerta
          selezionata.
        </p>
      </div>

      {err && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Errore: {err.message}
        </p>
      )}

      <CenaClient
        eventoId={id}
        catering={catering}
        ospiti={ospiti}
        numeroArtistiCena={numeroArtistiCena}
        numeroPersonaleCena={numeroPersonaleCena}
      />
    </div>
  );
}
