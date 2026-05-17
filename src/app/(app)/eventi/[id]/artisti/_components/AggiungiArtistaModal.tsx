"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X } from "lucide-react";
import { TIPI_ARTE } from "@/lib/artisti";
import {
  aggiungiDaRubrica,
  creaENuovoArtista,
  type NuovoArtistaInput,
} from "../actions";

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500";

export type ArtistaRubrica = {
  id: string;
  nome: string;
  cognome: string;
  tipo_arte: string;
};

type Props = {
  eventoId: string;
  open: boolean;
  rubrica: ArtistaRubrica[];
  onClose: () => void;
};

type Tab = "rubrica" | "nuovo";

export function AggiungiArtistaModal({
  eventoId,
  open,
  rubrica,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<Tab>("rubrica");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [artistaId, setArtistaId] = useState<string>("");

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open) {
      setError(null);
      setArtistaId("");
      setTab(rubrica.length > 0 ? "rubrica" : "nuovo");
      if (!dlg.open) dlg.showModal();
    } else if (dlg.open) {
      dlg.close();
    }
  }, [open, rubrica.length]);

  if (!open) return null;

  function handleAddDaRubrica(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const res = await aggiungiDaRubrica(eventoId, artistaId);
      if (res.ok) onClose();
      else setError(res.error);
    });
  }

  function handleCreaNuovo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input: NuovoArtistaInput = {
      nome: String(fd.get("nome") ?? ""),
      cognome: String(fd.get("cognome") ?? ""),
      tipo_arte: String(fd.get("tipo_arte") ?? ""),
      residenza: (fd.get("residenza") as string) || null,
      link: (fd.get("link") as string) || null,
      link_opera: (fd.get("link_opera") as string) || null,
    };
    startTransition(async () => {
      const res = await creaENuovoArtista(eventoId, input);
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
            Aggiungi artista
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

        <div className="flex gap-1 p-1 bg-neutral-100 rounded-full mb-5">
          <button
            type="button"
            onClick={() => setTab("rubrica")}
            disabled={rubrica.length === 0}
            className={`flex-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              tab === "rubrica"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Da rubrica
          </button>
          <button
            type="button"
            onClick={() => setTab("nuovo")}
            className={`flex-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === "nuovo"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Nuovo artista
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        {tab === "rubrica" ? (
          <form onSubmit={handleAddDaRubrica} className="space-y-4">
            {rubrica.length === 0 ? (
              <p className="text-sm text-neutral-600">
                Nessun artista in rubrica. Usa &quot;Nuovo artista&quot;.
              </p>
            ) : (
              <Field label="Artista" required>
                <select
                  value={artistaId}
                  onChange={(e) => setArtistaId(e.target.value)}
                  required
                  className={INPUT_CLASS}
                >
                  <option value="" disabled>
                    — Seleziona —
                  </option>
                  {rubrica.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome} {a.cognome} ({a.tipo_arte})
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Buttons
              pending={pending}
              onClose={onClose}
              submitLabel="Aggiungi"
              disabled={!artistaId}
            />
          </form>
        ) : (
          <form onSubmit={handleCreaNuovo} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome" required>
                <input
                  type="text"
                  name="nome"
                  required
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Cognome" required>
                <input
                  type="text"
                  name="cognome"
                  required
                  className={INPUT_CLASS}
                />
              </Field>
            </div>
            <Field label="Tipo arte" required>
              <select
                name="tipo_arte"
                required
                className={INPUT_CLASS}
                defaultValue=""
              >
                <option value="" disabled>
                  — Scegli —
                </option>
                {TIPI_ARTE.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Residenza">
              <input
                type="text"
                name="residenza"
                className={INPUT_CLASS}
                placeholder="Es. Lugano, Berlino…"
              />
            </Field>
            <Field label="Link (sito o Instagram)">
              <input
                type="text"
                name="link"
                className={INPUT_CLASS}
                placeholder="https://…"
              />
            </Field>
            <Field label="Link opera">
              <input
                type="text"
                name="link_opera"
                className={INPUT_CLASS}
                placeholder="https://… (video, articolo, pdf)"
              />
            </Field>
            <Buttons
              pending={pending}
              onClose={onClose}
              submitLabel="Crea e aggiungi"
            />
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

function Buttons({
  pending,
  onClose,
  submitLabel,
  disabled,
}: {
  pending: boolean;
  onClose: () => void;
  submitLabel: string;
  disabled?: boolean;
}) {
  return (
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
        disabled={pending || disabled}
        className="px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
      >
        {pending ? "Salvataggio…" : submitLabel}
      </button>
    </div>
  );
}
