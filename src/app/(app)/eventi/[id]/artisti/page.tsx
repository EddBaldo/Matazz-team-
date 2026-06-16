import { createServerClient } from "@/lib/supabase/server";
import {
  ArtistiPageClient,
  type ArtistaRow,
} from "./_components/ArtistiPageClient";
import type { ArtistaRubrica } from "./_components/AggiungiArtistaModal";
import type { TeamMember } from "./_components/ModificaArtistaModal";

type DbRow = {
  id: string;
  chi_contatto_id: string | null;
  doc_mandati: string;
  doc_info_artisti: boolean;
  doc_proposal: boolean;
  artist_fee: number | null;
  costi_produzione: number | null;
  costi_trasporto: number | null;
  necessita_alloggio: boolean;
  info_alloggio: string | null;
  intolleranze_cibo: string | null;
  commenti: string | null;
  confermato: boolean;
  presente_cena: boolean;
  artista: {
    id: string;
    nome: string;
    cognome: string;
    tipo_arte: string;
    membri_extra: string | null;
    numero_persone: number;
  } | null;
  chi_contatto: { nome: string } | null;
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EventoArtistiPage({ params }: Props) {
  const { id } = await params;
  const sb = createServerClient();

  const [evArtRes, rubricaRes, teamRes] = await Promise.all([
    sb
      .from("evento_artisti")
      .select(
        `id, chi_contatto_id, doc_mandati, doc_info_artisti, doc_proposal,
         artist_fee, costi_produzione, costi_trasporto, necessita_alloggio,
         info_alloggio, intolleranze_cibo, commenti, confermato, presente_cena,
         artista:artisti(id, nome, cognome, tipo_arte, membri_extra, numero_persone),
         chi_contatto:team_matazz!chi_contatto_id(nome)`,
      )
      .eq("evento_id", id),
    sb
      .from("artisti")
      .select("id, nome, cognome, tipo_arte")
      .order("cognome"),
    sb.from("team_matazz").select("id, nome").order("nome"),
  ]);

  const dbRows = (evArtRes.data ?? []) as unknown as DbRow[];
  const rubrica = (rubricaRes.data ?? []) as ArtistaRubrica[];
  const team = (teamRes.data ?? []) as TeamMember[];

  const rows: ArtistaRow[] = dbRows
    .filter((r) => r.artista !== null)
    .map((r) => ({
      id: r.id,
      chi_contatto_id: r.chi_contatto_id,
      doc_mandati: r.doc_mandati,
      doc_info_artisti: r.doc_info_artisti,
      doc_proposal: r.doc_proposal,
      necessita_alloggio: r.necessita_alloggio,
      info_alloggio: r.info_alloggio,
      costi_trasporto: r.costi_trasporto,
      costi_produzione: r.costi_produzione,
      artist_fee: r.artist_fee,
      intolleranze_cibo: r.intolleranze_cibo,
      commenti: r.commenti,
      confermato: r.confermato,
      presente_cena: r.presente_cena,
      artistaId: r.artista!.id,
      artistaLabel: [r.artista!.nome, r.artista!.cognome]
        .filter((s) => s && s.trim())
        .join(" "),
      artistaTipoArte: r.artista!.tipo_arte,
      artistaNome: r.artista!.nome,
      artistaCognome: r.artista!.cognome,
      artistaMembriExtra: r.artista!.membri_extra,
      artistaNumeroPersone: r.artista!.numero_persone ?? 1,
      chiContattoNome: r.chi_contatto?.nome ?? null,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
          Artisti
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Artisti selezionati per l&apos;evento, raggruppati per disciplina.
          In fondo trovate quelli ancora da confermare. Ricordatevi di tenere
          aggiornate tutte le voci (fee, alloggio, intolleranze) — sono le
          stesse informazioni che useremo per produzione e logistica.
        </p>
      </div>

      {evArtRes.error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Errore: {evArtRes.error.message}
        </p>
      )}

      <ArtistiPageClient
        eventoId={id}
        rows={rows}
        rubrica={rubrica}
        team={team}
      />
    </div>
  );
}
