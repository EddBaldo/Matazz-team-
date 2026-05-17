"use client";

import { useState, useTransition } from "react";
import { formatMoney } from "@/lib/format";
import { salvaStima } from "../actions";

export type BudgetLine = {
  chiave: string;
  label: string;
  effettivo: number;
  stima: number;
};

type Props = {
  eventoId: string;
  uscite: BudgetLine[];
  entrate: BudgetLine[];
  saldoConto: number;
};

export function BudgetClient({
  eventoId,
  uscite,
  entrate,
  saldoConto,
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
      {/* 2 card riepilogo: Budget | Costi effettivi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SummaryColumn
          label="Budget"
          entrate={totaleStimEntrate}
          uscite={totaleStimUscite}
          saldo={saldoStimato}
          saldoConto={saldoConto}
          subtle
        />
        <SummaryColumn
          label="Costi effettivi"
          entrate={totaleEffEntrate}
          uscite={totaleEffUscite}
          saldo={saldoEffettivo}
          saldoConto={saldoConto}
        />
      </div>

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

function SummaryColumn({
  label,
  entrate,
  uscite,
  saldo,
  saldoConto,
  subtle,
}: {
  label: string;
  entrate: number;
  uscite: number;
  saldo: number;
  saldoConto: number;
  subtle?: boolean;
}) {
  return (
    <div className="rounded-3xl bg-white p-6">
      <p className="text-xs uppercase tracking-wide text-neutral-500 font-medium">
        {label}
      </p>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-neutral-400 font-medium">
            Entrate
          </p>
          <p
            className={`text-xl font-semibold tabular-nums mt-0.5 ${
              subtle ? "text-green-600" : "text-green-700"
            }`}
          >
            {formatMoney(entrate)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-neutral-400 font-medium">
            Uscite
          </p>
          <p
            className={`text-xl font-semibold tabular-nums mt-0.5 ${
              subtle ? "text-red-600" : "text-red-700"
            }`}
          >
            {formatMoney(uscite)}
          </p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-neutral-100">
        <p className="text-[10px] uppercase tracking-wide text-neutral-400 font-medium">
          Saldo (include conto)
        </p>
        <p
          className={`text-3xl font-semibold tabular-nums mt-1 ${
            saldo >= 0 ? "text-green-700" : "text-red-700"
          }`}
        >
          {formatMoney(saldo)}
        </p>
        <p className="text-[10px] text-neutral-400 mt-1 tabular-nums">
          Conto Matazz: {formatMoney(saldoConto)}
        </p>
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
              return (
                <tr
                  key={l.chiave}
                  className="border-b border-neutral-100 last:border-b-0"
                >
                  <td className="px-4 py-3 text-neutral-800">{l.label}</td>
                  <td className="px-4 py-2 text-right">
                    <StimaInput
                      eventoId={eventoId}
                      chiave={l.chiave}
                      value={s}
                      onChange={(v) => onStimaChange(l.chiave, v)}
                    />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-neutral-900">
                    {formatMoney(l.effettivo)}
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
              <td className="px-4 py-3 text-right tabular-nums font-semibold text-neutral-700">
                {formatMoney(totaleStimato)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums font-semibold text-neutral-900">
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
