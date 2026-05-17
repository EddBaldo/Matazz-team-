"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X, Trash2 } from "lucide-react";
import { STATI_LOCATION } from "@/lib/locations";
import {
  aggiornaLocationR,
  creaLocationR,
  eliminaLocationR,
  type LocationInput,
} from "../actions";

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500";

export type LocationEdit = {
  id: string;
  nome: string;
  citta: string;
  stato: string;
  indirizzo: string | null;
  capienza: number | null;
  contatti_referente: string | null;
  costo_tipico: number | null;
  link: string | null;
  note: string | null;
};

type Mode = { kind: "add" } | { kind: "edit"; location: LocationEdit };

type Props = {
  mode: Mode | null;
  onClose: () => void;
};

function parseOptionalInt(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string" || v.trim().length === 0) return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function parseOptionalNumber(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string" || v.trim().length === 0) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function LocationModal({ mode, onClose }: Props) {
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
  const l: LocationEdit | null = mode.kind === "edit" ? mode.location : null;

  const currentMode = mode;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input: LocationInput = {
      nome: String(fd.get("nome") ?? ""),
      citta: String(fd.get("citta") ?? ""),
      stato: String(fd.get("stato") ?? ""),
      indirizzo: (fd.get("indirizzo") as string) || null,
      capienza: parseOptionalInt(fd.get("capienza")),
      contatti_referente: (fd.get("contatti_referente") as string) || null,
      costo_tipico: parseOptionalNumber(fd.get("costo_tipico")),
      link: (fd.get("link") as string) || null,
      note: (fd.get("note") as string) || null,
    };
    startTransition(async () => {
      const res =
        currentMode.kind === "edit"
          ? await aggiornaLocationR(currentMode.location.id, input)
          : await creaLocationR(input);
      if (res.ok) onClose();
      else setError(res.error);
    });
  }

  function handleDelete() {
    if (currentMode.kind !== "edit") return;
    if (!confirm(`Eliminare la location "${currentMode.location.nome}"?`))
      return;
    const id = currentMode.location.id;
    startTransition(async () => {
      const res = await eliminaLocationR(id);
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
            {isEdit ? "Modifica location" : "Nuova location"}
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
              defaultValue={l?.nome ?? ""}
              className={INPUT_CLASS}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Città" required>
              <input
                type="text"
                name="citta"
                required
                defaultValue={l?.citta ?? ""}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Stato" required>
              <select
                name="stato"
                required
                defaultValue={l?.stato ?? "Svizzera"}
                className={INPUT_CLASS}
              >
                {l &&
                  !(STATI_LOCATION as readonly string[]).includes(l.stato) && (
                    <option value={l.stato}>{l.stato}</option>
                  )}
                {STATI_LOCATION.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Indirizzo">
            <input
              type="text"
              name="indirizzo"
              defaultValue={l?.indirizzo ?? ""}
              className={INPUT_CLASS}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Capienza">
              <input
                type="number"
                step="1"
                min="0"
                name="capienza"
                defaultValue={l?.capienza ?? ""}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Costo tipico (CHF)">
              <input
                type="number"
                step="0.01"
                min="0"
                name="costo_tipico"
                defaultValue={l?.costo_tipico ?? ""}
                className={INPUT_CLASS}
              />
            </Field>
          </div>

          <Field label="Contatti referente">
            <input
              type="text"
              name="contatti_referente"
              defaultValue={l?.contatti_referente ?? ""}
              className={INPUT_CLASS}
              placeholder="Nome, telefono, email…"
            />
          </Field>

          <Field label="Link (sito o Google Maps)">
            <input
              type="text"
              name="link"
              defaultValue={l?.link ?? ""}
              className={INPUT_CLASS}
              placeholder="https://…"
            />
          </Field>

          <Field label="Note">
            <textarea
              name="note"
              rows={3}
              defaultValue={l?.note ?? ""}
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
