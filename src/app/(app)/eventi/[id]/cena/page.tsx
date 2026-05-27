import { createServerClient } from "@/lib/supabase/server";
import {
  CenaClient,
  type OspitoCenaItem,
  type TeamCenaItem,
} from "./_components/CenaClient";
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
  artista: {
    nome: string;
    cognome: string;
    membri_extra: string | null;
    numero_persone: number;
  } | null;
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

  const [
    catRes,
    ospitiRes,
    artistiRes,
    personaleRes,
    teamRes,
    teamEsclusiRes,
  ] = await Promise.all([
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
      .select(
        "id, intolleranze_cibo, artista:artisti(nome, cognome, membri_extra, numero_persone)",
      )
      .eq("evento_id", id)
      .eq("presente_cena", true),
    sb
      .from("evento_personale")
      .select(
        "id, intolleranze_cibo, persona:personale_esterno(nome, cognome)",
      )
      .eq("evento_id", id)
      .eq("presente_cena", true),
    sb.from("team_matazz").select("id, nome").order("nome"),
    sb
      .from("evento_team_cena_esclusi")
      .select("team_matazz_id")
      .eq("evento_id", id),
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
    .map((r) => {
      const base = [r.artista!.nome, r.artista!.cognome]
        .filter((s) => s && s.trim())
        .join(" ");
      const extra = r.artista!.membri_extra?.trim();
      return {
        id: r.id,
        nome: extra && extra.length > 0 ? `${base} + ${extra}` : base,
        intolleranze_cibo: r.intolleranze_cibo,
        numero_persone: r.artista!.numero_persone ?? 1,
      };
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, "it"));

  const personaleCena: OspitoCenaItem[] = (
    (personaleRes.data ?? []) as unknown as PersonaleCenaRow[]
  )
    .filter((r) => r.persona !== null)
    .map((r) => ({
      id: r.id,
      nome: `${r.persona!.nome} ${r.persona!.cognome}`,
      intolleranze_cibo: r.intolleranze_cibo,
      numero_persone: 1,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "it"));

  const esclusi = new Set(
    ((teamEsclusiRes.data ?? []) as { team_matazz_id: string }[]).map(
      (r) => r.team_matazz_id,
    ),
  );
  const teamCena: TeamCenaItem[] = (
    (teamRes.data ?? []) as { id: string; nome: string }[]
  ).map((t) => ({
    id: t.id,
    nome: t.nome,
    presente: !esclusi.has(t.id),
  }));

  const err =
    catRes.error ??
    ospitiRes.error ??
    artistiRes.error ??
    personaleRes.error ??
    teamRes.error ??
    teamEsclusiRes.error;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
          Cena
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Le offerte cena dei vari chef e l&apos;elenco degli ospiti che cenano
          con noi, con le rispettive intolleranze. Il totale ospiti combina
          artisti, personale, team Matazz e ospiti speciali. Usa il bottone
          &ldquo;Aggiorna offerte col totale&rdquo; quando la lista è
          definitiva.
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
        teamCena={teamCena}
      />
    </div>
  );
}
