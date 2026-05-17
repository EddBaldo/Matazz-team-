"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { creaEventoR, type EventoInput } from "../actions";

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500";

const STATI = ["In pianificazione", "Concluso"];

export type LocationOption = { id: string; nome: string; citta: string };

type Props = {
  open: boolean;
  locations: LocationOption[];
  onClose: () => void;
};

export function NuovoEventoModal({ open, locations, onClose }: Props) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open) {
      setError(null);
      if (!dlg.open) dlg.showModal();
    } else if (dlg.open) {
      dlg.close();
    }
  }, [open]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input: EventoInput = {
      nome: String(fd.get("nome") ?? ""),
      data_inizio: String(fd.get("data_inizio") ?? ""),
      data_fine: (fd.get("data_fine") as string) || null,
      location_id: (fd.get("location_id") as string) || null,
      stato: String(fd.get("stato") ?? "In pianificazione"),
      descrizione: (fd.get("descrizione") as string) || null,
    };
    startTransition(async () => {
      const res = await creaEventoR(input);
      if (res.ok) {
        onClose();
        router.push(`/eventi/${res.id}`);
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
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:left-[calc(50%+8rem)] m-0 rounded-3xl p-0 backdrop:bg-black/40 w-[calc(100vw-2rem)] max-w-sm max-h-[90vh]"
    >
      <div className="bg-white rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-neutral-900">
            Nuovo evento
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
          <Field label="Nome evento" required>
            <input type="text" name="nome" required className={INPUT_CLASS} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Data inizio" required>
              <input
                type="date"
                name="data_inizio"
                required
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Data fine">
              <input type="date" name="data_fine" className={INPUT_CLASS} />
            </Field>
          </div>

          <Field label="Stato" required>
            <select
              name="stato"
              required
              defaultValue="In pianificazione"
              className={INPUT_CLASS}
            >
              {STATI.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Location">
            <select name="location_id" defaultValue="" className={INPUT_CLASS}>
              <option value="">— Nessuna —</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome} ({l.citta})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Descrizione">
            <textarea name="descrizione" rows={3} className={INPUT_CLASS} />
          </Field>

          <div className="flex items-center justify-end gap-2 pt-2">
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
              {pending ? "Creazione…" : "Crea evento"}
            </button>
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
