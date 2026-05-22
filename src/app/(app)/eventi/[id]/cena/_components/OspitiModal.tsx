"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { aggiungiOspiteR, rimuoviOspiteR } from "../actions";

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500";

export type OspiteCena = {
  id: string;
  nome: string;
  intolleranze_cibo: string | null;
};

type Props = {
  eventoId: string;
  open: boolean;
  ospiti: OspiteCena[];
  onClose: () => void;
};

export function OspitiModal({ eventoId, open, ospiti, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [intolleranze, setIntolleranze] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open) {
      setError(null);
      setNome("");
      setIntolleranze("");
      if (!dlg.open) dlg.showModal();
    } else if (dlg.open) {
      dlg.close();
    }
  }, [open]);

  if (!open) return null;

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (nome.trim().length === 0) {
      setError("Il nome è obbligatorio.");
      return;
    }
    startTransition(async () => {
      const res = await aggiungiOspiteR(
        eventoId,
        nome,
        intolleranze.length > 0 ? intolleranze : null,
      );
      if (res.ok) {
        setNome("");
        setIntolleranze("");
        setError(null);
      } else {
        setError(res.error);
      }
    });
  }

  function handleRemove(id: string, label: string) {
    if (!confirm(`Eliminare ${label}?`)) return;
    startTransition(async () => {
      const res = await rimuoviOspiteR(eventoId, id);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:left-[calc(50%+7.5rem)] m-0 rounded-3xl p-0 backdrop:bg-black/40 w-[calc(100vw-2rem)] max-w-md max-h-[90vh]"
    >
      <div className="bg-white rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-neutral-900">
            Family &amp; Friends — ospiti cena
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

        <form onSubmit={handleAdd} className="space-y-3 mb-5">
          <div className="grid grid-cols-1 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-neutral-800">
                Nome <span className="text-red-600">*</span>
              </span>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Es. Anna Rossi"
                className={`${INPUT_CLASS} mt-1`}
                disabled={pending}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-neutral-800">
                Intolleranze
              </span>
              <input
                type="text"
                value={intolleranze}
                onChange={(e) => setIntolleranze(e.target.value)}
                placeholder="Es. vegetariano, lattosio…"
                className={`${INPUT_CLASS} mt-1`}
                disabled={pending}
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Aggiungi ospite
          </button>
        </form>

        <div className="border-t border-neutral-200 pt-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500 font-medium mb-2">
            Elenco ({ospiti.length})
          </p>
          {ospiti.length === 0 ? (
            <p className="text-sm text-neutral-600">
              Ancora nessun nome. Usa il form sopra per aggiungerne.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {ospiti.map((o) => (
                <li
                  key={o.id}
                  className="flex items-start justify-between gap-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {o.nome}
                    </p>
                    {o.intolleranze_cibo && (
                      <p className="text-xs text-neutral-600 truncate">
                        {o.intolleranze_cibo}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(o.id, o.nome)}
                    disabled={pending}
                    aria-label={`Elimina ${o.nome}`}
                    className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end pt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-sm text-neutral-700 hover:bg-neutral-100"
          >
            Chiudi
          </button>
        </div>
      </div>
    </dialog>
  );
}
