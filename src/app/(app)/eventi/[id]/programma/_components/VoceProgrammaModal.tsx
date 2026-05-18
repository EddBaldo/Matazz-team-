"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X, Trash2, Plus } from "lucide-react";
import { MACRO_EMOJI, type MacroTipoArte } from "@/lib/artisti";
import { Select } from "@/components/ui/Select";
import { TimeInput } from "@/components/ui/TimeInput";
import {
  aggiornaVoce,
  creaVoce,
  eliminaVoce,
  type VoceProgrammaInput,
} from "../actions";

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500";

export type ArtistaCast = {
  id: string;
  nome: string;
  cognome: string;
  tipo_arte: string;
};

export type PerformerByMacro = {
  macro: MacroTipoArte;
  artisti: ArtistaCast[];
}[];

export type VoceEdit = {
  id: string;
  ora_inizio: string | null;
  ora_fine: string | null;
  titolo: string;
  descrizione: string | null;
  artista_id: string | null;
};

type Mode =
  | { kind: "add"; giornataId: string; giornataLabel: string }
  | { kind: "edit"; voce: VoceEdit; giornataLabel: string };

type Props = {
  eventoId: string;
  performer: PerformerByMacro;
  mode: Mode | null;
  onClose: () => void;
};

export function VoceProgrammaModal({
  eventoId,
  performer,
  mode,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [oraInizio, setOraInizio] = useState<string>("");
  const [oraFine, setOraFine] = useState<string>("");
  const [showFine, setShowFine] = useState<boolean>(false);
  const [titolo, setTitolo] = useState<string>("");
  const [artistaId, setArtistaId] = useState<string>("");

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (mode) {
      setError(null);
      const initialInizio =
        mode.kind === "edit"
          ? (mode.voce.ora_inizio ?? "").slice(0, 5)
          : "";
      const initialFine =
        mode.kind === "edit"
          ? (mode.voce.ora_fine ?? "").slice(0, 5)
          : "";
      setOraInizio(initialInizio);
      setOraFine(initialFine);
      setShowFine(initialFine.length > 0);
      setTitolo(mode.kind === "edit" ? mode.voce.titolo : "");
      setArtistaId(mode.kind === "edit" ? mode.voce.artista_id ?? "" : "");
      if (!dlg.open) dlg.showModal();
    } else if (dlg.open) {
      dlg.close();
    }
  }, [mode]);

  if (!mode) return null;

  const isEdit = mode.kind === "edit";
  const descrizioneDefault =
    mode.kind === "edit" ? mode.voce.descrizione ?? "" : "";

  const hasPerformer = performer.some((p) => p.artisti.length > 0);

  const currentMode = mode;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input: VoceProgrammaInput = {
      ora_inizio: oraInizio || null,
      ora_fine: showFine && oraFine ? oraFine : null,
      titolo: titolo,
      descrizione: (fd.get("descrizione") as string) || null,
      artista_id: artistaId || null,
    };
    startTransition(async () => {
      const res =
        currentMode.kind === "edit"
          ? await aggiornaVoce(eventoId, currentMode.voce.id, input)
          : await creaVoce(eventoId, currentMode.giornataId, input);
      if (res.ok) {
        onClose();
      } else {
        setError(res.error);
      }
    });
  }

  function handleDelete() {
    if (currentMode.kind !== "edit") return;
    if (!confirm("Rimuovere questa voce dal programma?")) return;
    const voceId = currentMode.voce.id;
    startTransition(async () => {
      const res = await eliminaVoce(eventoId, voceId);
      if (res.ok) {
        onClose();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:left-[calc(50%+7.5rem)] m-0 rounded-3xl p-0 backdrop:bg-black/40 w-[calc(100vw-2rem)] max-w-sm max-h-[90vh]"
    >
      <div className="bg-white rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-neutral-900">
            {isEdit ? "Modifica voce" : "Nuova voce"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-neutral-500 capitalize mb-5">
          {currentMode.giornataLabel}
        </p>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <Field label="Ora inizio">
                <TimeInput value={oraInizio} onChange={setOraInizio} />
              </Field>
              {showFine ? (
                <div className="flex items-end gap-1">
                  <div className="flex-1">
                    <Field label="Ora fine">
                      <TimeInput value={oraFine} onChange={setOraFine} />
                    </Field>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowFine(false);
                      setOraFine("");
                    }}
                    aria-label="Rimuovi ora di fine"
                    className="mb-1.5 inline-flex items-center justify-center w-9 h-9 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowFine(true)}
                  className="mb-0.5 inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900"
                >
                  <Plus className="w-4 h-4" />
                  Aggiungi ora di fine
                </button>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-1.5">
              Orari dopo mezzanotte (es. 00:30, 01:30) restano nella giornata.
            </p>
          </div>

          <div>
            <Field label="Titolo" required>
              <input
                type="text"
                name="titolo"
                required
                value={titolo}
                onChange={(e) => setTitolo(e.target.value)}
                className={INPUT_CLASS}
                placeholder="Es. Apertura, Live set, Chiusura…"
              />
            </Field>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setTitolo("Apertura");
                  setShowFine(false);
                  setOraFine("");
                }}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200"
              >
                Apertura
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitolo("Chiusura");
                  setShowFine(false);
                  setOraFine("");
                }}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
              >
                Chiusura
              </button>
            </div>
          </div>

          {hasPerformer && (
            <Field label="Artista del cast (opzionale)">
              <Select
                value={artistaId}
                onChange={setArtistaId}
                options={[
                  { value: "", label: "— Nessuno / voce libera —" },
                  ...performer.flatMap((p) =>
                    p.artisti.map((a) => ({
                      value: a.id,
                      label: `${MACRO_EMOJI[p.macro]} ${a.nome} ${a.cognome} — ${a.tipo_arte}`,
                    })),
                  ),
                ]}
              />
            </Field>
          )}

          <Field label="Descrizione">
            <textarea
              name="descrizione"
              rows={2}
              defaultValue={descrizioneDefault}
              className={INPUT_CLASS}
              placeholder="Dettagli aggiuntivi (opzionale)…"
            />
          </Field>

          <div className="flex items-center justify-between pt-2">
            <div>
              {isEdit && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Elimina
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={pending}
                className="px-3 py-2 rounded-full text-sm text-neutral-700 hover:bg-neutral-100"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={pending}
                className="px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
              >
                {pending ? "Salvataggio…" : isEdit ? "Salva" : "Aggiungi"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-neutral-800">
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
