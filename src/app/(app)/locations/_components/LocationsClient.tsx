"use client";

import { useState } from "react";
import { Plus, ExternalLink } from "lucide-react";
import { STATI_LOCATION, STATO_EMOJI } from "@/lib/locations";
import { LocationModal, type LocationEdit } from "./LocationModal";
import { formatMoney } from "@/lib/format";

export type LocationRow = LocationEdit & {
  creatoDaNome: string | null;
};

type Props = {
  rows: LocationRow[];
};

export function LocationsClient({ rows }: Props) {
  const [modal, setModal] = useState<
    { kind: "add" } | { kind: "edit"; location: LocationEdit } | null
  >(null);

  const grouped = new Map<string, LocationRow[]>();
  for (const r of rows) {
    const stato = r.stato || "Svizzera";
    const bucket = grouped.get(stato) ?? [];
    bucket.push(r);
    grouped.set(stato, bucket);
  }
  for (const bucket of grouped.values()) {
    bucket.sort((a, b) => a.nome.localeCompare(b.nome, "it"));
  }

  const orderedStati = [
    ...STATI_LOCATION.filter((s) => grouped.has(s)),
    ...[...grouped.keys()]
      .filter((s) => !(STATI_LOCATION as readonly string[]).includes(s))
      .sort((a, b) => a.localeCompare(b, "it")),
  ];

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-neutral-600">
          {rows.length === 0
            ? "Aggiungi la prima location alla rubrica."
            : "Clicca su una riga per modificare la location."}
        </p>
        <button
          type="button"
          onClick={() => setModal({ kind: "add" })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
        >
          <Plus className="w-4 h-4" />
          Nuova location
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center">
          <p className="text-neutral-600">Nessuna location in rubrica.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {orderedStati.map((stato) => {
            const bucket = grouped.get(stato);
            if (!bucket || bucket.length === 0) return null;
            return (
              <section key={stato}>
                <h3 className="text-base font-semibold text-neutral-900 mb-2 flex items-baseline gap-2">
                  <span aria-hidden>{STATO_EMOJI[stato] ?? "📍"}</span>
                  <span>{stato}</span>
                  <span className="text-sm text-neutral-500 font-normal">
                    ({bucket.length})
                  </span>
                </h3>
                <LocationsTable
                  rows={bucket}
                  onRowClick={(r) =>
                    setModal({ kind: "edit", location: r })
                  }
                />
              </section>
            );
          })}
        </div>
      )}

      <LocationModal mode={modal} onClose={() => setModal(null)} />
    </>
  );
}

function LocationsTable({
  rows,
  onRowClick,
}: {
  rows: LocationRow[];
  onRowClick: (r: LocationRow) => void;
}) {
  return (
    <div className="bg-white rounded-3xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-neutral-200">
          <tr>
            <Th align="left">Nome</Th>
            <Th align="left">Città</Th>
            <Th align="left">Indirizzo</Th>
            <Th align="right">Capienza</Th>
            <Th align="right">Costo</Th>
            <Th align="left">Referente</Th>
            <Th align="left">Link</Th>
            <Th align="left">Proposto da</Th>
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
                {r.nome}
              </td>
              <td className="px-4 py-3 text-neutral-700">{r.citta}</td>
              <td className="px-4 py-3 text-neutral-700">
                {r.indirizzo ?? "—"}
              </td>
              <td className="px-4 py-3 text-neutral-700 text-right">
                {r.capienza ?? "—"}
              </td>
              <td className="px-4 py-3 text-neutral-700 text-right">
                {r.costo_tipico != null
                  ? formatMoney(Number(r.costo_tipico))
                  : "—"}
              </td>
              <td className="px-4 py-3 text-neutral-700">
                {r.contatti_referente ?? "—"}
              </td>
              <td className="px-4 py-3">
                {r.link ? (
                  <a
                    href={r.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-800 hover:underline"
                  >
                    Apri <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-neutral-500">—</span>
                )}
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
