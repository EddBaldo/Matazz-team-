"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CONDIZIONE_BADGE } from "@/lib/inventario";
import { InventarioModal, type InventarioEdit } from "./InventarioModal";

export type InventarioRow = InventarioEdit & {
  creatoDaNome: string | null;
};

type Props = {
  rows: InventarioRow[];
};

export function InventarioClient({ rows }: Props) {
  const [modal, setModal] = useState<
    { kind: "add" } | { kind: "edit"; articolo: InventarioEdit } | null
  >(null);

  const sorted = [...rows].sort((a, b) =>
    a.articolo.localeCompare(b.articolo, "it"),
  );

  return (
    <>
      <div className="flex items-center justify-end gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => setModal({ kind: "add" })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
        >
          <Plus className="w-4 h-4" />
          Nuovo articolo
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center">
          <p className="text-neutral-600">Nessun articolo in inventario.</p>
        </div>
      ) : (
        <InventarioTable
          rows={sorted}
          onRowClick={(r) => setModal({ kind: "edit", articolo: r })}
        />
      )}

      <InventarioModal mode={modal} onClose={() => setModal(null)} />
    </>
  );
}

function InventarioTable({
  rows,
  onRowClick,
}: {
  rows: InventarioRow[];
  onRowClick: (r: InventarioRow) => void;
}) {
  return (
    <div className="bg-white rounded-3xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-neutral-200">
          <tr>
            <Th align="left">Articolo</Th>
            <Th align="right">Quantità</Th>
            <Th align="left">Dove si trova</Th>
            <Th align="left">Condizione</Th>
            <Th align="left">Aggiunto da</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              onClick={() => onRowClick(r)}
              className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 cursor-pointer"
            >
              <td className="px-4 py-3 text-neutral-900 font-medium">
                {r.articolo}
              </td>
              <td className="px-4 py-3 text-neutral-700 text-right">
                {r.quantita}
              </td>
              <td className="px-4 py-3 text-neutral-700">
                {r.dove_si_trova ?? "—"}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    CONDIZIONE_BADGE[r.condizione] ??
                    "bg-neutral-100 text-neutral-700"
                  }`}
                >
                  {r.condizione}
                </span>
              </td>
              <td className="px-4 py-3 text-neutral-700">
                {r.creatoDaNome ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
