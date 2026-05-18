"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X, Trash2 } from "lucide-react";
import { Select } from "@/components/ui/Select";
import {
  aggiornaSponsorR,
  creaSponsorR,
  eliminaSponsorR,
  type SponsorInput,
} from "../actions";
import { TIPI_SPONSOR } from "../constants";

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500";

export type SponsorEdit = {
  id: string;
  nome: string;
  tipo: string;
  contatto: string | null;
  indirizzo: string | null;
  telefono: string | null;
  sito_web: string | null;
  note: string | null;
};

type Mode = { kind: "add" } | { kind: "edit"; sponsor: SponsorEdit };

type Props = {
  mode: Mode | null;
  onClose: () => void;
};

export function SponsorModal({ mode, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [tipo, setTipo] = useState<string>("");

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (mode) {
      setError(null);
      setTipo(mode.kind === "edit" ? mode.sponsor.tipo : "");
      if (!dlg.open) dlg.showModal();
    } else if (dlg.open) {
      dlg.close();
    }
  }, [mode]);

  if (!mode) return null;

  const isEdit = mode.kind === "edit";
  const s = mode.kind === "edit" ? mode.sponsor : null;
  const currentMode = mode;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input: SponsorInput = {
      nome: String(fd.get("nome") ?? ""),
      tipo,
      contatto: (fd.get("contatto") as string) || null,
      indirizzo: (fd.get("indirizzo") as string) || null,
      telefono: (fd.get("telefono") as string) || null,
      sito_web: (fd.get("sito_web") as string) || null,
      note: (fd.get("note") as string) || null,
    };
    startTransition(async () => {
      const res =
        currentMode.kind === "edit"
          ? await aggiornaSponsorR(currentMode.sponsor.id, input)
          : await creaSponsorR(input);
      if (res.ok) onClose();
      else setError(res.error);
    });
  }

  function handleDelete() {
    if (currentMode.kind !== "edit") return;
    if (!confirm(`Eliminare ${currentMode.sponsor.nome}?`)) return;
    const id = currentMode.sponsor.id;
    startTransition(async () => {
      const res = await eliminaSponsorR(id);
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
            {isEdit ? "Modifica sponsor" : "Nuovo sponsor"}
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
              defaultValue={s?.nome ?? ""}
              className={INPUT_CLASS}
            />
          </Field>

          <Field label="Tipo" required>
            <Select
              value={tipo}
              onChange={setTipo}
              required
              placeholder="— Scegli —"
              options={[
                ...(s && !(TIPI_SPONSOR as readonly string[]).includes(s.tipo)
                  ? [{ value: s.tipo, label: `${s.tipo} (vecchio)` }]
                  : []),
                ...TIPI_SPONSOR.map((t) => ({ value: t, label: t })),
              ]}
            />
          </Field>

          <Field label="Contatto (nome persona di riferimento)">
            <input
              type="text"
              name="contatto"
              defaultValue={s?.contatto ?? ""}
              className={INPUT_CLASS}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Città / Indirizzo">
              <input
                type="text"
                name="indirizzo"
                defaultValue={s?.indirizzo ?? ""}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Telefono">
              <input
                type="text"
                name="telefono"
                defaultValue={s?.telefono ?? ""}
                className={INPUT_CLASS}
              />
            </Field>
          </div>

          <Field label="Sito web">
            <input
              type="text"
              name="sito_web"
              defaultValue={s?.sito_web ?? ""}
              className={INPUT_CLASS}
              placeholder="https://…"
            />
          </Field>

          <Field label="Note">
            <textarea
              name="note"
              rows={3}
              defaultValue={s?.note ?? ""}
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
