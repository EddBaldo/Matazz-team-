"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X, Trash2, Plus } from "lucide-react";
import { CATEGORIE_COMPITI } from "@/lib/compiti";
import {
  aggiornaCompitoR,
  creaCompitoR,
  eliminaCompitoR,
  type CompitoInput,
  type TurnoInput,
} from "../actions";

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500";

export type CompitoEdit = {
  id: string;
  titolo: string;
  data: string;
  data_fine: string | null;
  tipo: "singolo" | "turni";
  ora: string | null;
  ora_fine: string | null;
  categoria: string | null;
  assegnato_a_id: string | null;
  descrizione: string | null;
  turni: TurnoEdit[];
};

export type TurnoEdit = {
  id?: string;
  personale_id: string | null;
  personaleLabel?: string | null;
  nome_libero: string | null;
  ora_inizio: string | null;
  ora_fine: string | null;
  note: string | null;
};

export type TeamMember = { id: string; nome: string };
export type PersonaleRubrica = {
  id: string;
  nome: string;
  cognome: string;
  categoria: string | null;
};

type Mode =
  | { kind: "add"; defaultDate: string }
  | { kind: "edit"; compito: CompitoEdit };

type Props = {
  eventoId: string;
  team: TeamMember[];
  personale: PersonaleRubrica[];
  mode: Mode | null;
  onClose: () => void;
};

const EMPTY_TURNO: TurnoEdit = {
  personale_id: null,
  nome_libero: null,
  ora_inizio: null,
  ora_fine: null,
  note: null,
};

export function CompitoModal({
  eventoId,
  team,
  personale,
  mode,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [showFine, setShowFine] = useState<boolean>(false);
  const [showOraFine, setShowOraFine] = useState<boolean>(false);
  const [tipo, setTipo] = useState<"singolo" | "turni">("singolo");
  const [turni, setTurni] = useState<TurnoEdit[]>([]);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (mode) {
      setError(null);
      setShowFine(
        mode.kind === "edit" && (mode.compito.data_fine?.length ?? 0) > 0,
      );
      setShowOraFine(
        mode.kind === "edit" && (mode.compito.ora_fine?.length ?? 0) > 0,
      );
      if (mode.kind === "edit") {
        setTipo(mode.compito.tipo);
        setTurni(mode.compito.turni.length > 0 ? mode.compito.turni : []);
      } else {
        setTipo("singolo");
        setTurni([]);
      }
      if (!dlg.open) dlg.showModal();
    } else if (dlg.open) {
      dlg.close();
    }
  }, [mode]);

  if (!mode) return null;

  const isEdit = mode.kind === "edit";
  const c = mode.kind === "edit" ? mode.compito : null;
  const dataDefault =
    mode.kind === "edit" ? mode.compito.data : mode.defaultDate;
  const currentMode = mode;

  function updateTurno(i: number, patch: Partial<TurnoEdit>) {
    setTurni((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  }
  function addTurno() {
    setTurni((prev) => [...prev, { ...EMPTY_TURNO }]);
  }
  function removeTurno(i: number) {
    setTurni((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input: CompitoInput = {
      titolo: String(fd.get("titolo") ?? ""),
      data: String(fd.get("data") ?? ""),
      data_fine: showFine ? (fd.get("data_fine") as string) || null : null,
      tipo,
      ora: tipo === "singolo" ? (fd.get("ora") as string) || null : null,
      ora_fine:
        tipo === "singolo" && showOraFine
          ? (fd.get("ora_fine") as string) || null
          : null,
      categoria: (fd.get("categoria") as string) || null,
      assegnato_a_id:
        tipo === "singolo"
          ? (fd.get("assegnato_a_id") as string) || null
          : null,
      descrizione: (fd.get("descrizione") as string) || null,
      turni: tipo === "turni" ? turni.map((t) => ({ ...t })) : [],
    };
    startTransition(async () => {
      const res =
        currentMode.kind === "edit"
          ? await aggiornaCompitoR(eventoId, currentMode.compito.id, input)
          : await creaCompitoR(eventoId, input);
      if (res.ok) onClose();
      else setError(res.error);
    });
  }

  function handleDelete() {
    if (currentMode.kind !== "edit") return;
    if (!confirm(`Eliminare "${currentMode.compito.titolo}"?`)) return;
    const id = currentMode.compito.id;
    startTransition(async () => {
      const res = await eliminaCompitoR(eventoId, id);
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
            {isEdit ? "Modifica voce" : "Nuova voce"}
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
          <div>
            <span className="text-sm font-medium text-neutral-800">Tipo</span>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setTipo("singolo")}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  tipo === "singolo"
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                Singolo
              </button>
              <button
                type="button"
                onClick={() => setTipo("turni")}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  tipo === "turni"
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                Turni
              </button>
            </div>
            <p className="text-xs text-neutral-500 mt-1.5">
              {tipo === "singolo"
                ? "Un impegno, una persona, un orario."
                : "Una giornata di lavoro con più persone su orari diversi (es. turni bar)."}
            </p>
          </div>

          <Field label="Titolo" required>
            <input
              type="text"
              name="titolo"
              required
              defaultValue={c?.titolo ?? ""}
              className={INPUT_CLASS}
              placeholder={
                tipo === "singolo"
                  ? "Es. Stampare locandine, allestire palco…"
                  : "Es. Turni bar, Squadra allestimento…"
              }
            />
          </Field>

          <Field label="Data" required>
            <input
              type="date"
              name="data"
              required
              defaultValue={dataDefault}
              className={INPUT_CLASS}
            />
          </Field>

          {tipo === "singolo" && (
            <div className="grid grid-cols-2 gap-3 items-end">
              <Field label="Ora inizio">
                <input
                  type="time"
                  name="ora"
                  defaultValue={c?.ora ?? ""}
                  className={INPUT_CLASS}
                />
              </Field>
              {showOraFine ? (
                <div className="flex items-end gap-1">
                  <div className="flex-1">
                    <Field label="Ora fine">
                      <input
                        type="time"
                        name="ora_fine"
                        defaultValue={c?.ora_fine ?? ""}
                        className={INPUT_CLASS}
                      />
                    </Field>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowOraFine(false)}
                    aria-label="Rimuovi ora fine"
                    className="mb-1.5 inline-flex items-center justify-center w-9 h-9 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowOraFine(true)}
                  className="mb-0.5 inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900"
                >
                  + Ora fine
                </button>
              )}
            </div>
          )}

          {showFine ? (
            <div className="flex items-end gap-1">
              <div className="flex-1">
                <Field label="Data fine (range)">
                  <input
                    type="date"
                    name="data_fine"
                    defaultValue={c?.data_fine ?? ""}
                    className={INPUT_CLASS}
                  />
                </Field>
              </div>
              <button
                type="button"
                onClick={() => setShowFine(false)}
                aria-label="Rimuovi data fine"
                className="mb-1.5 inline-flex items-center justify-center w-9 h-9 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowFine(true)}
              className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900"
            >
              + Aggiungi data fine (più giorni)
            </button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria">
              <select
                name="categoria"
                defaultValue={c?.categoria ?? ""}
                className={INPUT_CLASS}
              >
                <option value="">— Nessuna —</option>
                {CATEGORIE_COMPITI.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </Field>
            {tipo === "singolo" && (
              <Field label="Assegnato a">
                <select
                  name="assegnato_a_id"
                  defaultValue={c?.assegnato_a_id ?? ""}
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
            )}
          </div>

          {tipo === "turni" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-800">
                  Turni
                </span>
                <button
                  type="button"
                  onClick={addTurno}
                  className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900"
                >
                  <Plus className="w-4 h-4" />
                  Aggiungi turno
                </button>
              </div>

              {turni.length === 0 ? (
                <p className="text-xs text-neutral-500">
                  Nessun turno. Clicca &quot;Aggiungi turno&quot; per
                  inserirne uno.
                </p>
              ) : (
                <ul className="space-y-2">
                  {turni.map((t, i) => (
                    <li
                      key={i}
                      className="rounded-2xl border border-neutral-200 p-3 space-y-2"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-2">
                          <select
                            value={t.personale_id ?? ""}
                            onChange={(e) =>
                              updateTurno(i, {
                                personale_id: e.target.value || null,
                                nome_libero: e.target.value
                                  ? null
                                  : t.nome_libero,
                              })
                            }
                            className={INPUT_CLASS}
                          >
                            <option value="">— Dalla rubrica —</option>
                            {personale.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.nome} {p.cognome}
                                {p.categoria ? ` · ${p.categoria}` : ""}
                              </option>
                            ))}
                          </select>
                          {!t.personale_id && (
                            <input
                              type="text"
                              value={t.nome_libero ?? ""}
                              onChange={(e) =>
                                updateTurno(i, {
                                  nome_libero: e.target.value || null,
                                })
                              }
                              placeholder="Oppure scrivi un nome libero…"
                              className={INPUT_CLASS}
                            />
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="time"
                              value={t.ora_inizio ?? ""}
                              onChange={(e) =>
                                updateTurno(i, {
                                  ora_inizio: e.target.value || null,
                                })
                              }
                              className={INPUT_CLASS}
                            />
                            <input
                              type="time"
                              value={t.ora_fine ?? ""}
                              onChange={(e) =>
                                updateTurno(i, {
                                  ora_fine: e.target.value || null,
                                })
                              }
                              className={INPUT_CLASS}
                            />
                          </div>
                          <input
                            type="text"
                            value={t.note ?? ""}
                            onChange={(e) =>
                              updateTurno(i, {
                                note: e.target.value || null,
                              })
                            }
                            placeholder="Note (opzionale)"
                            className={INPUT_CLASS}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTurno(i)}
                          aria-label="Rimuovi turno"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full text-neutral-500 hover:bg-red-50 hover:text-red-700 shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <Field label="Descrizione">
            <textarea
              name="descrizione"
              rows={2}
              defaultValue={c?.descrizione ?? ""}
              className={INPUT_CLASS}
              placeholder="Dettagli aggiuntivi (opzionale)…"
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
