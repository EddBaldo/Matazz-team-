import { createServerClient } from "@/lib/supabase/server";
import { CenaClient, type OspitoCenaItem } from "./_components/CenaClient";
import type { CateringEdit } from "./_components/CateringModal";
import type { OspiteCena } from "./_components/OspitiModal";

type CateringRow = {
  id: string;
  nome_fornitore: string;
  descrizione: string | null;
  modello: string;
  prezzo_per_persona: number;
  numero_persone: number;
  prezzo_totale: number;
  selezionata: boolean;
  note: string | null;
};

type ArtistaCenaRow = {
  id: string;
  intolleranze_cibo: string | null;
  artista: { nome: string; cognome: string } | null;
};

type PersonaleCenaRow = {
  id: string;
  intolleranze_cibo: string | null;
  persona: { nome: string; cognome: string } | null;
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
        "id, nome_fornitore, descrizione, modello, prezzo_per_persona, numero_persone, prezzo_totale, selezionata, note",
      )
      .eq("evento_id", id)
      .order("nome_fornitore"),
    sb
      .from("evento_cena_ospiti")
      .select("id, nome, intolleranze_cibo")
      .eq("evento_id", id)
      .order("created_at"),
    sb
      .from("evento_artisti")
      .select("id, intolleranze_cibo, artista:artisti(nome, cognome)")
      .eq("evento_id", id)
      .eq("presente_cena", true),
    sb
      .from("evento_personale")
      .select(
        "id, intolleranze_cibo, persona:personale_esterno(nome, cognome)",
      )
      .eq("evento_id", id)
      .eq("presente_cena", true),
  ]);

  const catering: CateringEdit[] = ((catRes.data ?? []) as CateringRow[]).map(
    (r) => ({
      ...r,
      modello: r.modello === "Totale" ? "Totale" : "PerPersona",
    }),
  );
  const ospiti = (ospitiRes.data ?? []) as OspiteCena[];

  const artistiCena: OspitoCenaItem[] = (
    (artistiRes.data ?? []) as unknown as ArtistaCenaRow[]
  )
    .filter((r) => r.artista !== null)
    .map((r) => ({
      id: r.id,
      nome: `${r.artista!.nome} ${r.artista!.cognome}`,
      intolleranze_cibo: r.intolleranze_cibo,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "it"));

  const personaleCena: OspitoCenaItem[] = (
    (personaleRes.data ?? []) as unknown as PersonaleCenaRow[]
  )
    .filter((r) => r.persona !== null)
    .map((r) => ({
      id: r.id,
      nome: `${r.persona!.nome} ${r.persona!.cognome}`,
      intolleranze_cibo: r.intolleranze_cibo,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "it"));

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
          con noi, con le rispettive intolleranze. Il totale ospiti combina
          artisti, personale e Family &amp; Friends — il numero entra
          automaticamente nel costo per ogni offerta selezionata.
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
        artistiCena={artistiCena}
        personaleCena={personaleCena}
      />
    </div>
  );
}
