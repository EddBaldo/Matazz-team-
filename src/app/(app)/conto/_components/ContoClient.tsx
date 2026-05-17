"use client";

import { useState } from "react";
import { Plus, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { formatMoney, formatDateIT } from "@/lib/format";
import { MovimentoModal, type MovimentoEdit } from "./MovimentoModal";

export type MovimentoRow = MovimentoEdit & {
  creatoDaNome: string | null;
};

type Props = {
  rows: MovimentoRow[];
};

export function ContoClient({ rows }: Props) {
  const [modal, setModal] = useState<
    { kind: "add" } | { kind: "edit"; movimento: MovimentoEdit } | null
  >(null);

  const sorted = [...rows].sort((a, b) => (a.data < b.data ? 1 : -1));
  const saldo = sorted.reduce((s, r) => s + r.importo, 0);
  const totEntrate = sorted
    .filter((r) => r.importo > 0)
    .reduce((s, r) => s + r.importo, 0);
  const totUscite = sorted
    .filter((r) => r.importo < 0)
    .reduce((s, r) => s + r.importo, 0);

  return (
    <>
      <div className="flex items-center justify-end gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => setModal({ kind: "add" })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
        >
          <Plus className="w-4 h-4" />
          Nuovo movimento
        </button>
      </div>

      <div className="rounded-3xl bg-[#F8F1DF] p-6 sm:p-8">
        <div className="flex items-center gap-2 text-neutral-700">
          <Wallet className="w-4 h-4" />
          <h3 className="text-sm font-medium uppercase tracking-wide text-neutral-500">
            Saldo conto
          </h3>
        </div>
        <p
          className={`text-4xl sm:text-5xl font-semibold tabular-nums mt-3 ${
            saldo >= 0 ? "text-neutral-900" : "text-red-600"
          }`}
        >
          {formatMoney(saldo)}
        </p>
        <div className="grid grid-cols-2 gap-6 mt-6 max-w-sm">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <TrendingUp className="w-3.5 h-3.5 text-green-600" />
              Entrate
            </div>
            <p className="font-semibold tabular-nums text-neutral-900 mt-1">
              {formatMoney(totEntrate)}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              Uscite
            </div>
            <p className="font-semibold tabular-nums text-neutral-900 mt-1">
              {formatMoney(totUscite)}
            </p>
          </div>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center">
          <p className="text-neutral-600">
            Nessun movimento. Aggiungi il primo per iniziare a tenere traccia
            del conto.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200">
              <tr>
                <Th align="left">Data</Th>
                <Th align="left">Descrizione</Th>
                <Th align="right">Importo</Th>
                <Th align="left">Da</Th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setModal({ kind: "edit", movimento: r })}
                  className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 cursor-pointer"
                >
                  <td className="px-4 py-3 text-neutral-700 whitespace-nowrap tabular-nums">
                    {formatDateIT(r.data)}
                  </td>
                  <td className="px-4 py-3 text-neutral-900 font-medium">
                    {r.descrizione}
                  </td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums font-semibold ${
                      r.importo >= 0 ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {r.importo >= 0 ? "+" : ""}
                    {formatMoney(r.importo)}
                  </td>
                  <td className="px-4 py-3 text-neutral-500 text-xs">
                    {r.creatoDaNome ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <MovimentoModal mode={modal} onClose={() => setModal(null)} />
    </>
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
