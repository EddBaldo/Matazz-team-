"use client";

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { formatRangeOra } from "@/lib/programma";
import {
  VoceProgrammaModal,
  type PerformerByMacro,
  type VoceEdit,
} from "./VoceProgrammaModal";
import { GiornataModal, type GiornataEdit } from "./GiornataModal";

export type VoceListItem = VoceEdit & {
  artista: { nome: string; cognome: string } | null;
};

export type GiornataView = {
  id: string;
  data: string;
  descrizione: string | null;
  label: string;
  voci: VoceListItem[];
};

type Props = {
  eventoId: string;
  performer: PerformerByMacro;
  giornate: GiornataView[];
  defaultDateForNew: string;
};

type VoceModalState =
  | { kind: "add"; giornataId: string; giornataLabel: string }
  | { kind: "edit"; voce: VoceEdit; giornataLabel: string }
  | null;

function formatGiornoHeaderProgramma(d: string): {
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

type GiornataModalState =
  | { kind: "add"; defaultDate: string }
  | { kind: "edit"; giornata: GiornataEdit }
  | null;

export function ProgrammaGiornate({
  eventoId,
  performer,
  giornate,
  defaultDateForNew,
}: Props) {
  const [voceModal, setVoceModal] = useState<VoceModalState>(null);
  const [giornataModal, setGiornataModal] = useState<GiornataModalState>(null);

  function openAddGiornata() {
    setGiornataModal({ kind: "add", defaultDate: defaultDateForNew });
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-neutral-600">
          {giornate.length === 0
            ? "Crea la prima giornata per iniziare a costruire il programma."
            : "Clicca su una giornata per modificarla, su una voce per aggiornarla."}
        </p>
        <button
          type="button"
          onClick={openAddGiornata}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
        >
          <Plus className="w-4 h-4" />
          Crea giornata
        </button>
      </div>

      {giornate.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center">
          <p className="text-neutral-600">
            Nessuna giornata ancora. Aggiungine una dal bottone qui sopra.
          </p>
        </div>
      ) : (
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${giornate.length}, minmax(0, 1fr))`,
          }}
        >
          {giornate.map((g) => {
            const h = formatGiornoHeaderProgramma(g.data);
            return (
                <section
                  key={g.id}
                  className="rounded-3xl bg-white p-5 sm:p-6 flex flex-col min-w-0"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0">
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
                      {g.descrizione && (
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {g.descrizione}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setGiornataModal({
                          kind: "edit",
                          giornata: {
                            id: g.id,
                            data: g.data,
                            descrizione: g.descrizione,
                            vociCount: g.voci.length,
                          },
                        })
                      }
                      aria-label="Modifica giornata"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 shrink-0"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>

                  {g.voci.length > 0 ? (
                    <ul className="divide-y divide-neutral-100 flex-1">
                      {g.voci.map((v) => {
                        const ora = formatRangeOra(v.ora_inizio, v.ora_fine);
                        return (
                          <li key={v.id}>
                            <button
                              type="button"
                              onClick={() =>
                                setVoceModal({
                                  kind: "edit",
                                  voce: {
                                    id: v.id,
                                    ora_inizio: v.ora_inizio,
                                    ora_fine: v.ora_fine,
                                    titolo: v.titolo,
                                    descrizione: v.descrizione,
                                    artista_id: v.artista_id,
                                  },
                                  giornataLabel: g.label,
                                })
                              }
                              className="w-full text-left py-2.5 first:pt-0 hover:bg-neutral-50 rounded-xl px-1.5 -mx-1.5 transition-colors"
                            >
                              {ora && (
                                <p className="text-xs tabular-nums text-neutral-500 mb-0.5">
                                  {ora}
                                </p>
                              )}
                              <p className="text-sm font-medium text-neutral-900">
                                {v.titolo}
                              </p>
                              {v.artista && (
                                <span className="mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-800">
                                  🎤 {v.artista.nome} {v.artista.cognome}
                                </span>
                              )}
                              {v.descrizione && (
                                <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                                  {v.descrizione}
                                </p>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-xs text-neutral-400 flex-1">
                      Nessuna voce.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setVoceModal({
                        kind: "add",
                        giornataId: g.id,
                        giornataLabel: g.label,
                      })
                    }
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
                  >
                    <Plus className="w-4 h-4" />
                    Aggiungi voce
                  </button>
                </section>
              );
            })}
        </div>
      )}

      <VoceProgrammaModal
        eventoId={eventoId}
        performer={performer}
        mode={voceModal}
        onClose={() => setVoceModal(null)}
      />

      <GiornataModal
        eventoId={eventoId}
        mode={giornataModal}
        onClose={() => setGiornataModal(null)}
      />
    </>
  );
}
