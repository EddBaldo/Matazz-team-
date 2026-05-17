"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X, Trash2 } from "lucide-react";
import {
  aggiornaMovimentoR,
  creaMovimentoR,
  eliminaMovimentoR,
  type MovimentoInput,
} from "../actions";

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500";

export type MovimentoEdit = {
  id: string;
  data: string;
  descrizione: string;
  importo: number;
};

type Mode =
  | { kind: "add" }
  | { kind: "edit"; movimento: MovimentoEdit };

type Props = {
  mode: Mode | null;
  onClose: () => void;
};

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function MovimentoModal({ mode, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [direzione, setDirezione] = useState<"entrata" | "uscita">("entrata");

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (mode) {
      setError(null);
      if (mode.kind === "edit") {
        setDirezione(mode.movimento.importo >= 0 ? "entrata" : "uscita");
      } else {
        setDirezione("entrata");
      }
      if (!dlg.open) dlg.showModal();
    } else if (dlg.open) {
      dlg.close();
    }
  }, [mode]);

  if (!mode) return null;

  const isEdit = mode.kind === "edit";
  const m: MovimentoEdit | null = mode.kind === "edit" ? mode.movimento : null;
  const currentMode = mode;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = Number(fd.get("importo"));
    const signed = direzione === "uscita" ? -Math.abs(raw) : Math.abs(raw);
    const input: MovimentoInput = {
      data: String(fd.get("data") ?? ""),
      descrizione: String(fd.get("descrizione") ?? ""),
      importo: signed,
    };
    startTransition(async () => {
      const res =
        currentMode.kind === "edit"
          ? await aggiornaMovimentoR(currentMode.movimento.id, input)
          : await creaMovimentoR(input);
      if (res.ok) onClose();
      else setError(res.error);
    });
  }

  function handleDelete() {
    if (currentMode.kind !== "edit") return;
    if (
      !confirm(
        `Eliminare il movimento "${currentMode.movimento.descrizione}"?`,
      )
    )
      return;
    const id = currentMode.movimento.id;
    startTransition(async () => {
      const res = await eliminaMovimentoR(id);
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
            {isEdit ? "Modifica movimento" : "Nuovo movimento"}
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
          <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 rounded-full">
            <button
              type="button"
              onClick={() => setDirezione("entrata")}
              className={`py-1.5 rounded-full text-sm font-medium transition-colors ${
                direzione === "entrata"
                  ? "bg-white text-green-700 shadow-sm"
                  : "text-neutral-500"
              }`}
            >
              ↗ Entrata
            </button>
            <button
              type="button"
              onClick={() => setDirezione("uscita")}
              className={`py-1.5 rounded-full text-sm font-medium transition-colors ${
                direzione === "uscita"
                  ? "bg-white text-red-700 shadow-sm"
                  : "text-neutral-500"
              }`}
            >
              ↘ Uscita
            </button>
          </div>

          <Field label="Data" required>
            <input
              type="date"
              name="data"
              required
              defaultValue={m?.data ?? todayISO()}
              className={INPUT_CLASS}
            />
          </Field>

          <Field label="Descrizione" required>
            <input
              type="text"
              name="descrizione"
              required
              defaultValue={m?.descrizione ?? ""}
              className={INPUT_CLASS}
              placeholder="Es. Versamento sponsor, pagamento fattura..."
            />
          </Field>

          <Field label="Importo (CHF)" required>
            <input
              type="number"
              step="0.01"
              min="0"
              name="importo"
              required
              defaultValue={m ? Math.abs(m.importo) : ""}
              className={INPUT_CLASS}
              placeholder="0.00"
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
