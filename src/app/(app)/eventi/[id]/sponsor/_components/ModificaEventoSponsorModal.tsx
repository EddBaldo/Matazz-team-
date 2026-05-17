"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { X, Trash2, ExternalLink } from "lucide-react";
import {
  aggiornaEventoSponsorR,
  eliminaEventoSponsorR,
  type EventoSponsorInput,
} from "../actions";
import { STATI_SPONSOR } from "../constants";

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500";

export type EventoSponsorEdit = {
  id: string;
  chi_contatto_id: string | null;
  stato: string;
  importo: number;
  data_contatto: string | null;
  note: string | null;
  sponsorId: string;
  sponsorNome: string;
  sponsorTipo: string;
  chiContattoNome: string | null;
};

export type TeamMember = { id: string; nome: string };

type Props = {
  eventoId: string;
  team: TeamMember[];
  sponsor: EventoSponsorEdit | null;
  onClose: () => void;
};

export function ModificaEventoSponsorModal({
  eventoId,
  team,
  sponsor,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (sponsor) {
      setError(null);
      if (!dlg.open) dlg.showModal();
    } else if (dlg.open) {
      dlg.close();
    }
  }, [sponsor]);

  if (!sponsor) return null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!sponsor) return;
    const fd = new FormData(e.currentTarget);
    const input: EventoSponsorInput = {
      chi_contatto_id: (fd.get("chi_contatto_id") as string) || null,
      stato: String(fd.get("stato") ?? "Da contattare"),
      importo: (fd.get("importo") as string) || null,
      data_contatto: (fd.get("data_contatto") as string) || null,
      note: (fd.get("note") as string) || null,
    };
    const id = sponsor.id;
    startTransition(async () => {
      const res = await aggiornaEventoSponsorR(eventoId, id, input);
      if (res.ok) onClose();
      else setError(res.error);
    });
  }

  function handleDelete() {
    if (!sponsor) return;
    if (!confirm(`Rimuovere ${sponsor.sponsorNome} dall'evento?`)) return;
    const id = sponsor.id;
    startTransition(async () => {
      const res = await eliminaEventoSponsorR(eventoId, id);
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
              {sponsor.sponsorNome}
            </h2>
            <p className="text-xs text-neutral-500">{sponsor.sponsorTipo}</p>
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

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          <Field label="Chi lo contatta">
            <select
              name="chi_contatto_id"
              defaultValue={sponsor.chi_contatto_id ?? ""}
              className={INPUT_CLASS}
            >
              <option value="">— Nessuno —</option>
              {team.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Stato">
              <select
                name="stato"
                defaultValue={sponsor.stato}
                className={INPUT_CLASS}
              >
                {STATI_SPONSOR.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Data contatto">
              <input
                type="date"
                name="data_contatto"
                defaultValue={sponsor.data_contatto ?? ""}
                className={INPUT_CLASS}
              />
            </Field>
          </div>

          <Field label="Importo (CHF)">
            <input
              type="number"
              step="0.01"
              min="0"
              name="importo"
              defaultValue={sponsor.importo}
              className={INPUT_CLASS}
            />
          </Field>
          <p className="text-xs text-neutral-500 -mt-2">
            Entra nelle entrate del Budget solo se lo stato è
            &quot;Confermato&quot;.
          </p>

          <Field label="Note">
            <textarea
              name="note"
              rows={3}
              defaultValue={sponsor.note ?? ""}
              className={INPUT_CLASS}
            />
          </Field>

          <Link
            href="/sponsor"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900"
          >
            <ExternalLink className="w-4 h-4" />
            Apri scheda sponsor in rubrica
          </Link>

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
