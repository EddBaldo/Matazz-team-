"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X, Trash2 } from "lucide-react";
import {
  aggiornaEventoArtistaR,
  eliminaEventoArtistaR,
  toggleConfermaR,
  type EventoArtistaInput,
} from "../actions";

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500";

const DOC_MANDATI = ["Sì", "Non ancora"];

export type EventoArtistaEdit = {
  id: string;
  chi_contatto_id: string | null;
  doc_mandati: string;
  doc_info_artisti: boolean;
  doc_proposal: boolean;
  necessita_alloggio: boolean;
  info_alloggio: string | null;
  ingombro: string | null;
  costi_produzione: number | null;
  artist_fee: number | null;
  intolleranze_cibo: string | null;
  commenti: string | null;
  confermato: boolean;
  artistaLabel: string;
  artistaTipoArte: string;
};

export type TeamMember = { id: string; nome: string };

type Props = {
  eventoId: string;
  team: TeamMember[];
  artista: EventoArtistaEdit | null;
  onClose: () => void;
};

export function ModificaArtistaModal({
  eventoId,
  team,
  artista,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confermato, setConfermato] = useState<boolean>(false);
  const [necessitaAlloggio, setNecessitaAlloggio] = useState<boolean>(false);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (artista) {
      setError(null);
      setConfermato(artista.confermato);
      setNecessitaAlloggio(artista.necessita_alloggio);
      if (!dlg.open) dlg.showModal();
    } else if (dlg.open) {
      dlg.close();
    }
  }, [artista]);

  if (!artista) return null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!artista) return;
    const fd = new FormData(e.currentTarget);
    const input: EventoArtistaInput = {
      chi_contatto_id: (fd.get("chi_contatto_id") as string) || null,
      doc_mandati: String(fd.get("doc_mandati") ?? "Non ancora"),
      doc_info_artisti: fd.get("doc_info_artisti") === "on",
      doc_proposal: fd.get("doc_proposal") === "on",
      necessita_alloggio: necessitaAlloggio,
      info_alloggio: (fd.get("info_alloggio") as string) || null,
      ingombro: (fd.get("ingombro") as string) || null,
      costi_produzione: (fd.get("costi_produzione") as string) || null,
      artist_fee: (fd.get("artist_fee") as string) || null,
      intolleranze_cibo: (fd.get("intolleranze_cibo") as string) || null,
      commenti: (fd.get("commenti") as string) || null,
    };
    const artId = artista.id;
    startTransition(async () => {
      // Salva i campi dell'evento_artista
      const r1 = await aggiornaEventoArtistaR(eventoId, artId, input);
      if (!r1.ok) {
        setError(r1.error);
        return;
      }
      // Allinea lo stato confermato se cambiato
      if (confermato !== artista.confermato) {
        const r2 = await toggleConfermaR(eventoId, artId, confermato);
        if (!r2.ok) {
          setError(r2.error);
          return;
        }
      }
      onClose();
    });
  }

  function handleDelete() {
    if (!artista) return;
    if (!confirm(`Rimuovere ${artista.artistaLabel} dall'evento?`)) return;
    const artId = artista.id;
    startTransition(async () => {
      const res = await eliminaEventoArtistaR(eventoId, artId);
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
        <div className="flex items-start justify-between mb-1 gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-neutral-900 truncate">
              {artista.artistaLabel}
            </h2>
            <p className="text-xs text-neutral-500">{artista.artistaTipoArte}</p>
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

        <div className="mt-4 mb-5 flex items-center justify-between gap-3 rounded-2xl bg-neutral-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-neutral-900">
              Stato conferma
            </p>
            <p className="text-xs text-neutral-500">
              {confermato
                ? "Confermato per l'evento"
                : "In attesa di conferma"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfermato(!confermato)}
            role="switch"
            aria-checked={confermato}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
              confermato ? "bg-green-600" : "bg-neutral-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${
                confermato ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Chi lo contatta">
            <select
              name="chi_contatto_id"
              defaultValue={artista.chi_contatto_id ?? ""}
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

          <Field label="Documenti mandati">
            <select
              name="doc_mandati"
              defaultValue={artista.doc_mandati}
              className={INPUT_CLASS}
            >
              {DOC_MANDATI.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <div>
            <span className="text-sm font-medium text-neutral-800">
              Documenti ricevuti
            </span>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              <label className="flex items-center gap-2 text-sm text-neutral-800">
                <input
                  type="checkbox"
                  name="doc_info_artisti"
                  defaultChecked={artista.doc_info_artisti}
                  className="w-4 h-4 rounded border-neutral-300 text-amber-600 focus:ring-amber-500"
                />
                Info artisti
              </label>
              <label className="flex items-center gap-2 text-sm text-neutral-800">
                <input
                  type="checkbox"
                  name="doc_proposal"
                  defaultChecked={artista.doc_proposal}
                  className="w-4 h-4 rounded border-neutral-300 text-amber-600 focus:ring-amber-500"
                />
                Proposal
              </label>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-neutral-800">
            <input
              type="checkbox"
              checked={necessitaAlloggio}
              onChange={(e) => setNecessitaAlloggio(e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 text-amber-600 focus:ring-amber-500"
            />
            Necessita alloggio
          </label>

          {necessitaAlloggio && (
            <Field label="Info alloggio">
              <textarea
                name="info_alloggio"
                rows={2}
                defaultValue={artista.info_alloggio ?? ""}
                className={INPUT_CLASS}
              />
            </Field>
          )}

          <Field label="Ingombro opera">
            <input
              type="text"
              name="ingombro"
              defaultValue={artista.ingombro ?? ""}
              placeholder="es. un arco, 3 m², 10×5 m…"
              className={INPUT_CLASS}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Costi produzione (CHF)">
              <input
                type="number"
                step="0.01"
                min="0"
                name="costi_produzione"
                defaultValue={artista.costi_produzione ?? 0}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Fee (CHF)">
              <input
                type="number"
                step="0.01"
                min="0"
                name="artist_fee"
                defaultValue={artista.artist_fee ?? 0}
                className={INPUT_CLASS}
              />
            </Field>
          </div>

          <Field label="Intolleranze cibo">
            <input
              type="text"
              name="intolleranze_cibo"
              defaultValue={artista.intolleranze_cibo ?? ""}
              className={INPUT_CLASS}
            />
          </Field>

          <Field label="Commenti">
            <textarea
              name="commenti"
              rows={3}
              defaultValue={artista.commenti ?? ""}
              className={INPUT_CLASS}
            />
          </Field>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Elimina
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
