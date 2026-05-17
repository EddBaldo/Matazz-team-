"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  CATEGORIE_PERSONALE,
  CATEGORIA_PERSONALE_EMOJI,
} from "@/lib/personale";
import { PersonaleModal, type PersonaleEdit } from "./PersonaleModal";

export type PersonaleScoutingRow = PersonaleEdit & {
  creatoDaNome: string | null;
};

type Props = {
  rows: PersonaleScoutingRow[];
};

export function PersonaleScoutingClient({ rows }: Props) {
  const [modal, setModal] = useState<
    { kind: "add" } | { kind: "edit"; persona: PersonaleEdit } | null
  >(null);

  const grouped = new Map<string, PersonaleScoutingRow[]>();
  for (const r of rows) {
    const cat = r.categoria || "Altro";
    const bucket = grouped.get(cat) ?? [];
    bucket.push(r);
    grouped.set(cat, bucket);
  }
  for (const bucket of grouped.values()) {
    bucket.sort((a, b) =>
      `${a.cognome} ${a.nome}`.localeCompare(`${b.cognome} ${b.nome}`, "it"),
    );
  }

  const orderedCategorie = [
    ...CATEGORIE_PERSONALE.filter((c) => grouped.has(c)),
    ...[...grouped.keys()]
      .filter((c) => !(CATEGORIE_PERSONALE as readonly string[]).includes(c))
      .sort((a, b) => a.localeCompare(b, "it")),
  ];

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-neutral-600">
          {rows.length === 0
            ? "Aggiungi la prima persona alla rubrica."
            : "Clicca su una riga per modificare la persona."}
        </p>
        <button
          type="button"
          onClick={() => setModal({ kind: "add" })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
        >
          <Plus className="w-4 h-4" />
          Nuova persona
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center">
          <p className="text-neutral-600">Nessuna persona in rubrica.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {orderedCategorie.map((cat) => {
            const bucket = grouped.get(cat);
            if (!bucket || bucket.length === 0) return null;
            const emoji =
              (CATEGORIA_PERSONALE_EMOJI as Record<string, string>)[cat] ??
              "👤";
            return (
              <section key={cat}>
                <h3 className="text-base font-semibold text-neutral-900 mb-2 flex items-baseline gap-2">
                  <span aria-hidden>{emoji}</span>
                  <span>{cat}</span>
                  <span className="text-sm text-neutral-500 font-normal">
                    ({bucket.length})
                  </span>
                </h3>
                <PersonaleTable
                  rows={bucket}
                  onRowClick={(r) =>
                    setModal({ kind: "edit", persona: r })
                  }
                />
              </section>
            );
          })}
        </div>
      )}

      <PersonaleModal mode={modal} onClose={() => setModal(null)} />
    </>
  );
}

function PersonaleTable({
  rows,
  onRowClick,
}: {
  rows: PersonaleScoutingRow[];
  onRowClick: (r: PersonaleScoutingRow) => void;
}) {
  return (
    <div className="bg-white rounded-3xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-neutral-200">
          <tr>
            <Th align="left">Nome</Th>
            <Th align="left">Ruolo</Th>
            <Th align="left">Contatti</Th>
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
              <td className="px-4 py-3 text-neutral-700">
                {r.ruolo_principale}
              </td>
              <td className="px-4 py-3 text-neutral-700">
                {r.contatti ?? "—"}
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
