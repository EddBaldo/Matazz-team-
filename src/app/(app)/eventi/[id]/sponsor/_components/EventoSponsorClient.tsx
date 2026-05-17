"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { formatMoney, formatDateIT } from "@/lib/format";
import {
  AggiungiSponsorModal,
  type SponsorRubrica,
} from "./AggiungiSponsorModal";
import {
  ModificaEventoSponsorModal,
  type EventoSponsorEdit,
  type TeamMember,
} from "./ModificaEventoSponsorModal";

const STATO_BADGE: Record<string, string> = {
  "Da contattare": "bg-neutral-200 text-neutral-700",
  Contattato: "bg-amber-100 text-amber-800",
  Confermato: "bg-green-100 text-green-800",
  Rifiutato: "bg-red-100 text-red-800",
};

type Props = {
  eventoId: string;
  rows: EventoSponsorEdit[];
  rubrica: SponsorRubrica[];
  team: TeamMember[];
};

export function EventoSponsorClient({
  eventoId,
  rows,
  rubrica,
  team,
}: Props) {
  const [editing, setEditing] = useState<EventoSponsorEdit | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const giaCollegati = new Set(rows.map((r) => r.sponsorId));

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-neutral-600">
          {rows.length === 0
            ? "Aggiungi il primo sponsor all'evento."
            : "Clicca su una riga per modificare stato e importo."}
        </p>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
        >
          <Plus className="w-4 h-4" />
          Aggiungi sponsor
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center">
          <p className="text-neutral-600">Nessuno sponsor ancora.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200">
              <tr>
                <Th align="left">Sponsor</Th>
                <Th align="left">Tipo</Th>
                <Th align="left">Chi contatta</Th>
                <Th align="left">Stato</Th>
                <Th align="right">Importo</Th>
                <Th align="left">Data contatto</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setEditing(r)}
                  className={`border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 cursor-pointer ${
                    r.stato === "Confermato" ? "bg-green-50/40" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-neutral-900 font-medium">
                    {r.sponsorNome}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {r.sponsorTipo}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {r.chiContattoNome ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        STATO_BADGE[r.stato] ??
                        "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {r.stato}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-900 text-right font-medium tabular-nums">
                    {r.importo > 0 ? formatMoney(Number(r.importo)) : "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {r.data_contatto ? formatDateIT(r.data_contatto) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AggiungiSponsorModal
        eventoId={eventoId}
        open={addOpen}
        rubrica={rubrica}
        giaCollegati={giaCollegati}
        onClose={() => setAddOpen(false)}
      />

      <ModificaEventoSponsorModal
        eventoId={eventoId}
        team={team}
        sponsor={editing}
        onClose={() => setEditing(null)}
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
