"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X, Trash2 } from "lucide-react";
import {
  aggiornaFoodTruckR,
  creaFoodTruckR,
  eliminaFoodTruckR,
  type FoodTruckInput,
} from "../actions";

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500";

export type FoodTruckEdit = {
  id: string;
  nome: string;
  modello: "Percentuale" | "Acquisto";
  incasso_lordo_stimato: number;
  percentuale_matazz: number;
  costo_unitario: number | null;
  prezzo_vendita: number | null;
  quantita_stimata: number | null;
  selezionata: boolean;
  note: string | null;
};

type Mode = { kind: "add" } | { kind: "edit"; ft: FoodTruckEdit };

type Props = {
  eventoId: string;
  mode: Mode | null;
  onClose: () => void;
};

export function FoodTruckModal({ eventoId, mode, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [selezionata, setSelezionata] = useState<boolean>(false);
  const [modello, setModello] = useState<"Percentuale" | "Acquisto">(
    "Percentuale",
  );

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (mode) {
      setError(null);
      if (mode.kind === "edit") {
        setSelezionata(mode.ft.selezionata);
        setModello(mode.ft.modello);
      } else {
        setSelezionata(false);
        setModello("Percentuale");
      }
      if (!dlg.open) dlg.showModal();
    } else if (dlg.open) {
      dlg.close();
    }
  }, [mode]);

  if (!mode) return null;

  const isEdit = mode.kind === "edit";
  const f = mode.kind === "edit" ? mode.ft : null;
  const currentMode = mode;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input: FoodTruckInput = {
      nome: String(fd.get("nome") ?? ""),
      modello: modello,
      incasso_lordo_stimato:
        (fd.get("incasso_lordo_stimato") as string) || null,
      percentuale_matazz: (fd.get("percentuale_matazz") as string) || null,
      costo_unitario: (fd.get("costo_unitario") as string) || null,
      prezzo_vendita: (fd.get("prezzo_vendita") as string) || null,
      quantita_stimata: (fd.get("quantita_stimata") as string) || null,
      selezionata: selezionata,
      note: (fd.get("note") as string) || null,
    };
    startTransition(async () => {
      const res =
        currentMode.kind === "edit"
          ? await aggiornaFoodTruckR(eventoId, currentMode.ft.id, input)
          : await creaFoodTruckR(eventoId, input);
      if (res.ok) onClose();
      else setError(res.error);
    });
  }

  function handleDelete() {
    if (currentMode.kind !== "edit") return;
    if (!confirm(`Eliminare ${currentMode.ft.nome}?`)) return;
    const id = currentMode.ft.id;
    startTransition(async () => {
      const res = await eliminaFoodTruckR(eventoId, id);
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
            {isEdit ? "Modifica food truck" : "Nuovo food truck"}
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
          <Field label="Nome" required>
            <input
              type="text"
              name="nome"
              required
              defaultValue={f?.nome ?? ""}
              className={INPUT_CLASS}
            />
          </Field>

          <div>
            <span className="text-sm font-medium text-neutral-800">
              Modello
            </span>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setModello("Percentuale")}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  modello === "Percentuale"
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                Percentuale
              </button>
              <button
                type="button"
                onClick={() => setModello("Acquisto")}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  modello === "Acquisto"
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                Acquisto e rivendita
              </button>
            </div>
            <p className="text-xs text-neutral-500 mt-1.5">
              {modello === "Percentuale"
                ? "Loro vendono, noi prendiamo % sull'incasso lordo."
                : "Noi compriamo a prezzo base e rivendiamo. Guadagno = margine × quantità."}
            </p>
          </div>

          {modello === "Percentuale" ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Incasso lordo stim. (CHF)">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="incasso_lordo_stimato"
                  defaultValue={f?.incasso_lordo_stimato ?? 0}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="% per Matazz">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  name="percentuale_matazz"
                  defaultValue={f?.percentuale_matazz ?? 0}
                  className={INPUT_CLASS}
                />
              </Field>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <Field label="Costo unit.">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="costo_unitario"
                  defaultValue={f?.costo_unitario ?? 0}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Vendita unit.">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="prezzo_vendita"
                  defaultValue={f?.prezzo_vendita ?? 0}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Quantità">
                <input
                  type="number"
                  step="1"
                  min="0"
                  name="quantita_stimata"
                  defaultValue={f?.quantita_stimata ?? 0}
                  className={INPUT_CLASS}
                />
              </Field>
            </div>
          )}

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
              defaultValue={f?.note ?? ""}
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
