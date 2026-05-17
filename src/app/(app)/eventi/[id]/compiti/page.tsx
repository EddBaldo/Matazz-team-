import { createServerClient } from "@/lib/supabase/server";
import { CompitiClient, type CompitoRow } from "./_components/CompitiClient";
import type {
  TeamMember,
  TurnoEdit,
  PersonaleRubrica,
} from "./_components/CompitoModal";

type DbRow = {
  id: string;
  titolo: string;
  data: string;
  data_fine: string | null;
  tipo: string;
  ora: string | null;
  ora_fine: string | null;
  categoria: string | null;
  assegnato_a_id: string | null;
  fatto: boolean;
  descrizione: string | null;
  assegnato_a: { nome: string } | null;
};

type DbSub = {
  id: string;
  compito_id: string;
  personale_id: string | null;
  nome_libero: string | null;
  ora_inizio: string | null;
  ora_fine: string | null;
  note: string | null;
  ordine: number;
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EventoTabellaMarciaPage({ params }: Props) {
  const { id } = await params;
  const sb = createServerClient();

  const [compRes, teamRes, eventoRes, personaleRes] = await Promise.all([
    sb
      .from("compiti")
      .select(
        `id, titolo, data, data_fine, tipo, ora, ora_fine, categoria, assegnato_a_id, fatto, descrizione,
         assegnato_a:team_matazz!assegnato_a_id(nome)`,
      )
      .eq("evento_id", id)
      .order("data")
      .order("ora", { nullsFirst: false }),
    sb.from("team_matazz").select("id, nome").order("nome"),
    sb.from("eventi").select("data_inizio").eq("id", id).maybeSingle(),
    sb
      .from("personale_esterno")
      .select("id, nome, cognome, categoria")
      .order("cognome"),
  ]);

  const dbRows = (compRes.data ?? []) as unknown as DbRow[];
  const team = (teamRes.data ?? []) as TeamMember[];
  const personale = (personaleRes.data ?? []) as PersonaleRubrica[];
  const defaultDateForNew =
    (eventoRes.data?.data_inizio as string | undefined) ??
    new Date().toISOString().slice(0, 10);

  // Fetch dei sub-turni per i compiti di tipo "turni"
  const compitiTurniIds = dbRows
    .filter((r) => r.tipo === "turni")
    .map((r) => r.id);
  let subByCompito = new Map<string, TurnoEdit[]>();
  if (compitiTurniIds.length > 0) {
    const { data: subData } = await sb
      .from("compiti_sub")
      .select(
        `id, compito_id, personale_id, nome_libero, ora_inizio, ora_fine, note, ordine,
         persona:personale_esterno!personale_id(nome, cognome)`,
      )
      .in("compito_id", compitiTurniIds)
      .order("ordine", { ascending: true });
    type SubWithPersona = DbSub & {
      persona: { nome: string; cognome: string } | null;
    };
    const subs = (subData ?? []) as unknown as SubWithPersona[];
    subByCompito = new Map();
    for (const s of subs) {
      const bucket = subByCompito.get(s.compito_id) ?? [];
      bucket.push({
        id: s.id,
        personale_id: s.personale_id,
        personaleLabel: s.persona
          ? `${s.persona.nome} ${s.persona.cognome}`
          : null,
        nome_libero: s.nome_libero,
        ora_inizio: s.ora_inizio,
        ora_fine: s.ora_fine,
        note: s.note,
      });
      subByCompito.set(s.compito_id, bucket);
    }
  }

  const rows: CompitoRow[] = dbRows.map((r) => ({
    id: r.id,
    titolo: r.titolo,
    data: r.data,
    data_fine: r.data_fine,
    tipo: r.tipo === "turni" ? "turni" : "singolo",
    ora: r.ora,
    ora_fine: r.ora_fine,
    categoria: r.categoria,
    assegnato_a_id: r.assegnato_a_id,
    descrizione: r.descrizione,
    fatto: r.fatto,
    assegnatoNome: r.assegnato_a?.nome ?? null,
    turni: subByCompito.get(r.id) ?? [],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
          Tabella di marcia
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Cose da fare per l&apos;evento. Per i turni del personale usa
          &quot;Turni&quot; nel form: un unico impegno raggruppa più persone su
          orari diversi.
        </p>
      </div>

      {compRes.error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Errore: {compRes.error.message}
        </p>
      )}

      <CompitiClient
        eventoId={id}
        rows={rows}
        team={team}
        personale={personale}
        defaultDateForNew={defaultDateForNew}
      />
    </div>
  );
}
