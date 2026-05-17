import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  MapPin,
  Mic2,
  Pencil,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { createServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { calcolaBudgetEvento } from "@/lib/budget-evento";
import {
  MACRO_TIPI_ARTE,
  MACRO_EMOJI,
  macroFromTipoArte,
  type MacroTipoArte,
} from "@/lib/artisti";
import {
  CATEGORIE_PERSONALE,
  CATEGORIA_PERSONALE_EMOJI,
  type CategoriaPersonale,
} from "@/lib/personale";
import {
  calcolaOraFineLogica,
  calcolaOraInizioMin,
  formatRangeOra,
} from "@/lib/programma";
import { CATEGORIA_DOT } from "@/lib/compiti";
import { Pill } from "@/components/ui/Pill";

type Evento = {
  id: string;
  nome: string;
  data_inizio: string;
  data_fine: string | null;
  stato: string;
  descrizione: string | null;
  location: { nome: string; citta: string } | null;
};

type EventoArtistaRow = {
  confermato: boolean;
  artista: { tipo_arte: string } | null;
};

type EventoPersonaleRow = {
  confermato: boolean;
  persona: { categoria: string | null } | null;
};

const STATO_TONE: Record<string, "warning" | "neutral" | "success"> = {
  "In pianificazione": "warning",
  Concluso: "neutral",
};

function formatRange(start: string, end: string | null): string {
  const s = new Date(start + "T00:00:00").toLocaleDateString("it-CH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  if (!end || end === start) return s;
  const e = new Date(end + "T00:00:00").toLocaleDateString("it-CH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${s} → ${e}`;
}

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mese?: string }>;
};

const MESE_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export default async function EventoDashboardPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { mese: meseParam } = await searchParams;
  const sb = createServerClient();

  const { data: eventoData } = await sb
    .from("eventi")
    .select(
      `id, nome, data_inizio, data_fine, stato, descrizione,
       location:locations(nome, citta)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!eventoData) notFound();
  const evento = eventoData as unknown as Evento;

  const today = new Date().toISOString().slice(0, 10);
  const [budget, artistiRes, personaleRes, giornateRes, vociRes, compitiRes] =
    await Promise.all([
      calcolaBudgetEvento(sb, id),
      sb
        .from("evento_artisti")
        .select("confermato, artista:artisti(tipo_arte)")
        .eq("evento_id", id),
      sb
        .from("evento_personale")
        .select("confermato, persona:personale_esterno(categoria)")
        .eq("evento_id", id),
      sb
        .from("evento_giornate")
        .select("id, data, descrizione")
        .eq("evento_id", id)
        .order("data", { ascending: true }),
      sb
        .from("evento_programma")
        .select("id, giornata_id, ora_inizio, ora_fine, titolo")
        .eq("evento_id", id),
      sb
        .from("compiti")
        .select("id, titolo, data, ora, ora_fine, fatto, categoria, tipo")
        .eq("evento_id", id)
        .order("data", { ascending: true })
        .order("ora", { ascending: true, nullsFirst: false }),
    ]);

  const artistiRows = (artistiRes.data ?? []) as unknown as EventoArtistaRow[];
  const personaleRows = (personaleRes.data ?? []) as unknown as EventoPersonaleRow[];
  type GiornataDB = { id: string; data: string; descrizione: string | null };
  type VoceDB = {
    id: string;
    giornata_id: string;
    ora_inizio: string | null;
    ora_fine: string | null;
    titolo: string;
  };
  const giornateRows = (giornateRes.data ?? []) as unknown as GiornataDB[];
  const vociRows = (vociRes.data ?? []) as unknown as VoceDB[];
  const programmaTableMissing =
    giornateRes.error?.code === "42P01" ||
    (giornateRes.error?.message?.includes("does not exist") ?? false);

  const artistiConfermati = artistiRows.filter((r) => r.confermato).length;
  const artistiDaConfermare = artistiRows.length - artistiConfermati;
  const artistiPerMacro = new Map<MacroTipoArte, number>();
  for (const r of artistiRows) {
    if (!r.confermato || !r.artista) continue;
    const macro = macroFromTipoArte(r.artista.tipo_arte);
    artistiPerMacro.set(macro, (artistiPerMacro.get(macro) ?? 0) + 1);
  }

  const personalePerCategoria = new Map<CategoriaPersonale, number>();
  for (const r of personaleRows) {
    const cat = (r.persona?.categoria as CategoriaPersonale) ?? "Altro";
    const key = (CATEGORIE_PERSONALE as readonly string[]).includes(cat)
      ? cat
      : ("Altro" as CategoriaPersonale);
    personalePerCategoria.set(
      key,
      (personalePerCategoria.get(key) ?? 0) + 1,
    );
  }
  const personaleConfermati = personaleRows.filter((r) => r.confermato).length;
  const personaleDaConfermare = personaleRows.length - personaleConfermati;

  const startDate = new Date(evento.data_inizio + "T00:00:00");
  const endDate = new Date(
    (evento.data_fine ?? evento.data_inizio) + "T00:00:00",
  );

  type CompitoDB = {
    id: string;
    titolo: string;
    data: string;
    ora: string | null;
    ora_fine: string | null;
    fatto: boolean;
    categoria: string | null;
    tipo: string;
  };
  const tuttiCompiti = (compitiRes.data ?? []) as unknown as CompitoDB[];
  const prossimiCompiti = tuttiCompiti
    .filter((c) => !c.fatto && c.data >= today)
    .slice(0, 8);

  // Mini-calendario: mese da searchParam "mese=YYYY-MM" o mese corrente.
  const now = new Date();
  let calYear: number;
  let calMonth: number;
  if (meseParam && MESE_RE.test(meseParam)) {
    const [y, m] = meseParam.split("-").map(Number);
    calYear = y;
    calMonth = m - 1;
  } else {
    calYear = now.getFullYear();
    calMonth = now.getMonth();
  }
  const todayDay =
    now.getFullYear() === calYear && now.getMonth() === calMonth
      ? now.getDate()
      : -1;
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstWeekday = new Date(calYear, calMonth, 1).getDay();
  const mondayOffset = (firstWeekday + 6) % 7;
  const calDate = new Date(calYear, calMonth, 1);
  const monthLabel = calDate.toLocaleDateString("it-CH", {
    month: "long",
    year: "numeric",
  });
  const prevMonth = `${calMonth === 0 ? calYear - 1 : calYear}-${String(
    calMonth === 0 ? 12 : calMonth,
  ).padStart(2, "0")}`;
  const nextMonth = `${calMonth === 11 ? calYear + 1 : calYear}-${String(
    calMonth === 11 ? 1 : calMonth + 2,
  ).padStart(2, "0")}`;

  // Mappa giorno → categorie dei compiti su quel giorno
  const compitiPerGiorno = new Map<number, Set<string>>();
  for (const c of tuttiCompiti) {
    const d = new Date(c.data + "T00:00:00");
    if (d.getFullYear() !== calYear || d.getMonth() !== calMonth) continue;
    const day = d.getDate();
    const set = compitiPerGiorno.get(day) ?? new Set();
    set.add(c.categoria ?? "_none");
    compitiPerGiorno.set(day, set);
  }

  // Giorni evento (range data_inizio → data_fine)
  const giorniEvento = new Set<number>();
  if (
    startDate.getFullYear() === calYear &&
    startDate.getMonth() === calMonth
  ) {
    const from = startDate.getDate();
    const sameMonthEnd =
      endDate.getFullYear() === calYear && endDate.getMonth() === calMonth;
    const to = sameMonthEnd ? endDate.getDate() : daysInMonth;
    for (let d = from; d <= to; d++) giorniEvento.add(d);
  }

  // Giornate dal DB + aggregazione orari delle voci collegate
  const vociByGiornata = new Map<string, VoceDB[]>();
  for (const v of vociRows) {
    const bucket = vociByGiornata.get(v.giornata_id) ?? [];
    bucket.push(v);
    vociByGiornata.set(v.giornata_id, bucket);
  }
  const giornate = giornateRows.map((g) => {
    const voci = vociByGiornata.get(g.id) ?? [];
    return {
      data: g.data,
      descrizione: g.descrizione,
      oraInizio: calcolaOraInizioMin(voci),
      oraFine: calcolaOraFineLogica(voci),
    };
  });

  const stateTone = STATO_TONE[evento.stato] ?? "neutral";

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
            {evento.nome}
          </h2>
          {evento.descrizione && (
            <p className="text-sm text-neutral-600 mt-1 max-w-2xl whitespace-pre-line">
              {evento.descrizione}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-700">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-neutral-500" />
              {formatRange(evento.data_inizio, evento.data_fine)}
            </span>
            {evento.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-neutral-500" />
                {evento.location.nome} ({evento.location.citta})
              </span>
            )}
            <Pill tone={stateTone}>{evento.stato}</Pill>
          </div>
        </div>
        <Link
          href={`/eventi/${id}/modifica`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          <Pencil className="w-4 h-4" />
          Modifica info
        </Link>
      </div>

      {/* Riga 1: Budget + Programma a sinistra, Calendario alto a destra */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <div className="lg:col-span-2 space-y-4">
          {/* Budget */}
          <Link href={`/eventi/${id}/budget`} className="group block">
            <div className="rounded-3xl bg-[#F8F1DF] p-6 sm:p-8 transition-transform group-hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-neutral-700">
                  <Wallet className="w-4 h-4" />
                  <h3 className="text-sm font-medium uppercase tracking-wide text-neutral-500">
                    Budget
                  </h3>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
              </div>
              <p className="text-xs text-neutral-500 mt-6">Saldo effettivo</p>
              <div
                className={`text-3xl sm:text-4xl font-semibold tabular-nums mt-1 ${
                  budget.saldo >= 0 ? "text-neutral-900" : "text-red-600"
                }`}
              >
                {formatMoney(budget.saldo)}
              </div>
              <div className="grid grid-cols-2 gap-4 mt-8 max-w-sm">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                    <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                    Entrate
                  </div>
                  <p className="font-semibold tabular-nums text-neutral-900 mt-1">
                    {formatMoney(budget.entrate)}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                    <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                    Uscite
                  </div>
                  <p className="font-semibold tabular-nums text-neutral-900 mt-1">
                    {formatMoney(budget.uscite)}
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* Programma per giornata */}
          <Link href={`/eventi/${id}/programma`} className="group block">
            <div className="rounded-3xl bg-white p-6 sm:p-8 transition-transform group-hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-neutral-700" />
                  <h3 className="text-sm font-medium uppercase tracking-wide text-neutral-500">
                    Programma per giornata
                  </h3>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
              </div>
              {programmaTableMissing ? (
                <p className="text-sm text-neutral-600">
                  Esegui le migrazioni più recenti per attivare il programma.
                </p>
              ) : giornate.length === 0 ? (
                <p className="text-sm text-neutral-600">
                  Nessuna giornata ancora. Aggiungile dalla pagina Programma.
                </p>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {giornate.map((g) => {
                    const date = new Date(g.data + "T00:00:00");
                    const parts = date
                      .toLocaleDateString("it-CH", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })
                      .replace(",", "")
                      .split(" ");
                    const giorno = (parts[0] ?? "").replace(/\.$/, "");
                    const num = parts[1] ?? "";
                    const mese = (parts[2] ?? "").replace(/\.$/, "");
                    const ora = formatRangeOra(g.oraInizio, g.oraFine);
                    return (
                      <li
                        key={g.data}
                        className="py-3 first:pt-0 last:pb-0 flex items-baseline justify-between gap-3"
                      >
                        <span className="whitespace-nowrap">
                          <span className="text-sm font-semibold text-neutral-900 capitalize">
                            {giorno} {num} {mese}
                          </span>
                          {g.descrizione && (
                            <span className="text-xs text-neutral-500">
                              {" "}
                              · {g.descrizione}
                            </span>
                          )}
                        </span>
                        {ora && (
                          <span className="text-sm tabular-nums text-neutral-600 whitespace-nowrap">
                            {ora}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Link>
        </div>

        {/* Tabella di marcia: mini-calendario + prossimi impegni */}
        <div className="relative rounded-3xl bg-white p-6 h-full flex flex-col group hover:-translate-y-0.5 transition-transform">
          <Link
            href={`/eventi/${id}/compiti`}
            aria-label="Vai alla tabella di marcia"
            className="absolute inset-0 rounded-3xl z-0"
          />
          <div className="relative z-10 pointer-events-none flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-700" />
              <h3 className="text-sm font-medium uppercase tracking-wide text-neutral-500">
                Tabella di marcia
              </h3>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
          </div>
          <div className="relative z-10 flex items-center justify-between mb-4">
            <Link
              href={`/eventi/${id}?mese=${prevMonth}`}
              scroll={false}
              aria-label="Mese precedente"
              className="inline-flex items-center justify-center w-7 h-7 rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <p className="text-xs text-neutral-700 capitalize font-medium pointer-events-none">
              {monthLabel}
            </p>
            <Link
              href={`/eventi/${id}?mese=${nextMonth}`}
              scroll={false}
              aria-label="Mese successivo"
              className="inline-flex items-center justify-center w-7 h-7 rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="relative z-10 pointer-events-none">

            <div className="grid grid-cols-7 gap-1 text-center">
              {["L", "M", "M", "G", "V", "S", "D"].map((d, i) => (
                <span
                  key={i}
                  className="text-[10px] uppercase tracking-wide text-neutral-400 pb-1"
                >
                  {d}
                </span>
              ))}
              {Array.from({ length: mondayOffset }, (_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const cats = compitiPerGiorno.get(day);
                const isToday = day === todayDay;
                const isEvento = giorniEvento.has(day);
                return (
                  <div
                    key={day}
                    className={`aspect-square flex flex-col items-center justify-center text-xs rounded-full ${
                      isToday
                        ? "bg-neutral-900 text-white font-semibold"
                        : isEvento
                          ? "bg-red-100 text-red-900 font-medium"
                          : "text-neutral-600"
                    }`}
                  >
                    <span className="leading-none">{day}</span>
                    {cats && cats.size > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {Array.from(cats)
                          .slice(0, 3)
                          .map((cat, idx) => (
                            <span
                              key={idx}
                              className={`w-2 h-2 rounded-full ${
                                CATEGORIA_DOT[cat] ?? "bg-neutral-400"
                              }`}
                            />
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-neutral-100 flex-1">
              <p className="text-xs uppercase tracking-wide text-neutral-500 font-medium mb-2">
                Prossimi impegni
              </p>
              {prossimiCompiti.length === 0 ? (
                <p className="text-xs text-neutral-400">
                  Nessun impegno in arrivo.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {prossimiCompiti.map((c) => {
                    const date = new Date(c.data + "T00:00:00");
                    const giorno = date
                      .toLocaleDateString("it-CH", {
                        day: "numeric",
                        month: "short",
                      })
                      .replace(/\.$/, "");
                    return (
                      <li
                        key={c.id}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            c.categoria
                              ? CATEGORIA_DOT[c.categoria] ?? "bg-neutral-300"
                              : "bg-neutral-300"
                          }`}
                        />
                        <span className="tabular-nums text-neutral-500 w-12 shrink-0">
                          {giorno}
                        </span>
                        <span className="text-neutral-900 truncate">
                          {c.titolo}
                          {c.tipo === "turni" && (
                            <span className="ml-1 text-neutral-400 text-[10px]">
                              turni
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Riga 2: Artisti + Staff */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Link href={`/eventi/${id}/artisti`} className="group block">
          <div className="rounded-3xl bg-white p-6 sm:p-8 h-full transition-transform group-hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Mic2 className="w-4 h-4 text-neutral-700" />
                <h3 className="text-sm font-medium uppercase tracking-wide text-neutral-500">
                  Artisti
                </h3>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-semibold text-neutral-900 tabular-nums">
                {artistiRows.length}
              </span>
              <span className="text-sm text-neutral-500">totali</span>
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-xs font-medium text-green-800">
                {artistiConfermati} confermati
              </span>
              {artistiDaConfermare > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-xs font-medium text-neutral-700">
                  {artistiDaConfermare} da confermare
                </span>
              )}
            </div>
            {artistiPerMacro.size === 0 ? (
              <p className="text-sm text-neutral-500 mt-6">
                Nessun artista confermato.
              </p>
            ) : (
              <ul className="space-y-2 mt-6">
                {MACRO_TIPI_ARTE.map((macro) => {
                  const count = artistiPerMacro.get(macro) ?? 0;
                  if (count === 0) return null;
                  return (
                    <li
                      key={macro}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-neutral-700">
                        {MACRO_EMOJI[macro]} {macro}
                      </span>
                      <span className="font-semibold text-neutral-900 tabular-nums">
                        {count}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Link>

        <Link href={`/eventi/${id}/personale`} className="group block">
          <div className="rounded-3xl bg-white p-6 sm:p-8 h-full transition-transform group-hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-neutral-700" />
                <h3 className="text-sm font-medium uppercase tracking-wide text-neutral-500">
                  Staff
                </h3>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-semibold text-neutral-900 tabular-nums">
                {personaleRows.length}
              </span>
              <span className="text-sm text-neutral-500">persone</span>
            </div>
            {personaleRows.length > 0 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-xs font-medium text-green-800">
                  {personaleConfermati} confermati
                </span>
                {personaleDaConfermare > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-xs font-medium text-neutral-700">
                    {personaleDaConfermare} da confermare
                  </span>
                )}
              </div>
            )}
            {personalePerCategoria.size === 0 ? (
              <p className="text-sm text-neutral-500 mt-6">
                Nessuna persona ancora.
              </p>
            ) : (
              <ul className="space-y-2 mt-6">
                {CATEGORIE_PERSONALE.map((cat) => {
                  const count = personalePerCategoria.get(cat) ?? 0;
                  if (count === 0) return null;
                  return (
                    <li
                      key={cat}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-neutral-700">
                        {CATEGORIA_PERSONALE_EMOJI[cat]} {cat}
                      </span>
                      <span className="font-semibold text-neutral-900 tabular-nums">
                        {count}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
}
