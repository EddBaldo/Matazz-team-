"use client";

import { useState } from "react";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { VoceExtraModal, type VoceExtraEdit } from "./VoceExtraModal";

type Props = {
  eventoId: string;
  rows: VoceExtraEdit[];
};

export function VociExtraClient({ eventoId, rows }: Props) {
  const [modal, setModal] = useState<
    { kind: "add" } | { kind: "edit"; voce: VoceExtraEdit } | null
  >(null);

  const totaleEntrate = rows
    .filter((r) => r.tipo === "Entrata")
    .reduce((s, r) => s + Number(r.importo), 0);
  const totaleUscite = rows
    .filter((r) => r.tipo === "Uscita")
    .reduce((s, r) => s + Number(r.importo), 0);

  return (
    <>
      <div className="flex items-center justify-end gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => setModal({ kind: "add" })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
        >
          <Plus className="w-4 h-4" />
          Aggiungi voce
        </button>
      </div>

      {rows.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white p-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500 font-medium">
                Totale entrate
              </p>
              <p className="text-2xl font-semibold text-green-700 tabular-nums mt-1">
                {formatMoney(totaleEntrate)}
              </p>
            </div>
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div className="rounded-2xl bg-white p-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500 font-medium">
                Totale uscite
              </p>
              <p className="text-2xl font-semibold text-red-700 tabular-nums mt-1">
                {formatMoney(totaleUscite)}
              </p>
            </div>
            <TrendingDown className="w-6 h-6 text-red-500" />
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center">
          <p className="text-neutral-600">Nessuna voce ancora.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200">
              <tr>
                <Th align="left">Voce</Th>
                <Th align="left">Categoria</Th>
                <Th align="left">Tipo</Th>
                <Th align="right">Importo</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setModal({ kind: "edit", voce: r })}
                  className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 cursor-pointer"
                >
                  <td className="px-4 py-3 text-neutral-900 font-medium">
                    {r.voce}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {r.categoria ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.tipo === "Entrata"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {r.tipo}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums font-medium ${
                      r.tipo === "Entrata" ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {r.tipo === "Entrata" ? "+" : "−"}
                    {formatMoney(Number(r.importo))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <VoceExtraModal
        eventoId={eventoId}
        mode={modal}
        onClose={() => setModal(null)}
      />
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
