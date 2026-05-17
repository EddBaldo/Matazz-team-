import { createServerClient } from "@/lib/supabase/server";
import {
  formatGiorno,
  ordinaVoci,
} from "@/lib/programma";
import {
  macroFromTipoArte,
  type MacroTipoArte,
} from "@/lib/artisti";
import {
  ProgrammaGiornate,
  type GiornataView,
  type VoceListItem,
} from "./_components/ProgrammaGiornate";
import type {
  ArtistaCast,
  PerformerByMacro,
} from "./_components/VoceProgrammaModal";

const MACRO_PERFORMER: readonly MacroTipoArte[] = [
  "Performance artistiche",
  "Performance musicali",
  "Musica sera",
];

type GiornataRow = {
  id: string;
  data: string;
  descrizione: string | null;
};

type VoceRow = {
  id: string;
  giornata_id: string;
  ora_inizio: string | null;
  ora_fine: string | null;
  titolo: string;
  descrizione: string | null;
  artista_id: string | null;
  artista: { nome: string; cognome: string } | null;
};

type EventoArtistaRow = {
  artista: ArtistaCast | null;
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EventoProgrammaPage({ params }: Props) {
  const { id } = await params;
  const sb = createServerClient();

  const [giornateRes, vociRes, castRes, eventoRes] = await Promise.all([
    sb
      .from("evento_giornate")
      .select("id, data, descrizione")
      .eq("evento_id", id)
      .order("data", { ascending: true }),
    sb
      .from("evento_programma")
      .select(
        `id, giornata_id, ora_inizio, ora_fine, titolo, descrizione, artista_id,
         artista:artisti(nome, cognome)`,
      )
      .eq("evento_id", id),
    sb
      .from("evento_artisti")
      .select("artista:artisti(id, nome, cognome, tipo_arte)")
      .eq("evento_id", id),
    sb.from("eventi").select("data_inizio").eq("id", id).maybeSingle(),
  ]);

  const giornateRows = (giornateRes.data ?? []) as unknown as GiornataRow[];
  const vociRows = (vociRes.data ?? []) as unknown as VoceRow[];
  const cast = (castRes.data ?? []) as unknown as EventoArtistaRow[];
  const defaultDateForNew =
    (eventoRes.data?.data_inizio as string | undefined) ??
    new Date().toISOString().slice(0, 10);

  const vociByGiornata = new Map<string, VoceListItem[]>();
  for (const v of vociRows) {
    const bucket = vociByGiornata.get(v.giornata_id) ?? [];
    bucket.push({
      id: v.id,
      ora_inizio: v.ora_inizio,
      ora_fine: v.ora_fine,
      titolo: v.titolo,
      descrizione: v.descrizione,
      artista_id: v.artista_id,
      artista: v.artista,
    });
    vociByGiornata.set(v.giornata_id, bucket);
  }

  const giornate: GiornataView[] = giornateRows.map((g) => ({
    id: g.id,
    data: g.data,
    descrizione: g.descrizione,
    label: formatGiorno(g.data),
    voci: ordinaVoci(vociByGiornata.get(g.id) ?? []),
  }));

  const performerByMacro = new Map<MacroTipoArte, ArtistaCast[]>();
  for (const r of cast) {
    if (!r.artista) continue;
    const macro = macroFromTipoArte(r.artista.tipo_arte);
    if (!MACRO_PERFORMER.includes(macro)) continue;
    const bucket = performerByMacro.get(macro) ?? [];
    bucket.push(r.artista);
    performerByMacro.set(macro, bucket);
  }
  for (const bucket of performerByMacro.values()) {
    bucket.sort((a, b) =>
      `${a.nome} ${a.cognome}`.localeCompare(`${b.nome} ${b.cognome}`, "it"),
    );
  }
  const performer: PerformerByMacro = MACRO_PERFORMER.map((macro) => ({
    macro,
    artisti: performerByMacro.get(macro) ?? [],
  }));

  const err = giornateRes.error ?? vociRes.error;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
          Programma
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Costruisci il programma per giornata. Le voci dopo mezzanotte
          (es. chiusura all&apos;01:30) restano nella giornata corrispondente.
        </p>
      </div>

      {err && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Errore: {err.message}
        </p>
      )}

      <ProgrammaGiornate
        eventoId={id}
        performer={performer}
        giornate={giornate}
        defaultDateForNew={defaultDateForNew}
      />
    </div>
  );
}
