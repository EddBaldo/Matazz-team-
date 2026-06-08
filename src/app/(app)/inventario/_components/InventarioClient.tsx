"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  CATEGORIA_INVENTARIO_EMOJI,
  CATEGORIE_INVENTARIO,
  CONDIZIONE_BADGE,
  type CategoriaInventario,
} from "@/lib/inventario";
import { InventarioModal, type InventarioEdit } from "./InventarioModal";

export type InventarioRow = InventarioEdit & {
  creatoDaNome: string | null;
};

type Props = {
  rows: InventarioRow[];
};

type FiltroCategoria = "tutte" | CategoriaInventario;

export function InventarioClient({ rows }: Props) {
  const [modal, setModal] = useState<
    { kind: "add" } | { kind: "edit"; articolo: InventarioEdit } | null
  >(null);
  const [filtro, setFiltro] = useState<FiltroCategoria>("tutte");

  const filtered =
    filtro === "tutte" ? rows : rows.filter((r) => r.categoria === filtro);

  const sorted = [...filtered].sort((a, b) =>
    a.articolo.localeCompare(b.articolo, "it"),
  );

  // Raggruppamento per categoria (rispetta l'ordine definito in CATEGORIE_INVENTARIO)
  const grouped = new Map<CategoriaInventario, InventarioRow[]>();
  for (const r of sorted) {
    const cat = (CATEGORIE_INVENTARIO as readonly string[]).includes(
      r.categoria,
    )
      ? (r.categoria as CategoriaInventario)
      : ("Altro" as CategoriaInventario);
    const bucket = grouped.get(cat) ?? [];
    bucket.push(r);
    grouped.set(cat, bucket);
  }

  // Contatori per i chip del filtro (calcolati su rows non filtrate)
  const conteggi = new Map<CategoriaInventario, number>();
  for (const r of rows) {
    const cat = (CATEGORIE_INVENTARIO as readonly string[]).includes(
      r.categoria,
    )
      ? (r.categoria as CategoriaInventario)
      : ("Altro" as CategoriaInventario);
    conteggi.set(cat, (conteggi.get(cat) ?? 0) + 1);
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <FiltroChip
            active={filtro === "tutte"}
            onClick={() => setFiltro("tutte")}
          >
            Tutte ({rows.length})
          </FiltroChip>
          {CATEGORIE_INVENTARIO.map((c) => {
            const n = conteggi.get(c) ?? 0;
            return (
              <FiltroChip
                key={c}
                active={filtro === c}
                onClick={() => setFiltro(c)}
              >
                {CATEGORIA_INVENTARIO_EMOJI[c]} {c} ({n})
              </FiltroChip>
            );
          })}
        </div>
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
          <p className="text-neutral-600">
            {filtro === "tutte"
              ? "Nessun articolo in inventario."
              : "Nessun articolo in questa categoria."}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {CATEGORIE_INVENTARIO.map((cat) => {
            const bucket = grouped.get(cat);
            if (!bucket || bucket.length === 0) return null;
            return (
              <section key={cat}>
                <h3 className="text-base font-semibold text-neutral-900 mb-2 flex items-baseline gap-2">
                  <span aria-hidden>{CATEGORIA_INVENTARIO_EMOJI[cat]}</span>
                  <span>{cat}</span>
                  <span className="text-sm text-neutral-500 font-normal">
                    ({bucket.length})
                  </span>
                </h3>
                <InventarioTable
                  rows={bucket}
                  onRowClick={(r) =>
                    setModal({ kind: "edit", articolo: r })
                  }
                />
              </section>
            );
          })}
        </div>
      )}

      <InventarioModal mode={modal} onClose={() => setModal(null)} />
    </>
  );
}

function FiltroChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        active
          ? "bg-neutral-900 text-white"
          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
      }`}
    >
      {children}
    </button>
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
