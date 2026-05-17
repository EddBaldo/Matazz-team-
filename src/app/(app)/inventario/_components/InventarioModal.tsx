"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X, Trash2 } from "lucide-react";
import { CONDIZIONI } from "@/lib/inventario";
import {
  aggiornaInventarioR,
  creaInventarioR,
  eliminaInventarioR,
  type InventarioInput,
} from "../actions";

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500";

export type InventarioEdit = {
  id: string;
  articolo: string;
  quantita: number;
  dove_si_trova: string | null;
  condizione: string;
  note: string | null;
};

type Mode = { kind: "add" } | { kind: "edit"; articolo: InventarioEdit };

type Props = {
  mode: Mode | null;
  onClose: () => void;
};

function parseIntOrDefault(v: FormDataEntryValue | null, def: number): number {
  if (typeof v !== "string" || v.trim().length === 0) return def;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
}

export function InventarioModal({ mode, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (mode) {
      setError(null);
      if (!dlg.open) dlg.showModal();
    } else if (dlg.open) {
      dlg.close();
    }
  }, [mode]);

  if (!mode) return null;

  const isEdit = mode.kind === "edit";
  const i: InventarioEdit | null = mode.kind === "edit" ? mode.articolo : null;

  const currentMode = mode;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input: InventarioInput = {
      articolo: String(fd.get("articolo") ?? ""),
      quantita: parseIntOrDefault(fd.get("quantita"), 1),
      dove_si_trova: (fd.get("dove_si_trova") as string) || null,
      condizione: String(fd.get("condizione") ?? "Buono"),
      note: (fd.get("note") as string) || null,
    };
    startTransition(async () => {
      const res =
        currentMode.kind === "edit"
          ? await aggiornaInventarioR(currentMode.articolo.id, input)
          : await creaInventarioR(input);
      if (res.ok) onClose();
      else setError(res.error);
    });
  }

  function handleDelete() {
    if (currentMode.kind !== "edit") return;
    if (!confirm(`Eliminare "${currentMode.articolo.articolo}"?`)) return;
    const id = currentMode.articolo.id;
    startTransition(async () => {
      const res = await eliminaInventarioR(id);
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
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:left-[calc(50%+8rem)] m-0 rounded-3xl p-0 backdrop:bg-black/40 w-[calc(100vw-2rem)] max-w-md max-h-[90vh]"
    >
      <div className="bg-white rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-neutral-900">
            {isEdit ? "Modifica articolo" : "Nuovo articolo"}
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
          <Field label="Articolo" required>
            <input
              type="text"
              name="articolo"
              required
              defaultValue={i?.articolo ?? ""}
              className={INPUT_CLASS}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantità">
              <input
                type="number"
                step="1"
                min="0"
                name="quantita"
                defaultValue={i?.quantita ?? 1}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Condizione" required>
              <select
                name="condizione"
                required
                defaultValue={i?.condizione ?? "Buono"}
                className={INPUT_CLASS}
              >
                {i &&
                  !(CONDIZIONI as readonly string[]).includes(i.condizione) && (
                    <option value={i.condizione}>
                      {i.condizione} (vecchio)
                    </option>
                  )}
                {CONDIZIONI.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Dove si trova">
            <input
              type="text"
              name="dove_si_trova"
              defaultValue={i?.dove_si_trova ?? ""}
              className={INPUT_CLASS}
              placeholder="Es. Magazzino Lugano, casa Pie…"
            />
          </Field>

          <Field label="Note">
            <textarea
              name="note"
              rows={3}
              defaultValue={i?.note ?? ""}
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
                {pending ? "Salvataggio…" : isEdit ? "Salva" : "Crea"}
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
