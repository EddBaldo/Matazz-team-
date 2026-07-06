"use client";

import { useState, useTransition } from "react";
import { formatMoney } from "@/lib/format";
import { salvaStima, salvaIncassoRealeR } from "../actions";

export type BudgetLine = {
  chiave: string;
  label: string;
  effettivo: number;
  stima: number;
  isIncassoReale?: boolean;
  effettivoIsOverridden?: boolean;
};

type Props = {
  eventoId: string;
  uscite: BudgetLine[];
  entrate: BudgetLine[];
  saldoConto: number;
  incassoRealeVendite: number | null;
};

export function BudgetClient({
  eventoId,
  uscite,
  entrate,
  saldoConto,
  incassoRealeVendite,
}: Props) {
  // Stato locale delle stime (per immediate feedback)
  const [stimeUscite, setStimeUscite] = useState<Record<string, number>>(
    Object.fromEntries(uscite.map((l) => [l.chiave, l.stima])),
  );
  const [stimeEntrate, setStimeEntrate] = useState<Record<string, number>>(
    Object.fromEntries(entrate.map((l) => [l.chiave, l.stima])),
  );

  const totaleEffEntrate = entrate.reduce((s, l) => s + l.effettivo, 0);
  const totaleEffUscite = uscite.reduce((s, l) => s + l.effettivo, 0);
  // Il saldo include il conto Matazz attuale: non partiamo da zero
  const saldoEffettivo = saldoConto + totaleEffEntrate - totaleEffUscite;

  const totaleStimEntrate = Object.values(stimeEntrate).reduce(
    (s, v) => s + v,
    0,
  );
  const totaleStimUscite = Object.values(stimeUscite).reduce(
    (s, v) => s + v,
    0,
  );
  const saldoStimato = saldoConto + totaleStimEntrate - totaleStimUscite;

  function updateStima(
    setter: typeof setStimeUscite,
    chiave: string,
    value: number,
  ) {
    setter((prev) => ({ ...prev, [chiave]: value }));
  }

  return (
    <>
      <SummaryCards
        effEntrate={totaleEffEntrate}
        effUscite={totaleEffUscite}
        effSaldo={saldoEffettivo}
        stimEntrate={totaleStimEntrate}
        stimUscite={totaleStimUscite}
        stimSaldo={saldoStimato}
        saldoConto={saldoConto}
        risultatoEvento={totaleEffEntrate - totaleEffUscite}
      />

      <BudgetTable
        eventoId={eventoId}
        title="Uscite"
        emoji="↘"
        toneAccent="text-red-700"
        lines={uscite}
        stime={stimeUscite}
        onStimaChange={(k, v) => updateStima(setStimeUscite, k, v)}
        totaleEffettivo={totaleEffUscite}
        totaleStimato={totaleStimUscite}
        incassoRealeVendite={incassoRealeVendite}
      />

      <BudgetTable
        eventoId={eventoId}
        title="Entrate"
        emoji="↗"
        toneAccent="text-green-700"
        lines={entrate}
        stime={stimeEntrate}
        onStimaChange={(k, v) => updateStima(setStimeEntrate, k, v)}
        totaleEffettivo={totaleEffEntrate}
        totaleStimato={totaleStimEntrate}
        incassoRealeVendite={incassoRealeVendite}
        budgetEditable={false}
      />

      <p className="text-xs text-neutral-500">
        I costi effettivi si calcolano automaticamente dalle altre tabelle
        (artisti, sponsor, F&amp;B, materiali, voci extra). Il budget è la
        nostra previsione editabile — clicca su un valore per modificarlo.
        Il saldo finale include sempre il conto Matazz attuale (così vedete
        dove saremo dopo l&apos;evento, non solo il netto dell&apos;evento).
      </p>
    </>
  );
}

function SummaryCards({
  effEntrate,
  effUscite,
  effSaldo,
  stimEntrate,
  stimUscite,
  stimSaldo,
  saldoConto,
  risultatoEvento,
}: {
  effEntrate: number;
  effUscite: number;
  effSaldo: number;
  stimEntrate: number;
  stimUscite: number;
  stimSaldo: number;
  saldoConto: number;
  risultatoEvento: number;
}) {
  return (
    <div className="rounded-3xl bg-white overflow-hidden">
      {/* Titoli */}
      <div className="grid grid-cols-3 border-b border-neutral-100">
        <div className="col-span-2 px-6 pt-5 pb-4 border-r border-neutral-100">
          <p className="text-xl font-bold text-neutral-900 tracking-tight">Costi effettivi</p>
          <p className="text-xs text-neutral-500 mt-0.5">Calcolati automaticamente dalle tabelle dell&apos;evento.</p>
        </div>
        <div className="px-5 pt-5 pb-4">
          <p className="text-lg font-bold text-neutral-600 tracking-tight">Budget previsto</p>
          <p className="text-[10px] text-neutral-400 mt-0.5">Quanto decidiamo di stanziare per l&apos;evento.</p>
          <p className="text-xs text-neutral-500 mt-2">
            Il budget stanziato ammonta a{" "}
            <span className="font-semibold text-neutral-700 tabular-nums">{formatMoney(stimUscite)}</span>
          </p>
        </div>
      </div>

      {/* Entrate / Uscite */}
      <div className="grid grid-cols-3 border-b border-neutral-100">
        <div className="col-span-2 px-6 py-5 border-r border-neutral-100">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-neutral-400 font-medium">Entrate</p>
              <p className="text-2xl font-bold tabular-nums mt-1 text-green-700">{formatMoney(effEntrate)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-neutral-400 font-medium">Uscite</p>
              <p className="text-2xl font-bold tabular-nums mt-1 text-red-700">{formatMoney(effUscite)}</p>
            </div>
          </div>
        </div>
        <div className="px-5 py-5">
          <p className="text-[9px] uppercase tracking-wide text-neutral-400 font-medium">Uscite previste</p>
          <p className="text-sm font-semibold tabular-nums mt-1 text-red-600">{formatMoney(stimUscite)}</p>
        </div>
      </div>

      {/* Risultato evento + Saldo */}
      <div className="grid grid-cols-3">
        <div className="col-span-2 px-6 py-5 border-r border-neutral-100">
          <div className="flex items-start gap-8 flex-wrap">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-neutral-400 font-medium">Risultato evento</p>
              <p className={`text-3xl font-bold tabular-nums mt-1 ${risultatoEvento >= 0 ? "text-green-700" : "text-red-700"}`}>
                {risultatoEvento >= 0 ? "+" : ""}{formatMoney(risultatoEvento)}
              </p>
              <p className="text-[10px] text-neutral-400 mt-1">Solo entrate − uscite evento</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-neutral-400 font-medium">Saldo finale (include conto)</p>
              <p className={`text-xl font-bold tabular-nums mt-1 ${effSaldo >= 0 ? "text-green-700" : "text-red-700"}`}>
                {formatMoney(effSaldo)}
              </p>
              <p className="text-[10px] text-neutral-400 mt-1 tabular-nums">Conto Matazz: {formatMoney(saldoConto)}</p>
            </div>
          </div>
        </div>
        <div className="px-5 py-5" />
      </div>
    </div>
  );
}

function BudgetTable({
  eventoId,
  title,
  emoji,
  toneAccent,
  lines,
  stime,
  onStimaChange,
  totaleEffettivo,
  totaleStimato,
  incassoRealeVendite,
  budgetEditable = true,
}: {
  eventoId: string;
  title: string;
  emoji: string;
  toneAccent: string;
  lines: BudgetLine[];
  stime: Record<string, number>;
  onStimaChange: (chiave: string, val: number) => void;
  totaleEffettivo: number;
  totaleStimato: number;
  incassoRealeVendite: number | null;
  budgetEditable?: boolean;
}) {
  return (
    <section>
      <h3 className="text-base font-semibold text-neutral-900 mb-2 flex items-baseline gap-2">
        <span aria-hidden className={toneAccent}>
          {emoji}
        </span>
        <span>{title}</span>
      </h3>
      <div className="bg-white rounded-3xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200">
            <tr>
              <Th align="left">Voce</Th>
              <Th align="right">Budget</Th>
              <Th align="right">Costi effettivi</Th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => {
              const s = stime[l.chiave] ?? 0;
              const isOverridden =
                l.effettivoIsOverridden && incassoRealeVendite != null;
              return (
                <tr
                  key={l.chiave}
                  className={`border-b border-neutral-100 last:border-b-0 ${
                    isOverridden ? "opacity-40" : ""
                  } ${l.isIncassoReale ? "bg-amber-50/40" : ""}`}
                >
                  <td className="px-4 py-3 text-neutral-800">
                    {l.label}
                    {isOverridden && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-neutral-400">
                        sostituita
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {!budgetEditable ? (
                      <span className="text-xs text-neutral-300">—</span>
                    ) : l.isIncassoReale ? (
                      <span className="text-xs text-neutral-400 italic">
                        inserisci a fine evento →
                      </span>
                    ) : (
                      <StimaInput
                        eventoId={eventoId}
                        chiave={l.chiave}
                        value={s}
                        onChange={(v) => onStimaChange(l.chiave, v)}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-neutral-900">
                    {l.isIncassoReale ? (
                      <IncassoRealeInput
                        eventoId={eventoId}
                        value={incassoRealeVendite}
                      />
                    ) : (
                      formatMoney(l.effettivo)
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t border-neutral-200 bg-neutral-50">
            <tr>
              <td className="px-4 py-3 text-xs uppercase tracking-wide text-neutral-500 font-medium">
                Totale {title.toLowerCase()}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-neutral-300">
                {budgetEditable ? formatMoney(totaleStimato) : "—"}
              </td>
              <td className={`px-4 py-3 text-right tabular-nums font-semibold ${toneAccent}`}>
                {formatMoney(totaleEffettivo)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function StimaInput({
  eventoId,
  chiave,
  value,
  onChange,
}: {
  eventoId: string;
  chiave: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [local, setLocal] = useState<string>(String(value));
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState<boolean>(false);

  function commit() {
    const n = Number(local);
    const safe = Number.isFinite(n) ? n : 0;
    if (Math.abs(safe - value) < 0.005) return;
    onChange(safe);
    startTransition(async () => {
      const res = await salvaStima(eventoId, chiave, safe);
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1200);
      }
    });
  }

  return (
    <div className="inline-flex items-center gap-1.5 justify-end">
      <span className="text-xs text-neutral-400">CHF</span>
      <input
        type="number"
        step="0.01"
        min="0"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        disabled={pending}
        className={`w-28 px-2 py-1 rounded-lg text-sm tabular-nums text-right border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
          saved
            ? "border-green-400 bg-green-50"
            : "border-neutral-200 hover:border-neutral-300"
        }`}
      />
    </div>
  );
}

function IncassoRealeInput({
  eventoId,
  value,
}: {
  eventoId: string;
  value: number | null;
}) {
  const [mode, setMode] = useState<"display" | "edit">(
    value == null ? "edit" : "display",
  );
  const [local, setLocal] = useState<string>(value != null ? String(value) : "");
  const [current, setCurrent] = useState<number | null>(value);
  const [pending, startTransition] = useTransition();

  function save() {
    const trimmed = local.trim();
    const val = trimmed === "" ? null : Number(trimmed);
    if (val !== null && !Number.isFinite(val)) return;
    startTransition(async () => {
      const res = await salvaIncassoRealeR(eventoId, val);
      if (res.ok) {
        setCurrent(val);
        if (val != null) setMode("display");
      }
    });
  }

  if (mode === "display" && current != null) {
    return (
      <div className="inline-flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={() => { setLocal(String(current)); setMode("edit"); }}
          className="text-xs text-neutral-400 hover:text-neutral-700 underline"
        >
          Modifica
        </button>
        <span className="tabular-nums font-medium text-neutral-900">
          {formatMoney(current)}
        </span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 justify-end">
      <span className="text-xs text-neutral-400">CHF</span>
      <input
        type="number"
        step="0.01"
        min="0"
        value={local}
        placeholder="—"
        onChange={(e) => setLocal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") save(); }}
        disabled={pending}
        className="w-28 px-2 py-1 rounded-lg text-sm tabular-nums text-right border border-neutral-200 hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
      />
      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="px-2 py-1 rounded-lg bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 disabled:opacity-50"
      >
        Salva
      </button>
      {current != null && (
        <button
          type="button"
          onClick={() => setMode("display")}
          disabled={pending}
          className="text-xs text-neutral-400 hover:text-neutral-600"
        >
          Annulla
        </button>
      )}
    </div>
  );
}

function Th({
  children,
  align,
}: {
  children: React.ReactNode;
  align: "left" | "right" | "center";
}) {
  const cls =
    align === "right"
      ? "text-right"
      : align === "center"
        ? "text-center"
        : "text-left";
  return (
    <th
      className={`px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-neutral-500 ${cls}`}
    >
      {children}
    </th>
  );
}
