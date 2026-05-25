"use client";

import { useState, useTransition } from "react";
import { Plus, Check, Circle } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { togglePresoR } from "../actions";
import { MaterialeModal, type MaterialeEdit } from "./MaterialeModal";

export type MaterialeRow = MaterialeEdit;

type Props = {
  eventoId: string;
  rows: MaterialeRow[];
};

export function MaterialiClient({ eventoId, rows }: Props) {
  const [modal, setModal] = useState<
    { kind: "add" } | { kind: "edit"; materiale: MaterialeEdit } | null
  >(null);

  const presi = rows.filter((r) => r.preso).length;
  const totaleDaComprare = rows
    .filter((r) => !r.gia_disponibile)
    .reduce(
      (s, r) => s + Number(r.prezzo_unitario ?? 0) * Number(r.quantita),
      0,
    );

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-neutral-600">
          {rows.length === 0
            ? "Aggiungi il primo materiale."
            : `${presi} / ${rows.length} presi · Totale da comprare ${formatMoney(totaleDaComprare)}`}
        </p>
        <button
          type="button"
          onClick={() => setModal({ kind: "add" })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
        >
          <Plus className="w-4 h-4" />
          Aggiungi materiale
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center">
          <p className="text-neutral-600">Nessun materiale ancora.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200">
              <tr>
                <Th align="center" w="w-12">
                  <span className="sr-only">Preso</span>
                </Th>
                <Th align="left">Materiale</Th>
                <Th align="right">Qt.</Th>
                <Th align="left">A cosa serve</Th>
                <Th align="left">Dove lo prendiamo</Th>
                <Th align="right">Prezzo unit.</Th>
                <Th align="right">Subtotale</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <MaterialeRowItem
                  key={r.id}
                  eventoId={eventoId}
                  row={r}
                  onClick={() => setModal({ kind: "edit", materiale: r })}
                />
              ))}
            </tbody>
            <tfoot className="border-t border-neutral-200 bg-neutral-50">
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-3 text-xs uppercase tracking-wide text-neutral-500 text-right font-medium"
                >
                  Totale da comprare
                </td>
                <td className="px-4 py-3 text-sm text-neutral-900 text-right font-semibold tabular-nums">
                  {formatMoney(totaleDaComprare)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <MaterialeModal
        eventoId={eventoId}
        mode={modal}
        onClose={() => setModal(null)}
      />
    </>
  );
}

function MaterialeRowItem({
  eventoId,
  row,
  onClick,
}: {
  eventoId: string;
  row: MaterialeRow;
  onClick: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      await togglePresoR(eventoId, row.id, !row.preso);
    });
  }

  const subtotale =
    Number(row.prezzo_unitario ?? 0) * Number(row.quantita);

  return (
    <tr
      onClick={onClick}
      className={`border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 cursor-pointer ${
        row.preso ? "opacity-60" : ""
      }`}
    >
      <td className="px-3 py-3 text-center">
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          aria-label={row.preso ? "Segna come da prendere" : "Segna come preso"}
          className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors disabled:opacity-50 ${
            row.preso
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
          }`}
        >
          {row.preso ? (
            <Check className="w-4 h-4" />
          ) : (
            <Circle className="w-4 h-4" />
          )}
        </button>
      </td>
      <td className="px-4 py-3">
        <span
          className={`text-neutral-900 font-medium ${
            row.preso ? "line-through" : ""
          }`}
        >
          {row.articolo}
        </span>
        {row.gia_disponibile && (
          <span className="ml-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-700">
            già disponibile
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-neutral-900 text-right tabular-nums">
        {row.quantita}
      </td>
      <td className="px-4 py-3 text-neutral-700">
        {row.a_cosa_serve ?? "—"}
      </td>
      <td className="px-4 py-3 text-neutral-700">
        <DoveLoPrendiamoCell value={row.dove_lo_prendiamo} />
      </td>
      <td className="px-4 py-3 text-neutral-700 text-right tabular-nums">
        {row.prezzo_unitario != null
          ? formatMoney(Number(row.prezzo_unitario))
          : "—"}
      </td>
      <td className="px-4 py-3 text-neutral-900 text-right tabular-nums font-medium">
        {formatMoney(subtotale)}
      </td>
    </tr>
  );
}

function DoveLoPrendiamoCell({ value }: { value: string | null }) {
  if (!value) return <>—</>;
  const trimmed = value.trim();
  const isUrl = /^https?:\/\//i.test(trimmed);
  if (!isUrl) return <>{value}</>;
  let label: string;
  try {
    label = new URL(trimmed).hostname.replace(/^www\./, "");
  } catch {
    label = trimmed;
  }
  return (
    <a
      href={trimmed}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="text-amber-700 underline decoration-amber-300 hover:decoration-amber-700"
      title={trimmed}
    >
      {label}
    </a>
  );
}

function Th({
  children,
  align,
  w,
}: {
  children: React.ReactNode;
  align: "left" | "right" | "center";
  w?: string;
}) {
  const cls =
    align === "right"
      ? "text-right"
      : align === "center"
        ? "text-center"
        : "text-left";
  return (
    <th
      className={`px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-neutral-500 ${cls} ${w ?? ""}`}
    >
      {children}
    </th>
  );
}
