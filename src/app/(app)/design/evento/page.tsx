import Link from "next/link";
import {
  Calendar,
  MapPin,
  Pencil,
  Wallet,
  Users,
  Mic2,
  ListChecks,
  TrendingUp,
  TrendingDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";

// Dati mock condivisi tra le due varianti per confronto
const evento = {
  id: "demo",
  nome: "Festival Matazz 2026",
  data: "Ven 12 – Dom 14 giugno 2026",
  location: "Piazza Grande, Locarno",
  stato: "In pianificazione" as const,
  descrizione:
    "Tre giorni di musica, teatro e arti di strada nel cuore della città. Programma in costruzione.",
};

const budget = { saldo: 18450, entrate: 62000, uscite: 43550 };
const artisti = {
  totali: 12,
  confermati: 8,
  daConfermare: 4,
  perMacro: [
    { macro: "Musica", emoji: "🎵", count: 5 },
    { macro: "Teatro", emoji: "🎭", count: 2 },
    { macro: "Danza", emoji: "💃", count: 1 },
  ],
};
const staff = {
  totali: 21,
  perCategoria: [
    { cat: "Tecnici", emoji: "🔧", count: 6 },
    { cat: "Backstage", emoji: "🎬", count: 8 },
    { cat: "Hostess", emoji: "👋", count: 4 },
    { cat: "Sicurezza", emoji: "🛡️", count: 3 },
  ],
};
const programma = { voci: 24, daGiorno: "Ven 12 giu", aGiorno: "Dom 14 giu" };

// Programma giornaliero: titolo breve opzionale + orario.
// Il titolo per giornata è un campo nuovo (proposta): es. evento_giornate.titolo.
const giornate: Array<{
  data: string;
  label: string;
  titolo: string | null;
  ora: string;
}> = [
  { data: "2026-06-11", label: "Giovedì 11 giugno", titolo: "Cena artisti", ora: "18:30" },
  { data: "2026-06-12", label: "Venerdì 12 giugno", titolo: null, ora: "14:00 – 21:30" },
  { data: "2026-06-13", label: "Sabato 13 giugno", titolo: null, ora: "11:00 – 00:00" },
  { data: "2026-06-14", label: "Domenica 14 giugno", titolo: null, ora: "14:00 – 18:00" },
];

const eur = (n: number) =>
  new Intl.NumberFormat("it-CH", {
    style: "currency",
    currency: "CHF",
    maximumFractionDigits: 0,
  }).format(n);

export default function EventoDesignPage() {
  return (
    <div className="space-y-16 max-w-4xl">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">
          Dashboard evento — proposte
        </h1>
        <p className="mt-2 text-base text-neutral-600">
          Due varianti a confronto. Stessi dati, stesso scope (info + 4 KPI),
          solo il layout cambia. Scegli quale applicare alla pagina vera.
        </p>
      </header>

      <VariantWrapper
        label="Variante A — Refresh"
        description="Stessa struttura attuale (info + griglia 2×2 di KPI cliccabili). Solo i componenti UI sono aggiornati: <Card>, <Pill>, <Button>, icone Lucide al posto delle emoji nei meta. Cambio minimo, zero rischio."
      >
        <VariantA />
      </VariantWrapper>

      <VariantWrapper
        label="Variante B — Hero + Strip"
        description="Header più ariosa con titolo grande + meta puliti in riga. Sotto, una strip orizzontale di 4 KPI compatti (numeri grossi) per vista d'insieme. Poi sezioni di dettaglio più estese per artisti e programma. Più stile Linear/Notion."
      >
        <VariantB />
      </VariantWrapper>

      <VariantWrapper
        label="Variante C — Mix (proposta finale)"
        description="Hero della B + card Budget ricca della A (saldo grosso, entrate/uscite). Niente strip: Artisti e Staff in due card affiancate con breakdown. In fondo, il programma per giornata con orario apertura/chiusura e breve descrizione editoriale (un click sul tab Programma porta alla line-up completa)."
      >
        <VariantC />
      </VariantWrapper>
    </div>
  );
}

function VariantWrapper({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-5 pb-3 border-b border-neutral-200">
        <h2 className="text-sm font-medium text-amber-700 uppercase tracking-wide">
          {label}
        </h2>
        <p className="text-sm text-neutral-600 mt-1">{description}</p>
      </div>
      {/* Cornice per simulare il contenuto del layout evento (titolo + tabs già fuori) */}
      <div className="bg-neutral-50 rounded-card p-5 sm:p-6">{children}</div>
    </section>
  );
}

/* ------------------------------ VARIANTE A ------------------------------ */

function VariantA() {
  return (
    <div className="space-y-6">
      <Card padding="lg">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-2">
            <p className="text-sm text-neutral-700 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-500" />
              {evento.data}
            </p>
            <p className="text-sm text-neutral-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-neutral-500" />
              {evento.location}
            </p>
            <Pill tone="warning">{evento.stato}</Pill>
          </div>
          <Button size="sm" variant="ghost">
            <Pencil className="w-4 h-4" />
            Modifica info
          </Button>
        </div>
        <p className="text-sm text-neutral-700 mt-4 whitespace-pre-line">
          {evento.descrizione}
        </p>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCardA
          href={`/eventi/${evento.id}/budget`}
          icon={<Wallet className="w-4 h-4" />}
          title="Budget"
        >
          <div
            className={`text-3xl font-semibold ${
              budget.saldo >= 0 ? "text-green-700" : "text-red-700"
            }`}
          >
            {eur(budget.saldo)}
          </div>
          <p className="text-xs text-neutral-600 mt-1">Saldo previsto</p>
          <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
            <div>
              <p className="text-xs text-neutral-500">Entrate</p>
              <p className="font-medium text-green-700">{eur(budget.entrate)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Uscite</p>
              <p className="font-medium text-red-700">{eur(budget.uscite)}</p>
            </div>
          </div>
        </KpiCardA>

        <KpiCardA
          href={`/eventi/${evento.id}/artisti`}
          icon={<Mic2 className="w-4 h-4" />}
          title="Artisti"
        >
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-neutral-900">
              {artisti.totali}
            </span>
            <span className="text-sm text-neutral-600">
              ({artisti.confermati} confermati, {artisti.daConfermare} da
              confermare)
            </span>
          </div>
          <ul className="mt-3 space-y-1 text-sm">
            {artisti.perMacro.map((m) => (
              <li
                key={m.macro}
                className="flex items-center justify-between gap-2"
              >
                <span className="text-neutral-700">
                  {m.emoji} {m.macro}
                </span>
                <span className="text-neutral-900 font-medium">{m.count}</span>
              </li>
            ))}
          </ul>
        </KpiCardA>

        <KpiCardA
          href={`/eventi/${evento.id}/personale`}
          icon={<Users className="w-4 h-4" />}
          title="Staff"
        >
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-neutral-900">
              {staff.totali}
            </span>
            <span className="text-sm text-neutral-600">persone</span>
          </div>
          <ul className="mt-3 space-y-1 text-sm">
            {staff.perCategoria.map((c) => (
              <li
                key={c.cat}
                className="flex items-center justify-between gap-2"
              >
                <span className="text-neutral-700">
                  {c.emoji} {c.cat}
                </span>
                <span className="text-neutral-900 font-medium">{c.count}</span>
              </li>
            ))}
          </ul>
        </KpiCardA>

        <KpiCardA
          href={`/eventi/${evento.id}/programma`}
          icon={<ListChecks className="w-4 h-4" />}
          title="Programma"
        >
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-neutral-900">
              {programma.voci}
            </span>
            <span className="text-sm text-neutral-600">voci pianificate</span>
          </div>
          <p className="text-xs text-neutral-600 mt-3">
            Dal {programma.daGiorno} al {programma.aGiorno}
          </p>
        </KpiCardA>
      </div>
    </div>
  );
}

function KpiCardA({
  href,
  icon,
  title,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="hover:border-neutral-300 transition-colors h-full" padding="lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-neutral-700">
            {icon}
            <h3 className="text-sm font-medium">{title}</h3>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 transition-colors" />
        </div>
        {children}
      </Card>
    </Link>
  );
}

/* ------------------------------ VARIANTE B ------------------------------ */

function VariantB() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div>
        <Pill tone="warning" className="mb-3">
          {evento.stato}
        </Pill>
        <h2 className="text-3xl font-semibold tracking-tight text-neutral-900">
          {evento.nome}
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-neutral-600">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {evento.data}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            {evento.location}
          </span>
        </div>
        <p className="text-sm text-neutral-700 mt-3 max-w-2xl">
          {evento.descrizione}
        </p>
        <div className="mt-4">
          <Button size="sm" variant="secondary">
            <Pencil className="w-4 h-4" />
            Modifica info
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border border-neutral-200 rounded-card overflow-hidden bg-white">
        <KpiCellB
          label="Saldo"
          value={eur(budget.saldo)}
          valueClass={budget.saldo >= 0 ? "text-green-700" : "text-red-700"}
          trend={
            budget.saldo >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-700" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-700" />
            )
          }
          href={`/eventi/${evento.id}/budget`}
        />
        <KpiCellB
          label="Artisti"
          value={`${artisti.totali}`}
          hint={`${artisti.confermati} confermati`}
          href={`/eventi/${evento.id}/artisti`}
        />
        <KpiCellB
          label="Staff"
          value={`${staff.totali}`}
          hint="persone"
          href={`/eventi/${evento.id}/personale`}
        />
        <KpiCellB
          label="Programma"
          value={`${programma.voci}`}
          hint="voci"
          href={`/eventi/${evento.id}/programma`}
        />
      </div>

      {/* Dettaglio: 2 sezioni più larghe */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card padding="lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Mic2 className="w-4 h-4 text-neutral-700" />
              <h3 className="text-base font-medium text-neutral-900">
                Artisti per disciplina
              </h3>
            </div>
            <Link
              href={`/eventi/${evento.id}/artisti`}
              className="text-sm text-neutral-600 hover:text-neutral-900 flex items-center gap-0.5"
            >
              Vedi tutti <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <ul className="space-y-2">
            {artisti.perMacro.map((m) => (
              <li
                key={m.macro}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-neutral-700">
                  {m.emoji} {m.macro}
                </span>
                <Pill tone="neutral">{m.count}</Pill>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-3 border-t border-neutral-100 flex gap-2 flex-wrap">
            <Pill tone="success">{artisti.confermati} confermati</Pill>
            <Pill tone="warning">{artisti.daConfermare} da confermare</Pill>
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-neutral-700" />
              <h3 className="text-base font-medium text-neutral-900">
                Staff per categoria
              </h3>
            </div>
            <Link
              href={`/eventi/${evento.id}/personale`}
              className="text-sm text-neutral-600 hover:text-neutral-900 flex items-center gap-0.5"
            >
              Vedi tutti <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <ul className="space-y-2">
            {staff.perCategoria.map((c) => (
              <li
                key={c.cat}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-neutral-700">
                  {c.emoji} {c.cat}
                </span>
                <Pill tone="neutral">{c.count}</Pill>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------ VARIANTE C ------------------------------ */

// Giorni del mese di giugno 2026 per il mini-calendario.
// 1 giugno 2026 = lunedì, quindi nessun offset.
const GIUGNO_2026_GIORNI = Array.from({ length: 30 }, (_, i) => i + 1);
const GIORNI_EVENTO = new Set([12, 13, 14]);
const GIORNI_SPECIALI = new Set([11]); // Cena artisti

function VariantC() {
  return (
    <div className="-m-5 sm:-m-6 p-6 sm:p-8 bg-[#F4F2EC] rounded-card space-y-6">
      {/* Hero */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
            {evento.nome}
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            {evento.descrizione}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-700">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {evento.data}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {evento.location}
            </span>
            <Pill tone="warning">{evento.stato}</Pill>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          <Pencil className="w-4 h-4" />
          Modifica info
        </button>
      </div>

      {/* Riga 1: (Budget + Programma) impilati a sinistra, Calendario alto a destra */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <div className="lg:col-span-2 space-y-4">
          <Link
            href={`/eventi/${evento.id}/budget`}
            className="group block"
          >
            <div className="relative overflow-hidden rounded-3xl bg-[#F8F1DF] p-6 sm:p-8 transition-transform group-hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-neutral-700">
                  <Wallet className="w-4 h-4" />
                  <h3 className="text-sm font-medium uppercase tracking-wide">
                    Budget
                  </h3>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
              </div>
              <p className="text-xs text-neutral-500 mt-6">Saldo previsto</p>
              <div
                className={`text-5xl sm:text-6xl font-semibold tabular-nums mt-1 ${
                  budget.saldo >= 0 ? "text-neutral-900" : "text-red-600"
                }`}
              >
                {eur(budget.saldo)}
              </div>
              <div className="grid grid-cols-2 gap-4 mt-8 max-w-sm">
                <div className="rounded-2xl bg-white/70 px-4 py-3">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                    <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                    Entrate
                  </div>
                  <p className="font-semibold tabular-nums text-neutral-900 mt-1">
                    {eur(budget.entrate)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/70 px-4 py-3">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                    <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                    Uscite
                  </div>
                  <p className="font-semibold tabular-nums text-neutral-900 mt-1">
                    {eur(budget.uscite)}
                  </p>
                </div>
              </div>
              <div className="pointer-events-none absolute -right-16 -bottom-16 w-56 h-56 rounded-full bg-red-300/40 blur-3xl" />
            </div>
          </Link>

          {/* Programma (sotto Budget) */}
          <Link
            href={`/eventi/${evento.id}/programma`}
            className="group block"
          >
            <div className="rounded-3xl bg-white p-6 sm:p-8 transition-transform group-hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-neutral-700" />
                  <h3 className="text-sm font-medium text-neutral-900">
                    Programma per giornata
                  </h3>
                </div>
                <span className="text-sm text-neutral-500 group-hover:text-neutral-900 flex items-center gap-0.5">
                  Line-up <ChevronRight className="w-4 h-4" />
                </span>
              </div>
              <ul className="divide-y divide-neutral-100">
                {giornate.map((g) => {
                  const m = g.label.match(/^(\S+)\s+(\d+)\s+(.+)$/);
                  const giorno = m?.[1].slice(0, 3) ?? g.label;
                  const num = m?.[2] ?? "";
                  const mese = m?.[3]?.slice(0, 3) ?? "";
                  return (
                    <li
                      key={g.data}
                      className="py-3 first:pt-0 last:pb-0 flex items-baseline justify-between gap-3"
                    >
                      <span className="whitespace-nowrap">
                        <span className="text-sm font-semibold text-neutral-900">
                          {giorno} {num} {mese}
                        </span>
                        {g.titolo && (
                          <span className="text-xs text-neutral-500">
                            {" "}
                            · {g.titolo}
                          </span>
                        )}
                      </span>
                      <span className="text-sm tabular-nums text-neutral-600 whitespace-nowrap">
                        {g.ora}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Link>
        </div>

        {/* Mini-calendario alto (occupa l'intera colonna a destra) */}
        <div className="rounded-3xl bg-white p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-700" />
              <h3 className="text-sm font-medium text-neutral-900">
                Giornate evento
              </h3>
            </div>
            <span className="text-xs text-neutral-500">Giugno 2026</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {["L", "M", "M", "G", "V", "S", "D"].map((d, i) => (
              <span
                key={i}
                className="text-[10px] uppercase tracking-wide text-neutral-400 pb-1"
              >
                {d}
              </span>
            ))}
            {GIUGNO_2026_GIORNI.map((g) => {
              const isEvento = GIORNI_EVENTO.has(g);
              const isSpecial = GIORNI_SPECIALI.has(g);
              return (
                <div
                  key={g}
                  className={`aspect-square flex items-center justify-center text-sm rounded-full ${
                    isEvento
                      ? "bg-red-300 text-red-900 font-semibold"
                      : isSpecial
                      ? "bg-red-500 text-white font-semibold"
                      : "text-neutral-600"
                  }`}
                >
                  {g}
                </div>
              );
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-neutral-100 space-y-2 text-xs text-neutral-600">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
              Giornate evento (12 – 14 giu)
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              Cena artisti (11 giu)
            </span>
          </div>
          <div className="mt-auto pt-6">
            <div className="rounded-2xl bg-[#F8F1DF] px-4 py-3 flex items-baseline justify-between">
              <span className="text-xs text-neutral-600 uppercase tracking-wide">
                Durata
              </span>
              <span className="text-lg font-semibold text-neutral-900">
                4 giornate
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Riga 3: Artisti + Staff con progress dots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Link
          href={`/eventi/${evento.id}/artisti`}
          className="group block"
        >
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
                {artisti.totali}
              </span>
              <span className="text-sm text-neutral-500">totali</span>
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-200 text-xs font-medium text-red-900">
                {artisti.confermati} confermati
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 text-xs font-medium text-neutral-700">
                {artisti.daConfermare} da confermare
              </span>
            </div>
            <ul className="space-y-2 mt-6">
              {artisti.perMacro.map((m) => (
                <li
                  key={m.macro}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-neutral-700">
                    {m.emoji} {m.macro}
                  </span>
                  <span className="font-semibold text-neutral-900 tabular-nums">
                    {m.count}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Link>

        <Link
          href={`/eventi/${evento.id}/personale`}
          className="group block"
        >
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
                {staff.totali}
              </span>
              <span className="text-sm text-neutral-500">persone</span>
            </div>
            <ul className="space-y-2 mt-6">
              {staff.perCategoria.map((c) => (
                <li
                  key={c.cat}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-neutral-700">
                    {c.emoji} {c.cat}
                  </span>
                  <span className="font-semibold text-neutral-900 tabular-nums">
                    {c.count}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Link>
      </div>
    </div>
  );
}

function KpiCellB({
  label,
  value,
  hint,
  valueClass,
  trend,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  valueClass?: string;
  trend?: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group p-5 flex flex-col gap-1 hover:bg-neutral-50 transition-colors border-r border-b border-neutral-200 last:border-r-0 sm:[&:nth-child(2)]:border-r-0 sm:[&:nth-child(4)]:border-r-0 sm:[&:nth-child(n+3)]:border-b-0 [&:nth-last-child(-n+2)]:border-b-0"
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-neutral-500">
        <span>{label}</span>
        {trend}
      </div>
      <p
        className={`text-3xl font-semibold tabular-nums ${
          valueClass ?? "text-neutral-900"
        }`}
      >
        {value}
      </p>
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}
    </Link>
  );
}
