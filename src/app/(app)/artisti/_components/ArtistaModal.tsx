"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { X, Trash2, ExternalLink } from "lucide-react";
import { TIPI_ARTE } from "@/lib/artisti";
import {
  aggiornaArtistaR,
  creaArtistaR,
  eliminaArtistaR,
  type ArtistaInput,
} from "../actions";

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500";

export type ArtistaEdit = {
  id: string;
  nome: string;
  cognome: string;
  tipo_arte: string;
  residenza: string | null;
  link: string | null;
  link_opera: string | null;
};

type Mode = { kind: "add" } | { kind: "edit"; artista: ArtistaEdit };

type Props = {
  mode: Mode | null;
  onClose: () => void;
};

export function ArtistaModal({ mode, onClose }: Props) {
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
  const a: ArtistaEdit | null = mode.kind === "edit" ? mode.artista : null;

  const currentMode = mode;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input: ArtistaInput = {
      nome: String(fd.get("nome") ?? ""),
      cognome: String(fd.get("cognome") ?? ""),
      tipo_arte: String(fd.get("tipo_arte") ?? ""),
      residenza: (fd.get("residenza") as string) || null,
      link: (fd.get("link") as string) || null,
      link_opera: (fd.get("link_opera") as string) || null,
    };
    startTransition(async () => {
      const res =
        currentMode.kind === "edit"
          ? await aggiornaArtistaR(currentMode.artista.id, input)
          : await creaArtistaR(input);
      if (res.ok) onClose();
      else setError(res.error);
    });
  }

  function handleDelete() {
    if (currentMode.kind !== "edit") return;
    if (
      !confirm(
        `Eliminare ${currentMode.artista.nome} ${currentMode.artista.cognome}?`,
      )
    )
      return;
    const id = currentMode.artista.id;
    startTransition(async () => {
      const res = await eliminaArtistaR(id);
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
            {isEdit ? "Modifica artista" : "Nuovo artista"}
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome" required>
              <input
                type="text"
                name="nome"
                required
                defaultValue={a?.nome ?? ""}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Cognome" required>
              <input
                type="text"
                name="cognome"
                required
                defaultValue={a?.cognome ?? ""}
                className={INPUT_CLASS}
              />
            </Field>
          </div>

          <Field label="Tipo arte" required>
            <select
              name="tipo_arte"
              required
              defaultValue={a?.tipo_arte ?? ""}
              className={INPUT_CLASS}
            >
              <option value="" disabled>
                — Scegli —
              </option>
              {a &&
                !(TIPI_ARTE as readonly string[]).includes(a.tipo_arte) && (
                  <option value={a.tipo_arte}>{a.tipo_arte} (vecchio)</option>
                )}
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
              defaultValue={a?.residenza ?? ""}
              className={INPUT_CLASS}
              placeholder="Es. Lugano, Berlino…"
            />
          </Field>

          <Field label="Link (sito o Instagram)">
            <input
              type="text"
              name="link"
              defaultValue={a?.link ?? ""}
              className={INPUT_CLASS}
              placeholder="https://…"
            />
          </Field>

          <Field label="Link opera di riferimento">
            <input
              type="text"
              name="link_opera"
              defaultValue={a?.link_opera ?? ""}
              className={INPUT_CLASS}
              placeholder="https://… (video, articolo, pdf)"
            />
          </Field>

          {isEdit && a && (
            <Link
              href={`/artisti/${a.id}`}
              className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900"
            >
              <ExternalLink className="w-4 h-4" />
              Vedi scheda completa (eventi di interesse)
            </Link>
          )}

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
