"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X, Trash2 } from "lucide-react";
import {
  aggiornaVoceExtraR,
  creaVoceExtraR,
  eliminaVoceExtraR,
  type VoceExtraInput,
} from "../actions";
import { CATEGORIE_SUGGERITE, TIPI_VOCE } from "../constants";

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500";

export type VoceExtraEdit = {
  id: string;
  voce: string;
  tipo: string;
  importo: number;
  categoria: string | null;
  note: string | null;
  pagato_da: string | null;
};

type Mode = { kind: "add" } | { kind: "edit"; voce: VoceExtraEdit };

type Props = {
  eventoId: string;
  mode: Mode | null;
  onClose: () => void;
};

export function VoceExtraModal({ eventoId, mode, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [tipo, setTipo] = useState<string>("Uscita");

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (mode) {
      setError(null);
      setTipo(mode.kind === "edit" ? mode.voce.tipo : "Uscita");
      if (!dlg.open) dlg.showModal();
    } else if (dlg.open) {
      dlg.close();
    }
  }, [mode]);

  if (!mode) return null;

  const isEdit = mode.kind === "edit";
  const v = mode.kind === "edit" ? mode.voce : null;
  const currentMode = mode;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input: VoceExtraInput = {
      voce: String(fd.get("voce") ?? ""),
      tipo,
      importo: (fd.get("importo") as string) || null,
      categoria: (fd.get("categoria") as string) || null,
      note: (fd.get("note") as string) || null,
      pagato_da: (fd.get("pagato_da") as string) || null,
    };
    startTransition(async () => {
      const res =
        currentMode.kind === "edit"
          ? await aggiornaVoceExtraR(eventoId, currentMode.voce.id, input)
          : await creaVoceExtraR(eventoId, input);
      if (res.ok) onClose();
      else setError(res.error);
    });
  }

  function handleDelete() {
    if (currentMode.kind !== "edit") return;
    if (!confirm(`Eliminare "${currentMode.voce.voce}"?`)) return;
    const id = currentMode.voce.id;
    startTransition(async () => {
      const res = await eliminaVoceExtraR(eventoId, id);
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

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Voce" required>
            <input
              type="text"
              name="voce"
              required
              defaultValue={v?.voce ?? ""}
              className={INPUT_CLASS}
              placeholder="Es. Affitto sala, Sponsor X…"
            />
          </Field>

          <div>
            <span className="text-sm font-medium text-neutral-800">Tipo</span>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {TIPI_VOCE.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    tipo === t
                      ? t === "Entrata"
                        ? "border-green-600 bg-green-600 text-white"
                        : "border-red-600 bg-red-600 text-white"
                      : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <Field label="Importo (CHF)" required>
            <input
              type="number"
              step="0.01"
              min="0"
              name="importo"
              required
              defaultValue={v?.importo ?? 0}
              className={INPUT_CLASS}
            />
          </Field>

          <Field label="Categoria">
            <input
              type="text"
              name="categoria"
              defaultValue={v?.categoria ?? ""}
              className={INPUT_CLASS}
              placeholder="Es. Affitto location, SIAE…"
              list="categorie-extra"
            />
            <datalist id="categorie-extra">
              {CATEGORIE_SUGGERITE.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>

          <Field label="Pagato da">
            <input
              type="text"
              name="pagato_da"
              defaultValue={v?.pagato_da ?? ""}
              className={INPUT_CLASS}
              placeholder="Es. Luca, Eduardo… (lascia vuoto se Matazz)"
            />
          </Field>

          <Field label="Note">
            <textarea
              name="note"
              rows={3}
              defaultValue={v?.note ?? ""}
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
