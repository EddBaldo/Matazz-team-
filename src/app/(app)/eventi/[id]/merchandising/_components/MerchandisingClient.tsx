"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { formatMoney } from "@/lib/format";
import {
  MerchandisingModal,
  type MerchandisingEdit,
} from "./MerchandisingModal";

export type MerchandisingRow = MerchandisingEdit;

type Props = {
  eventoId: string;
  rows: MerchandisingRow[];
};

export function MerchandisingClient({ eventoId, rows }: Props) {
  const [modal, setModal] = useState<
    { kind: "add" } | { kind: "edit"; merch: MerchandisingEdit } | null
  >(null);

  const totaleSpesa = rows.reduce((s, r) => s + Number(r.costo_totale), 0);
  const totaleStima = rows.reduce((s, r) => s + Number(r.ricavo_stimato), 0);
  const margine = totaleStima - totaleSpesa;

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-neutral-600">
          {rows.length === 0
            ? "Aggiungi il primo articolo merch."
            : `${rows.length} ${rows.length === 1 ? "articolo" : "articoli"} · spesa ${formatMoney(totaleSpesa)} · stima ricavo ${formatMoney(totaleStima)} · margine stimato ${margine >= 0 ? "+" : ""}${formatMoney(margine)}`}
        </p>
        <button
          type="button"
          onClick={() => setModal({ kind: "add" })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
        >
          <Plus className="w-4 h-4" />
          Aggiungi articolo
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center">
          <p className="text-neutral-600">Nessun articolo merch ancora.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200">
              <tr>
                <Th align="left">Articolo</Th>
                <Th align="right">Pezzi</Th>
                <Th align="right">Costo tot.</Th>
                <Th align="right">Stima ricavo</Th>
                <Th align="right">Margine stimato</Th>
                <Th align="left">Note</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const m = Number(r.ricavo_stimato) - Number(r.costo_totale);
                return (
                  <tr
                    key={r.id}
                    onClick={() => setModal({ kind: "edit", merch: r })}
                    className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-neutral-900 font-medium">
                      {r.articolo}
                    </td>
                    <td className="px-4 py-3 text-neutral-900 text-right tabular-nums">
                      {r.quantita}
                    </td>
                    <td className="px-4 py-3 text-neutral-700 text-right tabular-nums">
                      {formatMoney(Number(r.costo_totale))}
                    </td>
                    <td className="px-4 py-3 text-neutral-700 text-right tabular-nums">
                      {formatMoney(Number(r.ricavo_stimato))}
                    </td>
                    <td
                      className={`px-4 py-3 text-right tabular-nums font-medium ${
                        m >= 0 ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {m >= 0 ? "+" : ""}
                      {formatMoney(m)}
                    </td>
                    <td className="px-4 py-3 text-neutral-700 text-sm">
                      {r.note ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t border-neutral-200 bg-neutral-50">
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-3 text-xs uppercase tracking-wide text-neutral-500 text-right font-medium"
                >
                  Totali
                </td>
                <td className="px-4 py-3 text-sm text-neutral-900 text-right font-semibold tabular-nums">
                  {formatMoney(totaleSpesa)}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-900 text-right font-semibold tabular-nums">
                  {formatMoney(totaleStima)}
                </td>
                <td
                  className={`px-4 py-3 text-sm text-right font-semibold tabular-nums ${
                    margine >= 0 ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {margine >= 0 ? "+" : ""}
                  {formatMoney(margine)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <MerchandisingModal
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
