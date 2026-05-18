import { createServerClient } from "@/lib/supabase/server";
import { CATEGORIE_COMPITI } from "@/lib/compiti";
import {
  CalendarioClient,
  type CompitoRow,
} from "./_components/CalendarioClient";
import type {
  TeamMember,
  StaffMember,
  EventoOption,
} from "./_components/CompitoModal";

type DbCompito = {
  id: string;
  titolo: string;
  data: string;
  data_fine: string | null;
  ora: string | null;
  categoria: string | null;
  fatto: boolean;
  assegnato_a_id: string | null;
  assegnato_personale_id: string | null;
  evento_id: string | null;
  descrizione: string | null;
  evento: { nome: string } | null;
};

type Props = {
  searchParams: Promise<{ mese?: string; teams?: string }>;
};

function toRow(c: DbCompito): CompitoRow {
  return {
    id: c.id,
    titolo: c.titolo,
    data: c.data,
    data_fine: c.data_fine,
    ora: c.ora,
    categoria: c.categoria,
    fatto: c.fatto,
    assegnato_a_id: c.assegnato_a_id,
    assegnato_personale_id: c.assegnato_personale_id,
    evento_id: c.evento_id,
    descrizione: c.descrizione,
    eventoNome: c.evento?.nome ?? null,
  };
}

export default async function CalendarioGlobalePage({ searchParams }: Props) {
  const sp = await searchParams;

  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;
  if (sp.mese) {
    const m = /^(\d{4})-(\d{2})$/.exec(sp.mese);
    if (m) {
      year = Number(m[1]);
      month = Number(m[2]);
    }
  }

  const TUTTI_FILTRI: string[] = [...CATEGORIE_COMPITI];
  const teamsFromUrl =
    sp.teams?.split(",").filter((t) => TUTTI_FILTRI.includes(t)) ?? [];
  const teamsAttivi =
    teamsFromUrl.length > 0 ? teamsFromUrl : [...TUTTI_FILTRI];

  const sb = createServerClient();

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const last = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(last).padStart(2, "0")}`;

  const { data: meseData } = await sb
    .from("compiti")
    .select(
      `id, titolo, data, data_fine, ora, categoria, fatto, assegnato_a_id, assegnato_personale_id, evento_id, descrizione,
       evento:eventi(nome)`,
    )
    .lte("data", endDate)
    .order("data")
    .order("ora", { nullsFirst: false });

  const dbMese = (meseData ?? []) as unknown as DbCompito[];
  const compitiMese: CompitoRow[] = dbMese
    .filter((c) => (c.data_fine ?? c.data) >= startDate)
    .filter(
      (c) => c.categoria !== null && teamsAttivi.includes(c.categoria),
    )
    .map(toRow);

  const today = new Date().toISOString().slice(0, 10);
  const { data: prossimiData } = await sb
    .from("compiti")
    .select(
      `id, titolo, data, data_fine, ora, categoria, fatto, assegnato_a_id, assegnato_personale_id, evento_id, descrizione,
       evento:eventi(nome)`,
    )
    .eq("fatto", false)
    .gte("data", today)
    .order("data", { ascending: true })
    .order("ora", { ascending: true, nullsFirst: false });
  const prossimiCompiti: CompitoRow[] = (
    (prossimiData ?? []) as unknown as DbCompito[]
  )
    .filter((c) => c.categoria !== null && teamsAttivi.includes(c.categoria))
    .map(toRow);

  const [teamRes, staffRes, eventiRes, eventiTuttiRes] = await Promise.all([
    sb.from("team_matazz").select("id, nome").order("nome"),
    sb
      .from("personale_esterno")
      .select("id, nome, cognome, ruolo_principale")
      .order("cognome"),
    sb
      .from("eventi")
      .select("id, nome")
      .order("data_inizio", { ascending: false }),
    sb.from("eventi").select("data_inizio, data_fine"),
  ]);
  const team = (teamRes.data ?? []) as TeamMember[];
  const staff = (staffRes.data ?? []) as StaffMember[];
  const eventi = (eventiRes.data ?? []) as EventoOption[];

  type EventoRange = { data_inizio: string; data_fine: string | null };
  const eventiTutti = (eventiTuttiRes.data ?? []) as EventoRange[];
  const eventiDays = new Set<string>();
  for (const e of eventiTutti) {
    const start = e.data_inizio;
    const end = e.data_fine ?? e.data_inizio;
    if (end < startDate || start > endDate) continue;
    const from = start < startDate ? startDate : start;
    const to = end > endDate ? endDate : end;
    const cur = new Date(from + "T00:00:00");
    const stop = new Date(to + "T00:00:00");
    while (cur <= stop) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, "0");
      const d = String(cur.getDate()).padStart(2, "0");
      eventiDays.add(`${y}-${m}-${d}`);
      cur.setDate(cur.getDate() + 1);
    }
  }

  function hrefWith(
    overrides: Partial<{ mese: string | null; teams: string[] | null }>,
  ): string {
    const mese =
      overrides.mese === undefined
        ? `${year}-${String(month).padStart(2, "0")}`
        : overrides.mese;
    const teams =
      overrides.teams === undefined ? teamsAttivi : overrides.teams;
    const qs = new URLSearchParams();
    if (mese) qs.set("mese", mese);
    if (teams && teams.length > 0 && teams.length < TUTTI_FILTRI.length) {
      qs.set("teams", teams.join(","));
    }
    const s = qs.toString();
    return `/calendario${s ? `?${s}` : ""}`;
  }

  function hrefMese(y: number, m: number): string {
    return hrefWith({ mese: `${y}-${String(m).padStart(2, "0")}` });
  }

  function hrefToggleTeam(t: string): string {
    const isActive = teamsAttivi.includes(t);
    let newTeams: string[];
    if (teamsAttivi.length === TUTTI_FILTRI.length) {
      newTeams = [t];
    } else if (isActive && teamsAttivi.length === 1) {
      newTeams = [];
    } else if (isActive) {
      newTeams = teamsAttivi.filter((x) => x !== t);
    } else {
      newTeams = [...teamsAttivi, t];
    }
    return hrefWith({ teams: newTeams.length === 0 ? null : newTeams });
  }

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  const toggleHrefs: Record<string, string> = {};
  for (const t of CATEGORIE_COMPITI) toggleHrefs[t] = hrefToggleTeam(t);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
          Calendario
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Qui segniamo tutti i nostri impegni di team al di fuori dei singoli
          eventi: meeting, scadenze, lavori trasversali.
        </p>
      </div>

      <CalendarioClient
        year={year}
        month={month}
        teamsAttivi={teamsAttivi}
        compitiMese={compitiMese}
        prossimiCompiti={prossimiCompiti}
        eventiDays={[...eventiDays]}
        team={team}
        staff={staff}
        eventi={eventi}
        hrefMesePrev={hrefMese(prevYear, prevMonth)}
        hrefMeseNext={hrefMese(nextYear, nextMonth)}
        toggleHrefs={toggleHrefs}
      />
    </div>
  );
}
