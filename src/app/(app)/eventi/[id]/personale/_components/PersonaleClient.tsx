"use client";

import { useState, useTransition } from "react";
import { Plus, Check, Circle } from "lucide-react";
import { fmtOrDash } from "@/lib/format";
import {
  CATEGORIE_PERSONALE,
  CATEGORIA_PERSONALE_EMOJI,
  type CategoriaPersonale,
} from "@/lib/personale";
import {
  toggleConfermaPersonaleR,
  togglePresenteCenaPersonaleR,
} from "../actions";
import {
  AggiungiPersonaleModal,
  type PersonaRubrica,
} from "./AggiungiPersonaleModal";
import {
  ModificaPersonaleModal,
  type EventoPersonaleEdit,
} from "./ModificaPersonaleModal";

export type PersonaleRow = EventoPersonaleEdit & {
  personaleId: string;
  cognome: string;
  nome: string;
};

type Props = {
  eventoId: string;
  rows: PersonaleRow[];
  rubrica: PersonaRubrica[];
};

export function PersonaleClient({ eventoId, rows, rubrica }: Props) {
  const [editing, setEditing] = useState<EventoPersonaleEdit | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const giaCollegati = new Set(rows.map((r) => r.personaleId));

  const confermati = rows.filter((r) => r.confermato);
  const daConfermare = rows.filter((r) => !r.confermato);

  const grouped = new Map<CategoriaPersonale, PersonaleRow[]>();
  for (const r of confermati) {
    const cat = (r.categoria as CategoriaPersonale) ?? "Altro";
    const key = (CATEGORIE_PERSONALE as readonly string[]).includes(cat)
      ? cat
      : ("Altro" as CategoriaPersonale);
    const bucket = grouped.get(key) ?? [];
    bucket.push(r);
    grouped.set(key, bucket);
  }
  for (const bucket of grouped.values()) {
    bucket.sort((a, b) =>
      `${a.cognome} ${a.nome}`.localeCompare(`${b.cognome} ${b.nome}`, "it"),
    );
  }
  daConfermare.sort((a, b) =>
    `${a.cognome} ${a.nome}`.localeCompare(`${b.cognome} ${b.nome}`, "it"),
  );

  return (
    <>
      <div className="flex items-center justify-end gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
        >
          <Plus className="w-4 h-4" />
          Aggiungi persona
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center">
          <p className="text-neutral-600">Nessuna persona ancora.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {CATEGORIE_PERSONALE.map((cat) => {
            const bucket = grouped.get(cat);
            if (!bucket || bucket.length === 0) return null;
            return (
              <section key={cat}>
                <h3 className="text-base font-semibold text-neutral-900 mb-2 flex items-baseline gap-2">
                  <span aria-hidden>{CATEGORIA_PERSONALE_EMOJI[cat]}</span>
                  <span>{cat}</span>
                  <span className="text-sm text-neutral-500 font-normal">
                    ({bucket.length})
                  </span>
                </h3>
                <PersonaleTable
                  eventoId={eventoId}
                  rows={bucket}
                  onRowClick={(r) => setEditing(r)}
                />
              </section>
            );
          })}

          {daConfermare.length > 0 && (
            <section>
              <h3 className="text-base font-semibold text-neutral-900 mb-2 flex items-baseline gap-2">
                <span aria-hidden>⏳</span>
                <span>Da confermare</span>
                <span className="text-sm text-neutral-500 font-normal">
                  ({daConfermare.length})
                </span>
              </h3>
              <PersonaleTable
                eventoId={eventoId}
                rows={daConfermare}
                onRowClick={(r) => setEditing(r)}
              />
            </section>
          )}
        </div>
      )}

      <AggiungiPersonaleModal
        eventoId={eventoId}
        open={addOpen}
        rubrica={rubrica}
        giaCollegati={giaCollegati}
        onClose={() => setAddOpen(false)}
      />

      <ModificaPersonaleModal
        eventoId={eventoId}
        persona={editing}
        onClose={() => setEditing(null)}
      />
    </>
  );
}

function PersonaleTable({
  eventoId,
  rows,
  onRowClick,
}: {
  eventoId: string;
  rows: PersonaleRow[];
  onRowClick: (r: PersonaleRow) => void;
}) {
  return (
    <div className="bg-white rounded-3xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-neutral-200">
          <tr>
            <Th align="left">Nome</Th>
            <Th align="left">Ruolo</Th>
            <Th align="left">Presenza</Th>
            <Th align="right">Compenso</Th>
            <Th align="right">Trasporto</Th>
            <Th align="left">Note</Th>
            <Th align="center">Cena</Th>
            <Th align="center">
              <span className="sr-only">Conferma</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <PersonaleRowItem
              key={r.id}
              eventoId={eventoId}
              row={r}
              onClick={() => onRowClick(r)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PersonaleRowItem({
  eventoId,
  row,
  onClick,
}: {
  eventoId: string;
  row: PersonaleRow;
  onClick: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      await toggleConfermaPersonaleR(eventoId, row.id, !row.confermato);
    });
  }

  return (
    <tr
      onClick={onClick}
      className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 cursor-pointer"
    >
      <td className="px-4 py-3 text-neutral-900 font-medium">
        {row.personaLabel}
      </td>
      <td className="px-4 py-3 text-neutral-700">
        {row.ruolo_specifico ?? row.ruoloRubrica}
      </td>
      <td className="px-4 py-3 text-neutral-700">{row.presenza ?? "—"}</td>
      <td className="px-4 py-3 text-neutral-900 text-right tabular-nums font-medium">
        {fmtOrDash(Number(row.compenso ?? 0))}
      </td>
      <td className="px-4 py-3 text-neutral-700 text-right tabular-nums">
        {fmtOrDash(Number(row.costi_trasporto ?? 0))}
      </td>
      <td className="px-4 py-3 text-neutral-700">{row.note ?? "—"}</td>
      <td className="px-4 py-3 text-center">
        <CenaBadge
          eventoId={eventoId}
          evPersId={row.id}
          on={row.presente_cena}
        />
      </td>
      <td className="px-4 py-3 text-center">
        <button
          type="button"
          onClick={handleToggle}
          disabled={pending}
          aria-label={
            row.confermato ? "Sposta in da confermare" : "Conferma"
          }
          title={row.confermato ? "Sposta in da confermare" : "Conferma"}
          className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors disabled:opacity-50 ${
            row.confermato
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
          }`}
        >
          {row.confermato ? (
            <Check className="w-4 h-4" />
          ) : (
            <Circle className="w-4 h-4" />
          )}
        </button>
      </td>
    </tr>
  );
}

function CenaBadge({
  eventoId,
  evPersId,
  on,
}: {
  eventoId: string;
  evPersId: string;
  on: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        startTransition(async () => {
          await togglePresenteCenaPersonaleR(eventoId, evPersId, !on);
        });
      }}
      disabled={pending}
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer ${
        on
          ? "bg-green-100 text-green-800 hover:bg-green-200"
          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
      }`}
    >
      {on ? "Sì" : "No"}
    </button>
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
