"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X, Trash2 } from "lucide-react";
import {
  aggiornaBarR,
  creaBarR,
  eliminaBarR,
  type BarInput,
} from "../actions";

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500";

export type BarEdit = {
  id: string;
  articolo: string;
  fonte: "Noi" | "Fornitore";
  fornitore: string | null;
  costo_unitario: number | null;
  prezzo_vendita: number | null;
  quantita_stimata: number;
  note: string | null;
};

type Mode = { kind: "add" } | { kind: "edit"; bar: BarEdit };

type Props = {
  eventoId: string;
  mode: Mode | null;
  onClose: () => void;
};

export function BarModal({ eventoId, mode, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [fonte, setFonte] = useState<"Noi" | "Fornitore">("Noi");
  const [fornitore, setFornitore] = useState<string>("");

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (mode) {
      setError(null);
      if (mode.kind === "edit") {
        setFonte(mode.bar.fonte);
        setFornitore(mode.bar.fornitore ?? "");
      } else {
        setFonte("Noi");
        setFornitore("");
      }
      if (!dlg.open) dlg.showModal();
    } else if (dlg.open) {
      dlg.close();
    }
  }, [mode]);

  if (!mode) return null;

  const isEdit = mode.kind === "edit";
  const b = mode.kind === "edit" ? mode.bar : null;
  const currentMode = mode;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input: BarInput = {
      articolo: String(fd.get("articolo") ?? ""),
      fonte: fonte,
      fornitore: fonte === "Fornitore" ? fornitore : null,
      costo_unitario: (fd.get("costo_unitario") as string) || null,
      prezzo_vendita: (fd.get("prezzo_vendita") as string) || null,
      quantita_stimata: (fd.get("quantita_stimata") as string) || null,
      note: (fd.get("note") as string) || null,
    };
    startTransition(async () => {
      const res =
        currentMode.kind === "edit"
          ? await aggiornaBarR(eventoId, currentMode.bar.id, input)
          : await creaBarR(eventoId, input);
      if (res.ok) onClose();
      else setError(res.error);
    });
  }

  function handleDelete() {
    if (currentMode.kind !== "edit") return;
    if (!confirm(`Eliminare ${currentMode.bar.articolo}?`)) return;
    const id = currentMode.bar.id;
    startTransition(async () => {
      const res = await eliminaBarR(eventoId, id);
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
              defaultValue={b?.articolo ?? ""}
              className={INPUT_CLASS}
              placeholder="Es. Birra Heineken 0.33L"
            />
          </Field>

          <div>
            <span className="text-sm font-medium text-neutral-800">Fonte</span>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setFonte("Noi")}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  fonte === "Noi"
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                Noi
              </button>
              <button
                type="button"
                onClick={() => setFonte("Fornitore")}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  fonte === "Fornitore"
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                Fornitore
              </button>
            </div>
          </div>

          {fonte === "Fornitore" && (
            <Field label="Nome fornitore" required>
              <input
                type="text"
                value={fornitore}
                onChange={(e) => setFornitore(e.target.value)}
                required
                className={INPUT_CLASS}
                placeholder="Es. Coca-Cola Refresh, Heineken CH…"
              />
            </Field>
          )}

          <div className="grid grid-cols-3 gap-3">
            <Field label="Costo unit.">
              <input
                type="number"
                step="0.01"
                min="0"
                name="costo_unitario"
                defaultValue={b?.costo_unitario ?? 0}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Vendita unit.">
              <input
                type="number"
                step="0.01"
                min="0"
                name="prezzo_vendita"
                defaultValue={b?.prezzo_vendita ?? 0}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Quantità">
              <input
                type="number"
                step="1"
                min="0"
                name="quantita_stimata"
                defaultValue={b?.quantita_stimata ?? 0}
                className={INPUT_CLASS}
              />
            </Field>
          </div>

          <Field label="Note">
            <textarea
              name="note"
              rows={2}
              defaultValue={b?.note ?? ""}
              className={INPUT_CLASS}
            />
          </Field>

          <Actions
            isEdit={isEdit}
            pending={pending}
            onClose={onClose}
            onDelete={handleDelete}
          />
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

function Actions({
  isEdit,
  pending,
  onClose,
  onDelete,
}: {
  isEdit: boolean;
  pending: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      <div>
        {isEdit && (
          <button
            type="button"
            onClick={onDelete}
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
  );
}
