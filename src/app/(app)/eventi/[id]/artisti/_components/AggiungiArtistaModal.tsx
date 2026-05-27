"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X } from "lucide-react";
import { TIPI_ARTE } from "@/lib/artisti";
import { Select } from "@/components/ui/Select";
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
  const [tipoArte, setTipoArte] = useState<string>("");
  const [modo, setModo] = useState<"persona" | "collettivo">("persona");

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open) {
      setError(null);
      setArtistaId("");
      setTipoArte("");
      setModo("persona");
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
    const nome =
      modo === "collettivo"
        ? String(fd.get("nome_collettivo") ?? "")
        : String(fd.get("nome") ?? "");
    const cognome =
      modo === "collettivo" ? "" : String(fd.get("cognome") ?? "");
    const input: NuovoArtistaInput = {
      nome,
      cognome,
      tipo_arte: tipoArte,
      residenza: (fd.get("residenza") as string) || null,
      link: (fd.get("link") as string) || null,
      link_opera: (fd.get("link_opera") as string) || null,
      membri_extra: (fd.get("membri_extra") as string) || null,
      numero_persone: (fd.get("numero_persone") as string) || null,
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
                <Select
                  value={artistaId}
                  onChange={setArtistaId}
                  required
                  placeholder="— Seleziona —"
                  options={rubrica.map((a) => ({
                    value: a.id,
                    label: `${a.nome} ${a.cognome} (${a.tipo_arte})`,
                  }))}
                />
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
            <ModoToggle modo={modo} setModo={setModo} />

            {modo === "persona" ? (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nome" required>
                  <input
                    type="text"
                    name="nome"
                    required
                    className={INPUT_CLASS}
                  />
                </Field>
                <Field label="Cognome">
                  <input
                    type="text"
                    name="cognome"
                    className={INPUT_CLASS}
                  />
                </Field>
              </div>
            ) : (
              <Field label="Nome del collettivo" required>
                <input
                  type="text"
                  name="nome_collettivo"
                  required
                  className={INPUT_CLASS}
                  placeholder="Es. Slime Mold, Collettivo Aria…"
                />
              </Field>
            )}

            <div className="grid grid-cols-[1fr_auto] gap-3">
              <Field
                label={
                  modo === "collettivo"
                    ? "Membri del collettivo"
                    : "Altri membri (per duo)"
                }
              >
                <input
                  type="text"
                  name="membri_extra"
                  className={INPUT_CLASS}
                  placeholder={
                    modo === "collettivo"
                      ? "Es. Anna, Marco, Luca"
                      : "Es. Andrea Sassi"
                  }
                />
              </Field>
              <Field label="N. persone">
                <input
                  type="number"
                  name="numero_persone"
                  min="1"
                  step="1"
                  defaultValue="1"
                  className={`${INPUT_CLASS} w-20`}
                />
              </Field>
            </div>

            <Field label="Tipo arte" required>
              <Select
                value={tipoArte}
                onChange={setTipoArte}
                required
                placeholder="— Scegli —"
                options={TIPI_ARTE.map((t) => ({ value: t, label: t }))}
              />
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

function ModoToggle({
  modo,
  setModo,
}: {
  modo: "persona" | "collettivo";
  setModo: (m: "persona" | "collettivo") => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-neutral-100 p-1">
      <button
        type="button"
        onClick={() => setModo("persona")}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          modo === "persona"
            ? "bg-white text-neutral-900 shadow-sm"
            : "text-neutral-600 hover:text-neutral-900"
        }`}
      >
        Persona
      </button>
      <button
        type="button"
        onClick={() => setModo("collettivo")}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          modo === "collettivo"
            ? "bg-white text-neutral-900 shadow-sm"
            : "text-neutral-600 hover:text-neutral-900"
        }`}
      >
        Collettivo
      </button>
    </div>
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
