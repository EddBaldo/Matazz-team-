"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X, Trash2, Plus } from "lucide-react";
import {
  aggiornaMaterialeR,
  creaMaterialeR,
  eliminaMaterialeR,
  type MaterialeInput,
  type FonteInput,
} from "../actions";

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500";

export type Fonte = {
  label: string | null;
  url: string | null;
};

export type MaterialeEdit = {
  id: string;
  articolo: string;
  quantita: number;
  prezzo_unitario: number | null;
  a_cosa_serve: string | null;
  fonti: Fonte[];
  preso: boolean;
  gia_disponibile: boolean;
  note: string | null;
};

type Mode = { kind: "add" } | { kind: "edit"; materiale: MaterialeEdit };

type Props = {
  eventoId: string;
  mode: Mode | null;
  onClose: () => void;
};

export function MaterialeModal({ eventoId, mode, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [preso, setPreso] = useState<boolean>(false);
  const [giaDisp, setGiaDisp] = useState<boolean>(false);
  const [fonti, setFonti] = useState<Fonte[]>([]);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (mode) {
      setError(null);
      if (mode.kind === "edit") {
        setPreso(mode.materiale.preso);
        setGiaDisp(mode.materiale.gia_disponibile);
        setFonti(
          mode.materiale.fonti.length > 0
            ? mode.materiale.fonti
            : [{ label: null, url: null }],
        );
      } else {
        setPreso(false);
        setGiaDisp(false);
        setFonti([{ label: null, url: null }]);
      }
      if (!dlg.open) dlg.showModal();
    } else if (dlg.open) {
      dlg.close();
    }
  }, [mode]);

  if (!mode) return null;

  const isEdit = mode.kind === "edit";
  const m = mode.kind === "edit" ? mode.materiale : null;
  const currentMode = mode;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const fontiInput: FonteInput[] = fonti
      .map((f) => ({
        label: f.label?.trim() ? f.label.trim() : null,
        url: f.url?.trim() ? f.url.trim() : null,
      }))
      .filter((f) => f.label || f.url);
    const input: MaterialeInput = {
      articolo: String(fd.get("articolo") ?? ""),
      quantita: (fd.get("quantita") as string) || null,
      prezzo_unitario: (fd.get("prezzo_unitario") as string) || null,
      a_cosa_serve: (fd.get("a_cosa_serve") as string) || null,
      fonti: fontiInput,
      preso,
      gia_disponibile: giaDisp,
      note: (fd.get("note") as string) || null,
    };
    startTransition(async () => {
      const res =
        currentMode.kind === "edit"
          ? await aggiornaMaterialeR(eventoId, currentMode.materiale.id, input)
          : await creaMaterialeR(eventoId, input);
      if (res.ok) onClose();
      else setError(res.error);
    });
  }

  function handleDelete() {
    if (currentMode.kind !== "edit") return;
    if (!confirm(`Eliminare ${currentMode.materiale.articolo}?`)) return;
    const id = currentMode.materiale.id;
    startTransition(async () => {
      const res = await eliminaMaterialeR(eventoId, id);
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
            {isEdit ? "Modifica materiale" : "Nuovo materiale"}
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
          <Field label="Materiale" required>
            <input
              type="text"
              name="articolo"
              required
              defaultValue={m?.articolo ?? ""}
              className={INPUT_CLASS}
              placeholder="Es. Cavi prolunga, Sgabelli, Carta da pacco…"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantità">
              <input
                type="number"
                step="1"
                min="0"
                name="quantita"
                defaultValue={m?.quantita ?? 1}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Prezzo unit. (CHF)">
              <input
                type="number"
                step="0.01"
                min="0"
                name="prezzo_unitario"
                defaultValue={m?.prezzo_unitario ?? 0}
                className={INPUT_CLASS}
              />
            </Field>
          </div>

          <Field label="A cosa serve">
            <input
              type="text"
              name="a_cosa_serve"
              defaultValue={m?.a_cosa_serve ?? ""}
              className={INPUT_CLASS}
              placeholder="Es. Allestimento opera Xenia, bar…"
            />
          </Field>

          <div>
            <span className="text-sm font-medium text-neutral-800">
              Dove lo prendiamo
            </span>
            <p className="text-xs text-neutral-500 mt-0.5 mb-2">
              Puoi mettere piu&apos; fonti (es. Bauhaus + un link Amazon).
              Lascia vuota l&apos;etichetta se ti basta solo il link.
            </p>
            <div className="space-y-2">
              {fonti.map((f, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={f.label ?? ""}
                      onChange={(e) =>
                        setFonti((prev) =>
                          prev.map((p, idx) =>
                            idx === i ? { ...p, label: e.target.value } : p,
                          ),
                        )
                      }
                      className={INPUT_CLASS}
                      placeholder="Etichetta (es. Bauhaus, casa Pino)"
                    />
                    <input
                      type="text"
                      value={f.url ?? ""}
                      onChange={(e) =>
                        setFonti((prev) =>
                          prev.map((p, idx) =>
                            idx === i ? { ...p, url: e.target.value } : p,
                          ),
                        )
                      }
                      className={INPUT_CLASS}
                      placeholder="https://… (opzionale)"
                    />
                  </div>
                  {fonti.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setFonti((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      aria-label="Rimuovi fonte"
                      className="mt-1 inline-flex items-center justify-center w-8 h-8 rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setFonti((prev) => [...prev, { label: null, url: null }])
              }
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-neutral-700 bg-neutral-100 hover:bg-neutral-200"
            >
              <Plus className="w-3.5 h-3.5" />
              Aggiungi fonte
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl bg-neutral-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-neutral-900">Preso</p>
              <p className="text-xs text-neutral-500">
                Lo abbiamo già materialmente.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPreso(!preso)}
              role="switch"
              aria-checked={preso}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                preso ? "bg-green-600" : "bg-neutral-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${
                  preso ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl bg-neutral-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-neutral-900">
                Già disponibile
              </p>
              <p className="text-xs text-neutral-500">
                Non rientra nel totale da comprare (lo abbiamo già).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setGiaDisp(!giaDisp)}
              role="switch"
              aria-checked={giaDisp}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                giaDisp ? "bg-green-600" : "bg-neutral-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${
                  giaDisp ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <Field label="Note">
            <textarea
              name="note"
              rows={2}
              defaultValue={m?.note ?? ""}
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
                {pending ? "Salvataggio…" : isEdit ? "Salva" : "Aggiungi"}
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
