"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X, Trash2 } from "lucide-react";
import {
  aggiornaEventoPersonaleR,
  eliminaEventoPersonaleR,
  toggleConfermaPersonaleR,
  type EventoPersonaleInput,
} from "../actions";

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500";

export type EventoPersonaleEdit = {
  id: string;
  ruolo_specifico: string | null;
  presenza: string | null;
  compenso: number | null;
  costi_trasporto: number | null;
  note: string | null;
  confermato: boolean;
  presente_cena: boolean;
  intolleranze_cibo: string | null;
  personaLabel: string;
  ruoloRubrica: string;
  categoria: string | null;
};

type Props = {
  eventoId: string;
  persona: EventoPersonaleEdit | null;
  onClose: () => void;
};

export function ModificaPersonaleModal({
  eventoId,
  persona,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confermato, setConfermato] = useState<boolean>(false);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (persona) {
      setError(null);
      setConfermato(persona.confermato);
      if (!dlg.open) dlg.showModal();
    } else if (dlg.open) {
      dlg.close();
    }
  }, [persona]);

  if (!persona) return null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!persona) return;
    const fd = new FormData(e.currentTarget);
    const input: EventoPersonaleInput = {
      ruolo_specifico: (fd.get("ruolo_specifico") as string) || null,
      presenza: (fd.get("presenza") as string) || null,
      compenso: (fd.get("compenso") as string) || null,
      costi_trasporto: (fd.get("costi_trasporto") as string) || null,
      note: (fd.get("note") as string) || null,
      intolleranze_cibo: (fd.get("intolleranze_cibo") as string) || null,
    };
    const id = persona.id;
    const wasConf = persona.confermato;
    startTransition(async () => {
      const r1 = await aggiornaEventoPersonaleR(eventoId, id, input);
      if (!r1.ok) {
        setError(r1.error);
        return;
      }
      if (confermato !== wasConf) {
        const r2 = await toggleConfermaPersonaleR(eventoId, id, confermato);
        if (!r2.ok) {
          setError(r2.error);
          return;
        }
      }
      onClose();
    });
  }

  function handleDelete() {
    if (!persona) return;
    if (!confirm(`Rimuovere ${persona.personaLabel} dall'evento?`)) return;
    const id = persona.id;
    startTransition(async () => {
      const res = await eliminaEventoPersonaleR(eventoId, id);
      if (res.ok) onClose();
      else setError(res.error);
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
        <div className="flex items-start justify-between mb-1 gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-neutral-900 truncate">
              {persona.personaLabel}
            </h2>
            <p className="text-xs text-neutral-500">
              {persona.ruoloRubrica}
              {persona.categoria ? ` · ${persona.categoria}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4 mt-4">
            {error}
          </p>
        )}

        <div className="mt-4 mb-5 flex items-center justify-between gap-3 rounded-2xl bg-neutral-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-neutral-900">
              Stato conferma
            </p>
            <p className="text-xs text-neutral-500">
              {confermato
                ? "Confermato per l'evento"
                : "In attesa di conferma"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfermato(!confermato)}
            role="switch"
            aria-checked={confermato}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
              confermato ? "bg-green-600" : "bg-neutral-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${
                confermato ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Ruolo specifico per questo evento">
            <input
              type="text"
              name="ruolo_specifico"
              defaultValue={persona.ruolo_specifico ?? ""}
              className={INPUT_CLASS}
              placeholder={
                persona.ruoloRubrica
                  ? `Lascia vuoto per usare "${persona.ruoloRubrica}"`
                  : ""
              }
            />
          </Field>

          <Field label="Quando sarà presente">
            <input
              type="text"
              name="presenza"
              defaultValue={persona.presenza ?? ""}
              className={INPUT_CLASS}
              placeholder="Es. Tutti i giorni, Sabato 14:00-18:00, Solo allestimento…"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Compenso (CHF)">
              <input
                type="number"
                step="0.01"
                min="0"
                name="compenso"
                defaultValue={persona.compenso ?? 0}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Costi trasporto (CHF)">
              <input
                type="number"
                step="0.01"
                min="0"
                name="costi_trasporto"
                defaultValue={persona.costi_trasporto ?? 0}
                className={INPUT_CLASS}
              />
            </Field>
          </div>

          <Field label="Intolleranze cibo">
            <input
              type="text"
              name="intolleranze_cibo"
              defaultValue={persona.intolleranze_cibo ?? ""}
              className={INPUT_CLASS}
              placeholder="Es. vegetariano, lattosio, glutine…"
            />
          </Field>

          <Field label="Note">
            <textarea
              name="note"
              rows={3}
              defaultValue={persona.note ?? ""}
              className={INPUT_CLASS}
              placeholder="Cosa fa nello specifico, equipaggiamento…"
            />
          </Field>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Rimuovi
            </button>
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
                {pending ? "Salvataggio…" : "Salva"}
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
