"use client";

import { useMemo, useState } from "react";
import { Plus, ExternalLink } from "lucide-react";
import { TIPI_SPONSOR } from "../constants";
import { SponsorModal, type SponsorEdit } from "./SponsorModal";

const TIPO_BADGE: Record<string, string> = {
  Fondazione: "bg-blue-100 text-blue-800",
  Banca: "bg-green-100 text-green-800",
  "Food & Beverage": "bg-amber-100 text-amber-800",
  Privato: "bg-purple-100 text-purple-800",
  Altro: "bg-neutral-200 text-neutral-700",
};

const FILTRI = ["Tutti", ...TIPI_SPONSOR] as const;

type Props = {
  rows: SponsorEdit[];
};

export function ScoutingSponsorClient({ rows }: Props) {
  const [modal, setModal] = useState<
    { kind: "add" } | { kind: "edit"; sponsor: SponsorEdit } | null
  >(null);
  const [filtro, setFiltro] = useState<string>("Tutti");

  const filtrati = useMemo(
    () => (filtro === "Tutti" ? rows : rows.filter((r) => r.tipo === filtro)),
    [rows, filtro],
  );

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-neutral-600">
          {rows.length === 0
            ? "Aggiungi il primo sponsor alla rubrica."
            : "Clicca su una riga per modificare lo sponsor."}
        </p>
        <button
          type="button"
          onClick={() => setModal({ kind: "add" })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
        >
          <Plus className="w-4 h-4" />
          Nuovo sponsor
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTRI.map((f) => {
          const isActive = filtro === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? "bg-neutral-900 text-white"
                  : "bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      {filtrati.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center">
          <p className="text-neutral-600">
            {filtro === "Tutti"
              ? "Nessuno sponsor in rubrica."
              : `Nessuno sponsor di tipo "${filtro}".`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200">
              <tr>
                <Th align="left">Sponsor</Th>
                <Th align="left">Tipo</Th>
                <Th align="left">Contatto</Th>
                <Th align="left">Città</Th>
                <Th align="left">Sito</Th>
              </tr>
            </thead>
            <tbody>
              {filtrati.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setModal({ kind: "edit", sponsor: r })}
                  className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 cursor-pointer"
                >
                  <td className="px-4 py-3 text-neutral-900 font-medium">
                    {r.nome}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        TIPO_BADGE[r.tipo] ?? "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {r.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {r.contatto ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {r.indirizzo ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {r.sito_web ? (
                      <a
                        href={r.sito_web}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SponsorModal mode={modal} onClose={() => setModal(null)} />
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
