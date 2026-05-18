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

  const totale = rows.reduce(
    (s, r) => s + Number(r.costo_unitario) * Number(r.quantita),
    0,
  );

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-neutral-600">
          {rows.length === 0
            ? "Aggiungi il primo articolo merch."
            : `${rows.length} ${rows.length === 1 ? "articolo" : "articoli"} · Totale produzione ${formatMoney(totale)}`}
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
                <Th align="right">Qt.</Th>
                <Th align="right">Costo unit.</Th>
                <Th align="right">Totale</Th>
                <Th align="left">Note</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const subtotale = Number(r.costo_unitario) * Number(r.quantita);
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
                      {formatMoney(Number(r.costo_unitario))}
                    </td>
                    <td className="px-4 py-3 text-neutral-900 text-right tabular-nums font-medium">
                      {formatMoney(subtotale)}
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
                  colSpan={3}
                  className="px-4 py-3 text-xs uppercase tracking-wide text-neutral-500 text-right font-medium"
                >
                  Totale produzione
                </td>
                <td className="px-4 py-3 text-sm text-neutral-900 text-right font-semibold tabular-nums">
                  {formatMoney(totale)}
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
