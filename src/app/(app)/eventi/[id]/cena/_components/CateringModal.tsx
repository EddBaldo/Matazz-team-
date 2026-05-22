"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X, Trash2 } from "lucide-react";
import {
  aggiornaCateringR,
  creaCateringR,
  eliminaCateringR,
  type CateringInput,
} from "../actions";

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500";

export type CateringEdit = {
  id: string;
  nome_fornitore: string;
  descrizione: string | null;
  prezzo_per_persona: number;
  selezionata: boolean;
  note: string | null;
};

type Mode = { kind: "add" } | { kind: "edit"; catering: CateringEdit };

type Props = {
  eventoId: string;
  mode: Mode | null;
  onClose: () => void;
};

export function CateringModal({ eventoId, mode, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [selezionata, setSelezionata] = useState<boolean>(false);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (mode) {
      setError(null);
      setSelezionata(mode.kind === "edit" ? mode.catering.selezionata : false);
      if (!dlg.open) dlg.showModal();
    } else if (dlg.open) {
      dlg.close();
    }
  }, [mode]);

  if (!mode) return null;

  const isEdit = mode.kind === "edit";
  const c = mode.kind === "edit" ? mode.catering : null;
  const currentMode = mode;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input: CateringInput = {
      nome_fornitore: String(fd.get("nome_fornitore") ?? ""),
      descrizione: (fd.get("descrizione") as string) || null,
      prezzo_per_persona: (fd.get("prezzo_per_persona") as string) || null,
      selezionata: selezionata,
      note: (fd.get("note") as string) || null,
    };
    startTransition(async () => {
      const res =
        currentMode.kind === "edit"
          ? await aggiornaCateringR(eventoId, currentMode.catering.id, input)
          : await creaCateringR(eventoId, input);
      if (res.ok) onClose();
      else setError(res.error);
    });
  }

  function handleDelete() {
    if (currentMode.kind !== "edit") return;
    if (!confirm(`Eliminare ${currentMode.catering.nome_fornitore}?`)) return;
    const id = currentMode.catering.id;
    startTransition(async () => {
      const res = await eliminaCateringR(eventoId, id);
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
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-neutral-900">
            {isEdit ? "Modifica offerta cena" : "Nuova offerta cena"}
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

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nome chef" required>
            <input
              type="text"
              name="nome_fornitore"
              required
              defaultValue={c?.nome_fornitore ?? ""}
              className={INPUT_CLASS}
            />
          </Field>

          <Field label="Descrizione">
            <textarea
              name="descrizione"
              rows={2}
              defaultValue={c?.descrizione ?? ""}
              className={INPUT_CLASS}
              placeholder="Es. menù 3 portate, vegetariano…"
            />
          </Field>

          <Field label="CHF/persona">
            <input
              type="number"
              step="0.01"
              min="0"
              name="prezzo_per_persona"
              defaultValue={c?.prezzo_per_persona ?? 0}
              className={INPUT_CLASS}
            />
          </Field>

          <div className="flex items-center justify-between gap-3 rounded-2xl bg-neutral-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-neutral-900">
                Selezionata
              </p>
              <p className="text-xs text-neutral-500">
                Solo se selezionata entra nel budget.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelezionata(!selezionata)}
              role="switch"
              aria-checked={selezionata}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                selezionata ? "bg-green-600" : "bg-neutral-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${
                  selezionata ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <Field label="Note">
            <textarea
              name="note"
              rows={2}
              defaultValue={c?.note ?? ""}
              className={INPUT_CLASS}
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
