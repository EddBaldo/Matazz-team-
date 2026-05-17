"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { X } from "lucide-react";
import { aggiungiSponsorR } from "../actions";

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500";

export type SponsorRubrica = {
  id: string;
  nome: string;
  tipo: string;
};

type Props = {
  eventoId: string;
  open: boolean;
  rubrica: SponsorRubrica[];
  giaCollegati: Set<string>;
  onClose: () => void;
};

export function AggiungiSponsorModal({
  eventoId,
  open,
  rubrica,
  giaCollegati,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [sponsorId, setSponsorId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open) {
      setError(null);
      setSponsorId("");
      if (!dlg.open) dlg.showModal();
    } else if (dlg.open) {
      dlg.close();
    }
  }, [open]);

  if (!open) return null;

  const disponibili = rubrica.filter((s) => !giaCollegati.has(s.id));

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const res = await aggiungiSponsorR(eventoId, sponsorId);
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
            Aggiungi sponsor
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

        {disponibili.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-neutral-600">
              {rubrica.length === 0
                ? "La rubrica sponsor è vuota."
                : "Tutti gli sponsor della rubrica sono già collegati a questo evento."}
            </p>
            <Link
              href="/sponsor"
              className="inline-block text-sm text-amber-700 hover:text-amber-800 underline"
            >
              Vai a Scouting Sponsor per aggiungerne uno nuovo →
            </Link>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-full text-sm text-neutral-700 hover:bg-neutral-100"
              >
                Chiudi
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Sponsor dalla rubrica" required>
              <select
                value={sponsorId}
                onChange={(e) => setSponsorId(e.target.value)}
                required
                className={INPUT_CLASS}
              >
                <option value="" disabled>
                  — Seleziona —
                </option>
                {disponibili.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome} ({s.tipo})
                  </option>
                ))}
              </select>
            </Field>
            <p className="text-xs text-neutral-500">
              Una volta aggiunto, potrai impostare chi lo contatta, stato e
              importo cliccando sulla riga.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Link
                href="/sponsor"
                onClick={onClose}
                className="text-sm text-neutral-600 hover:text-neutral-900 underline mr-auto"
              >
                Aggiungi nuovo in rubrica
              </Link>
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
                disabled={pending || !sponsorId}
                className="px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
              >
                {pending ? "Aggiungo…" : "Aggiungi"}
              </button>
            </div>
          </form>
        )}
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
