import { createServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { EventoSponsorClient } from "./_components/EventoSponsorClient";
import type { SponsorRubrica } from "./_components/AggiungiSponsorModal";
import type {
  EventoSponsorEdit,
  TeamMember,
} from "./_components/ModificaEventoSponsorModal";

type DbRow = {
  id: string;
  chi_contatto_id: string | null;
  stato: string;
  importo: number;
  data_contatto: string | null;
  note: string | null;
  sponsor: { id: string; nome: string; tipo: string } | null;
  chi_contatto: { nome: string } | null;
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EventoSponsorPage({ params }: Props) {
  const { id } = await params;
  const sb = createServerClient();

  const [evSpRes, rubricaRes, teamRes] = await Promise.all([
    sb
      .from("evento_sponsor")
      .select(
        `id, chi_contatto_id, stato, importo, data_contatto, note,
         sponsor:sponsor(id, nome, tipo),
         chi_contatto:team_matazz!chi_contatto_id(nome)`,
      )
      .eq("evento_id", id)
      .order("stato"),
    sb.from("sponsor").select("id, nome, tipo").order("nome"),
    sb.from("team_matazz").select("id, nome").order("nome"),
  ]);

  const dbRows = (evSpRes.data ?? []) as unknown as DbRow[];
  const rubrica = (rubricaRes.data ?? []) as SponsorRubrica[];
  const team = (teamRes.data ?? []) as TeamMember[];

  const rows: EventoSponsorEdit[] = dbRows
    .filter((r) => r.sponsor !== null)
    .map((r) => ({
      id: r.id,
      chi_contatto_id: r.chi_contatto_id,
      stato: r.stato,
      importo: r.importo,
      data_contatto: r.data_contatto,
      note: r.note,
      sponsorId: r.sponsor!.id,
      sponsorNome: r.sponsor!.nome,
      sponsorTipo: r.sponsor!.tipo,
      chiContattoNome: r.chi_contatto?.nome ?? null,
    }));

  const totaleConfermato = rows
    .filter((r) => r.stato === "Confermato")
    .reduce((s, r) => s + Number(r.importo), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
          Sponsor
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Sponsor che abbiamo contattato per questo evento. Solo i confermati
          entrano nel budget come entrata · Totale confermato:{" "}
          <strong className="text-green-700">
            {formatMoney(totaleConfermato)}
          </strong>
        </p>
      </div>

      {evSpRes.error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Errore: {evSpRes.error.message}
        </p>
      )}

      <EventoSponsorClient
        eventoId={id}
        rows={rows}
        rubrica={rubrica}
        team={team}
      />
    </div>
  );
}
