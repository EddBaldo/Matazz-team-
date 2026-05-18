"use client";

import { useState, useTransition } from "react";
import { Plus, Check, Circle } from "lucide-react";
import { formatTime } from "@/lib/format";
import { CATEGORIA_BADGE, CATEGORIA_DOT, CATEGORIE_COMPITI } from "@/lib/compiti";
import { toggleFattoR } from "../actions";
import {
  CompitoModal,
  type CompitoEdit,
  type TeamMember,
  type PersonaleRubrica,
} from "./CompitoModal";

export type CompitoRow = CompitoEdit & {
  fatto: boolean;
  assegnatoNome: string | null;
};

type Props = {
  eventoId: string;
  rows: CompitoRow[];
  team: TeamMember[];
  personale: PersonaleRubrica[];
  defaultDateForNew: string;
};

type ModalState =
  | { kind: "add"; defaultDate: string }
  | { kind: "edit"; compito: CompitoEdit }
  | null;

function formatRangeOra(
  inizio: string | null,
  fine: string | null,
): string | null {
  const i = inizio ? formatTime(inizio) : "";
  const f = fine ? formatTime(fine) : "";
  if (i && f) return `${i} – ${f}`;
  if (i) return i;
  return null;
}

function formatGiornoHeader(d: string): {
  weekday: string;
  num: string;
  mese: string;
} {
  const date = new Date(d + "T00:00:00");
  const weekday = date
    .toLocaleDateString("it-CH", { weekday: "short" })
    .replace(/\.$/, "")
    .replace(/^[a-z]/, (c) => c.toUpperCase());
  const num = String(date.getDate());
  const mese = date
    .toLocaleDateString("it-CH", { month: "short" })
    .replace(/\.$/, "");
  return { weekday, num, mese };
}

export function CompitiClient({
  eventoId,
  rows,
  team,
  personale,
  defaultDateForNew,
}: Props) {
  const [modal, setModal] = useState<ModalState>(null);
  const [filtroTeam, setFiltroTeam] = useState<Set<string>>(new Set());

  const fatti = rows.filter((r) => r.fatto).length;
  const totali = rows.length;

  const filteredRows =
    filtroTeam.size === 0
      ? rows
      : rows.filter((r) => r.categoria && filtroTeam.has(r.categoria));

  // Raggruppa per data, ordinata cronologicamente
  const grouped = new Map<string, CompitoRow[]>();
  for (const r of filteredRows) {
    const bucket = grouped.get(r.data) ?? [];
    bucket.push(r);
    grouped.set(r.data, bucket);
  }
  const giornate = Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, voci]) => ({
      data,
      voci: voci.sort((a, b) =>
        (a.ora ?? "99:99").localeCompare(b.ora ?? "99:99"),
      ),
    }));

  function toggleTeam(cat: string) {
    setFiltroTeam((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-neutral-600">
          {totali === 0
            ? "Aggiungi la prima voce alla tabella di marcia."
            : `Lista delle cose da fare per questo evento: scadenze, deadline, allestimento. ${fatti} / ${totali} fatte.`}
        </p>
        <button
          type="button"
          onClick={() =>
            setModal({ kind: "add", defaultDate: defaultDateForNew })
          }
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
        >
          <Plus className="w-4 h-4" />
          Aggiungi voce
        </button>
      </div>

      {totali > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIE_COMPITI.map((cat) => {
            const active = filtroTeam.has(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleTeam(cat)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    CATEGORIA_DOT[cat] ?? "bg-neutral-400"
                  }`}
                />
                {cat}
              </button>
            );
          })}
          {filtroTeam.size > 0 && (
            <button
              type="button"
              onClick={() => setFiltroTeam(new Set())}
              className="text-xs text-neutral-500 hover:text-neutral-900 underline ml-1"
            >
              Mostra tutto
            </button>
          )}
        </div>
      )}

      {totali === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center">
          <p className="text-neutral-600">Nessuna voce ancora.</p>
        </div>
      ) : giornate.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center">
          <p className="text-neutral-600">
            Nessun impegno per i team selezionati.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {giornate.map((g) => {
            const h = formatGiornoHeader(g.data);
            const singoli = g.voci.filter((v) => v.tipo !== "turni");
            const turniBlocks = g.voci.filter((v) => v.tipo === "turni");
            const doneCount = singoli.filter((v) => v.fatto).length;
            const onOpenEdit = (v: CompitoRow) =>
              setModal({
                kind: "edit",
                compito: {
                  id: v.id,
                  titolo: v.titolo,
                  data: v.data,
                  data_fine: v.data_fine,
                  tipo: v.tipo,
                  ora: v.ora,
                  ora_fine: v.ora_fine,
                  categoria: v.categoria,
                  assegnato_a_id: v.assegnato_a_id,
                  descrizione: v.descrizione,
                  turni: v.turni,
                },
              });
            return (
              <div key={g.data} className="flex flex-col gap-3">
                {singoli.length > 0 && (
                  <section className="rounded-3xl bg-white p-5 sm:p-6 flex flex-col">
                    <div className="flex items-baseline justify-between gap-3 mb-4">
                      <h3 className="flex items-baseline gap-2">
                        <span className="text-xs uppercase tracking-wide text-neutral-500 font-medium">
                          {h.weekday}
                        </span>
                        <span className="text-xl font-semibold text-neutral-900">
                          {h.num}
                        </span>
                        <span className="text-xs uppercase tracking-wide text-neutral-500">
                          {h.mese}
                        </span>
                      </h3>
                      <span className="text-xs uppercase tracking-wide text-neutral-500 whitespace-nowrap">
                        {doneCount}/{singoli.length}
                      </span>
                    </div>

                    <ul className="divide-y divide-neutral-100">
                      {singoli.map((v) => (
                        <CompitoRowItem
                          key={v.id}
                          eventoId={eventoId}
                          row={v}
                          onClick={() => onOpenEdit(v)}
                        />
                      ))}
                    </ul>
                  </section>
                )}

                {singoli.length === 0 && turniBlocks.length > 0 && (
                  <div className="flex items-baseline gap-2 px-1">
                    <span className="text-xs uppercase tracking-wide text-neutral-500 font-medium">
                      {h.weekday}
                    </span>
                    <span className="text-xl font-semibold text-neutral-900">
                      {h.num}
                    </span>
                    <span className="text-xs uppercase tracking-wide text-neutral-500">
                      {h.mese}
                    </span>
                  </div>
                )}

                {turniBlocks.map((t) => (
                  <TurnoCard
                    key={t.id}
                    row={t}
                    onClick={() => onOpenEdit(t)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}

      <CompitoModal
        eventoId={eventoId}
        team={team}
        personale={personale}
        mode={modal}
        onClose={() => setModal(null)}
      />
    </>
  );
}

function CompitoRowItem({
  eventoId,
  row,
  onClick,
}: {
  eventoId: string;
  row: CompitoRow;
  onClick: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      await toggleFattoR(eventoId, row.id, !row.fatto);
    });
  }

  const isTurni = row.tipo === "turni";
  const ora = isTurni ? null : formatRangeOra(row.ora, row.ora_fine);

  // Per i turni: ricavo range orario complessivo + persone uniche
  const turniInfo = (() => {
    if (!isTurni || row.turni.length === 0) return null;
    let minStart: string | null = null;
    let maxEnd: string | null = null;
    for (const t of row.turni) {
      if (t.ora_inizio) {
        if (!minStart || t.ora_inizio < minStart) minStart = t.ora_inizio;
      }
      const fineCandidate = t.ora_fine ?? t.ora_inizio;
      if (fineCandidate) {
        if (!maxEnd || fineCandidate > maxEnd) maxEnd = fineCandidate;
      }
    }
    return {
      count: row.turni.length,
      range:
        minStart && maxEnd
          ? `${minStart.slice(0, 5)} – ${maxEnd.slice(0, 5)}`
          : minStart
            ? minStart.slice(0, 5)
            : null,
    };
  })();

  return (
    <li>
      <div
        onClick={onClick}
        className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-2.5 hover:bg-neutral-50 rounded-xl px-1.5 -mx-1.5 cursor-pointer transition-colors"
      >
        {isTurni ? (
          <span className="mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-neutral-100 text-[10px] font-semibold text-neutral-700 shrink-0">
            {turniInfo?.count ?? 0}
          </span>
        ) : (
          <button
            type="button"
            onClick={toggle}
            disabled={pending}
            aria-label={row.fatto ? "Segna come da fare" : "Segna come fatto"}
            className={`mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full transition-colors disabled:opacity-50 shrink-0 ${
              row.fatto
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200"
            }`}
          >
            {row.fatto ? (
              <Check className="w-3 h-3" />
            ) : (
              <Circle className="w-3 h-3" />
            )}
          </button>
        )}

        <div className="flex-1 min-w-0">
          {(ora || turniInfo?.range) && (
            <p className="text-xs tabular-nums text-neutral-500 mb-0.5">
              {ora ?? turniInfo?.range}
            </p>
          )}
          <p
            className={`text-sm font-medium ${
              row.fatto ? "text-neutral-500 line-through" : "text-neutral-900"
            }`}
          >
            {row.titolo}
            {isTurni && turniInfo && (
              <span className="ml-1.5 text-xs font-normal text-neutral-500">
                · {turniInfo.count}{" "}
                {turniInfo.count === 1 ? "turno" : "turni"}
              </span>
            )}
          </p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {row.categoria && (
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  CATEGORIA_BADGE[row.categoria] ??
                  "bg-neutral-100 text-neutral-700"
                }`}
              >
                {row.categoria}
              </span>
            )}
            {!isTurni && row.assegnatoNome && (
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-700">
                {row.assegnatoNome}
              </span>
            )}
          </div>
          {row.descrizione && (
            <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
              {row.descrizione}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

function TurnoCard({
  row,
  onClick,
}: {
  row: CompitoRow;
  onClick: () => void;
}) {
  // Etichetta per ogni turno: nome libero, o nome dalla rubrica (passato dal server)
  const persone = row.turni.map(
    (t) => t.nome_libero ?? t.personaleLabel ?? "—",
  );
  return (
    <section
      onClick={onClick}
      className="rounded-3xl bg-white p-5 sm:p-6 cursor-pointer hover:bg-neutral-50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-neutral-500 font-medium">
            Turni · {row.turni.length}
          </p>
          <h3 className="text-base font-semibold text-neutral-900 truncate mt-0.5">
            {row.titolo}
          </h3>
        </div>
        {row.categoria && (
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
              CATEGORIA_BADGE[row.categoria] ??
              "bg-neutral-100 text-neutral-700"
            }`}
          >
            {row.categoria}
          </span>
        )}
      </div>

      {row.turni.length === 0 ? (
        <p className="text-xs text-neutral-400">Nessun turno.</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {row.turni.map((t, i) => {
            const ora =
              t.ora_inizio && t.ora_fine
                ? `${t.ora_inizio.slice(0, 5)} – ${t.ora_fine.slice(0, 5)}`
                : t.ora_inizio
                  ? t.ora_inizio.slice(0, 5)
                  : null;
            return (
              <li
                key={t.id ?? i}
                className="py-2 first:pt-0 last:pb-0 flex items-baseline justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {persone[i]}
                  </p>
                  {t.note && (
                    <p className="text-xs text-neutral-500 truncate">
                      {t.note}
                    </p>
                  )}
                </div>
                {ora && (
                  <span className="text-xs tabular-nums text-neutral-600 whitespace-nowrap">
                    {ora}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
