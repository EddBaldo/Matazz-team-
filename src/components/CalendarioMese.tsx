"use client";

import Link from "next/link";
import { CATEGORIA_BADGE } from "@/lib/compiti";

type CompitoCal = {
  id: string;
  titolo: string;
  data: string;
  data_fine?: string | null;
  ora: string | null;
  categoria: string | null;
  fatto: boolean;
};

type Props = {
  year: number;
  month: number;
  compiti: CompitoCal[];
  eventiDays?: string[];
  onCompitoClick: (compitoId: string) => void;
  hrefMesePrev: string;
  hrefMeseNext: string;
};

const GIORNI_SETTIMANA = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const NOMI_MESE = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

const FALLBACK_BADGE = "bg-neutral-200 text-neutral-800";

export function CalendarioMese({
  year,
  month,
  compiti,
  eventiDays,
  onCompitoClick,
  hrefMesePrev,
  hrefMeseNext,
}: Props) {
  const eventiDaysSet = new Set(eventiDays ?? []);
  const ultimoDelMese = new Date(year, month, 0);
  const numGiorni = ultimoDelMese.getDate();
  const primoDelMese = new Date(year, month - 1, 1);
  const giornoSettPrimo = (primoDelMese.getDay() + 6) % 7;

  type Cell = {
    giorno: number;
    data: string;
    compitiGiorno: CompitoCal[];
  } | null;

  const cells: Cell[] = [];
  for (let i = 0; i < giornoSettPrimo; i++) cells.push(null);
  for (let g = 1; g <= numGiorni; g++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(g).padStart(2, "0")}`;
    cells.push({
      giorno: g,
      data: dateStr,
      // Mostra ogni compito solo nel giorno di inizio (i multi-giorno
      // non si ripetono sulle celle successive — l'utente vede la durata
      // dall'icona / dall'edit).
      compitiGiorno: compiti.filter((c) => dateStr === c.data),
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="bg-white rounded-3xl p-4">
      <div className="flex items-center justify-between mb-3 gap-3">
        <Link
          href={hrefMesePrev}
          className="px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-full"
        >
          ← {NOMI_MESE[prevMonth - 1]}
        </Link>
        <h3 className="text-base font-semibold text-neutral-900">
          {NOMI_MESE[month - 1]} {year}
        </h3>
        <Link
          href={hrefMeseNext}
          className="px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-full"
        >
          {NOMI_MESE[nextMonth - 1]} →
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-px bg-neutral-100 rounded-2xl overflow-hidden">
        {GIORNI_SETTIMANA.map((g) => (
          <div
            key={g}
            className="bg-neutral-50 px-2 py-1.5 text-xs font-medium text-neutral-500 text-center"
          >
            {g}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell) {
            return <div key={i} className="bg-neutral-50/40 min-h-[90px]" />;
          }
          const isToday = cell.data === todayStr;
          const isEventoDay = eventiDaysSet.has(cell.data);
          return (
            <div
              key={i}
              className={`min-h-[90px] p-1 flex flex-col gap-1 ${
                isEventoDay ? "bg-red-50" : "bg-white"
              } ${isToday ? "ring-2 ring-neutral-900 ring-inset" : ""}`}
            >
              <div
                className={`text-xs ${
                  isToday
                    ? "text-neutral-900 font-semibold"
                    : isEventoDay
                      ? "text-red-700 font-medium"
                      : "text-neutral-500"
                }`}
              >
                {cell.giorno}
              </div>
              <div className="flex flex-col gap-0.5 overflow-hidden">
                {cell.compitiGiorno.map((c) => {
                  const isMultiDay = c.data_fine && c.data_fine !== c.data;
                  const badge = c.categoria
                    ? CATEGORIA_BADGE[c.categoria] ?? FALLBACK_BADGE
                    : FALLBACK_BADGE;
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => onCompitoClick(c.id)}
                      className={`text-left text-xs px-1.5 py-0.5 rounded truncate hover:opacity-80 ${badge} ${
                        c.fatto ? "line-through opacity-60" : ""
                      }`}
                      title={
                        isMultiDay
                          ? `${c.titolo} (fino al ${c.data_fine})`
                          : c.titolo
                      }
                    >
                      {c.ora ? c.ora.slice(0, 5) + " " : ""}
                      {c.titolo}
                      {isMultiDay ? " →" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
