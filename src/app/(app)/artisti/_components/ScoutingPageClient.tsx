"use client";

import { useState } from "react";
import { Plus, ExternalLink } from "lucide-react";
import {
  MACRO_TIPI_ARTE,
  MACRO_EMOJI,
  macroFromTipoArte,
  type MacroTipoArte,
} from "@/lib/artisti";
import { ArtistaModal, type ArtistaEdit } from "./ArtistaModal";

export type ScoutingRow = ArtistaEdit & {
  creatoDaNome: string | null;
};

type Props = {
  rows: ScoutingRow[];
};

export function ScoutingPageClient({ rows }: Props) {
  const [modal, setModal] = useState<
    { kind: "add" } | { kind: "edit"; artista: ArtistaEdit } | null
  >(null);

  const grouped = new Map<MacroTipoArte, ScoutingRow[]>();
  for (const r of rows) {
    const macro = macroFromTipoArte(r.tipo_arte);
    const bucket = grouped.get(macro) ?? [];
    bucket.push(r);
    grouped.set(macro, bucket);
  }
  for (const bucket of grouped.values()) {
    bucket.sort((a, b) =>
      `${a.nome} ${a.cognome}`.localeCompare(`${b.nome} ${b.cognome}`, "it"),
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-neutral-600">
          {rows.length === 0
            ? "Aggiungi il primo artista alla rubrica."
            : "Clicca su una riga per modificare l'artista."}
        </p>
        <button
          type="button"
          onClick={() => setModal({ kind: "add" })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
        >
          <Plus className="w-4 h-4" />
          Nuovo artista
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center">
          <p className="text-neutral-600">Nessun artista in rubrica.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {MACRO_TIPI_ARTE.map((macro) => {
            const bucket = grouped.get(macro);
            if (!bucket || bucket.length === 0) return null;
            return (
              <section key={macro}>
                <h3 className="text-base font-semibold text-neutral-900 mb-2 flex items-baseline gap-2">
                  <span aria-hidden>{MACRO_EMOJI[macro]}</span>
                  <span>{macro}</span>
                  <span className="text-sm text-neutral-500 font-normal">
                    ({bucket.length})
                  </span>
                </h3>
                <ScoutingTable
                  rows={bucket}
                  onRowClick={(r) =>
                    setModal({ kind: "edit", artista: r })
                  }
                />
              </section>
            );
          })}
        </div>
      )}

      <ArtistaModal mode={modal} onClose={() => setModal(null)} />
    </>
  );
}

function ScoutingTable({
  rows,
  onRowClick,
}: {
  rows: ScoutingRow[];
  onRowClick: (r: ScoutingRow) => void;
}) {
  return (
    <div className="bg-white rounded-3xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-neutral-200">
          <tr>
            <Th align="left">Nome</Th>
            <Th align="left">Tipo arte</Th>
            <Th align="left">Residenza</Th>
            <Th align="left">Link</Th>
            <Th align="left">Opera</Th>
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
                {r.nome} {r.cognome}
              </td>
              <td className="px-4 py-3 text-neutral-700">{r.tipo_arte}</td>
              <td className="px-4 py-3 text-neutral-700">
                {r.residenza ?? "—"}
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
              <td className="px-4 py-3">
                {r.link_opera ? (
                  <a
                    href={r.link_opera}
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
