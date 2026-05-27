"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X, Trash2, Pencil, Check } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { TIPI_ARTE } from "@/lib/artisti";
import { aggiornaArtistaAnagraficaR } from "@/app/(app)/artisti/actions";
import {
  aggiornaEventoArtistaR,
  eliminaEventoArtistaR,
  toggleConfermaR,
  type EventoArtistaInput,
} from "../actions";

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500";

export type EventoArtistaEdit = {
  id: string;
  chi_contatto_id: string | null;
  doc_mandati: string;
  doc_info_artisti: boolean;
  doc_proposal: boolean;
  necessita_alloggio: boolean;
  presente_cena: boolean;
  info_alloggio: string | null;
  ingombro: string | null;
  costi_produzione: number | null;
  artist_fee: number | null;
  intolleranze_cibo: string | null;
  commenti: string | null;
  confermato: boolean;
  artistaId: string;
  artistaLabel: string;
  artistaTipoArte: string;
  artistaNome: string;
  artistaCognome: string;
  artistaMembriExtra: string | null;
  artistaNumeroPersone: number;
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
  const [chiContattoId, setChiContattoId] = useState<string>("");
  const [editAnagrafica, setEditAnagrafica] = useState<boolean>(false);
  const [savingAnagrafica, startSaveAnagrafica] = useTransition();
  const [editNome, setEditNome] = useState<string>("");
  const [editCognome, setEditCognome] = useState<string>("");
  const [editTipoArte, setEditTipoArte] = useState<string>("");
  const [editMembriExtra, setEditMembriExtra] = useState<string>("");
  const [editNumeroPersone, setEditNumeroPersone] = useState<string>("1");
  const [editModo, setEditModo] = useState<"persona" | "collettivo">(
    "persona",
  );
  // Copia locale dell'anagrafica mostrata in header (si aggiorna dopo save)
  const [shownNome, setShownNome] = useState<string>("");
  const [shownCognome, setShownCognome] = useState<string>("");
  const [shownTipoArte, setShownTipoArte] = useState<string>("");
  const [shownMembriExtra, setShownMembriExtra] = useState<string | null>(null);
  const [shownNumeroPersone, setShownNumeroPersone] = useState<number>(1);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (artista) {
      setError(null);
      setConfermato(artista.confermato);
      setChiContattoId(artista.chi_contatto_id ?? "");
      setEditAnagrafica(false);
      setEditNome(artista.artistaNome);
      setEditCognome(artista.artistaCognome);
      setEditTipoArte(artista.artistaTipoArte);
      setEditMembriExtra(artista.artistaMembriExtra ?? "");
      setEditNumeroPersone(String(artista.artistaNumeroPersone ?? 1));
      setEditModo(
        !artista.artistaCognome || artista.artistaCognome.trim() === ""
          ? "collettivo"
          : "persona",
      );
      setShownNome(artista.artistaNome);
      setShownCognome(artista.artistaCognome);
      setShownTipoArte(artista.artistaTipoArte);
      setShownMembriExtra(artista.artistaMembriExtra);
      setShownNumeroPersone(artista.artistaNumeroPersone ?? 1);
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
      chi_contatto_id: chiContattoId || null,
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

  function handleSaveAnagrafica() {
    if (!artista) return;
    const artistaId = artista.artistaId;
    startSaveAnagrafica(async () => {
      const finalCognome = editModo === "collettivo" ? "" : editCognome;
      const res = await aggiornaArtistaAnagraficaR(artistaId, {
        nome: editNome,
        cognome: finalCognome,
        tipo_arte: editTipoArte,
        membri_extra: editMembriExtra,
        numero_persone: editNumeroPersone,
      });
      if (res.ok) {
        setShownNome(editNome.trim());
        setShownCognome(finalCognome.trim());
        setShownTipoArte(editTipoArte);
        const trimmed = editMembriExtra.trim();
        setShownMembriExtra(trimmed.length > 0 ? trimmed : null);
        const n = Number.parseInt(editNumeroPersone, 10);
        setShownNumeroPersone(Number.isFinite(n) && n >= 1 ? n : 1);
        setEditAnagrafica(false);
        setError(null);
      } else {
        setError(res.error);
      }
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
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:left-[calc(50%+7.5rem)] m-0 rounded-3xl p-0 backdrop:bg-black/40 w-[calc(100vw-2rem)] max-w-md max-h-[90vh]"
    >
      <div className="bg-white rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-3 gap-3">
          <div className="min-w-0 flex-1">
            {editAnagrafica ? (
              <div className="space-y-2">
                <div className="inline-flex rounded-full bg-neutral-100 p-1">
                  <button
                    type="button"
                    onClick={() => setEditModo("persona")}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      editModo === "persona"
                        ? "bg-white text-neutral-900 shadow-sm"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    Persona
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditModo("collettivo")}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      editModo === "collettivo"
                        ? "bg-white text-neutral-900 shadow-sm"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    Collettivo
                  </button>
                </div>
                {editModo === "persona" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value)}
                      placeholder="Nome"
                      className={INPUT_CLASS}
                    />
                    <input
                      type="text"
                      value={editCognome}
                      onChange={(e) => setEditCognome(e.target.value)}
                      placeholder="Cognome"
                      className={INPUT_CLASS}
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    placeholder="Nome del collettivo"
                    className={INPUT_CLASS}
                  />
                )}
                <input
                  type="text"
                  value={editMembriExtra}
                  onChange={(e) => setEditMembriExtra(e.target.value)}
                  placeholder={
                    editModo === "collettivo"
                      ? "Membri (es. Anna, Marco, Luca)"
                      : "Altri membri (es. Andrea Sassi)"
                  }
                  className={INPUT_CLASS}
                />
                <label className="flex items-center gap-2 text-sm text-neutral-700">
                  Numero persone
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={editNumeroPersone}
                    onChange={(e) => setEditNumeroPersone(e.target.value)}
                    className={`${INPUT_CLASS} w-20`}
                  />
                </label>
                <Select
                  value={editTipoArte}
                  onChange={setEditTipoArte}
                  options={[
                    ...(editTipoArte &&
                    !(TIPI_ARTE as readonly string[]).includes(editTipoArte)
                      ? [
                          {
                            value: editTipoArte,
                            label: `${editTipoArte} (vecchio)`,
                          },
                        ]
                      : []),
                    ...TIPI_ARTE.map((t) => ({ value: t, label: t })),
                  ]}
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveAnagrafica}
                    disabled={savingAnagrafica}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {savingAnagrafica ? "Salvataggio…" : "Salva anagrafica"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditAnagrafica(false);
                      setEditNome(shownNome);
                      setEditCognome(shownCognome);
                      setEditTipoArte(shownTipoArte);
                      setEditMembriExtra(shownMembriExtra ?? "");
                      setEditNumeroPersone(String(shownNumeroPersone));
                    }}
                    disabled={savingAnagrafica}
                    className="px-3 py-1.5 rounded-full text-xs text-neutral-700 hover:bg-neutral-100"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <div className="min-w-0">
                  <h2 className="text-2xl font-semibold text-neutral-900 leading-tight">
                    {[shownNome, shownCognome].filter(Boolean).join(" ")}
                  </h2>
                  {shownMembriExtra && (
                    <p className="text-sm text-neutral-700 mt-0.5">
                      + {shownMembriExtra}
                    </p>
                  )}
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {shownTipoArte}
                    {shownNumeroPersone > 1 && (
                      <span> · {shownNumeroPersone} persone</span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditAnagrafica(true)}
                  aria-label="Modifica anagrafica artista"
                  className="inline-flex items-center justify-center w-7 h-7 rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 shrink-0 mt-1"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
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
            <Select
              value={chiContattoId}
              onChange={setChiContattoId}
              options={[
                { value: "", label: "— Nessuno —" },
                ...team.map((m) => ({ value: m.id, label: m.nome })),
              ]}
            />
          </Field>

          <Field label="Info alloggio (se serve)">
            <textarea
              name="info_alloggio"
              rows={2}
              defaultValue={artista.info_alloggio ?? ""}
              className={INPUT_CLASS}
              placeholder="Dettagli sull'alloggio se Necessita alloggio è acceso nella tabella."
            />
          </Field>

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
