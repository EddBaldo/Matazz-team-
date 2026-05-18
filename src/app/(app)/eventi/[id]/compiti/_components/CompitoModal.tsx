"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X, Trash2, Plus } from "lucide-react";
import { CATEGORIE_COMPITI } from "@/lib/compiti";
import { Select } from "@/components/ui/Select";
import { DateInput } from "@/components/ui/DateInput";
import { TimeInput } from "@/components/ui/TimeInput";
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
  const [data, setData] = useState<string>("");
  const [dataFine, setDataFine] = useState<string>("");
  const [ora, setOra] = useState<string>("");
  const [oraFine, setOraFine] = useState<string>("");
  const [categoria, setCategoria] = useState<string>("");
  const [assegnatoAId, setAssegnatoAId] = useState<string>("");

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
        const c = mode.compito;
        setTipo(c.tipo);
        setTurni(c.turni.length > 0 ? c.turni : []);
        setData(c.data ?? "");
        setDataFine(c.data_fine ?? "");
        setOra(c.ora ? c.ora.slice(0, 5) : "");
        setOraFine(c.ora_fine ? c.ora_fine.slice(0, 5) : "");
        setCategoria(c.categoria ?? "");
        setAssegnatoAId(c.assegnato_a_id ?? "");
      } else {
        setTipo("singolo");
        setTurni([]);
        setData(mode.defaultDate);
        setDataFine("");
        setOra("");
        setOraFine("");
        setCategoria("");
        setAssegnatoAId("");
      }
      if (!dlg.open) dlg.showModal();
    } else if (dlg.open) {
      dlg.close();
    }
  }, [mode]);

  if (!mode) return null;

  const isEdit = mode.kind === "edit";
  const c = mode.kind === "edit" ? mode.compito : null;
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
      data,
      data_fine: showFine ? dataFine || null : null,
      tipo,
      ora: tipo === "singolo" ? ora || null : null,
      ora_fine: tipo === "singolo" && showOraFine ? oraFine || null : null,
      categoria: categoria || null,
      assegnato_a_id: tipo === "singolo" ? assegnatoAId || null : null,
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
            <DateInput value={data} onChange={setData} required />
          </Field>

          {tipo === "singolo" && (
            <div className="grid grid-cols-2 gap-3 items-end">
              <Field label="Ora inizio">
                <TimeInput value={ora} onChange={setOra} />
              </Field>
              {showOraFine ? (
                <div className="flex items-end gap-1">
                  <div className="flex-1">
                    <Field label="Ora fine">
                      <TimeInput value={oraFine} onChange={setOraFine} />
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
                  <DateInput value={dataFine} onChange={setDataFine} />
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
              <Select
                value={categoria}
                onChange={setCategoria}
                options={[
                  { value: "", label: "— Nessuna —" },
                  ...CATEGORIE_COMPITI.map((cat) => ({
                    value: cat,
                    label: cat,
                  })),
                ]}
              />
            </Field>
            {tipo === "singolo" && (
              <Field label="Assegnato a">
                <Select
                  value={assegnatoAId}
                  onChange={setAssegnatoAId}
                  options={[
                    { value: "", label: "— Nessuno —" },
                    ...team.map((m) => ({ value: m.id, label: m.nome })),
                  ]}
                />
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
                          <Select
                            value={t.personale_id ?? ""}
                            onChange={(v) =>
                              updateTurno(i, {
                                personale_id: v || null,
                                nome_libero: v ? null : t.nome_libero,
                              })
                            }
                            options={[
                              { value: "", label: "— Dalla rubrica —" },
                              ...personale.map((p) => ({
                                value: p.id,
                                label: `${p.nome} ${p.cognome}${p.categoria ? ` · ${p.categoria}` : ""}`,
                              })),
                            ]}
                          />
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
                            <TimeInput
                              value={t.ora_inizio ? t.ora_inizio.slice(0, 5) : ""}
                              onChange={(v) =>
                                updateTurno(i, { ora_inizio: v || null })
                              }
                            />
                            <TimeInput
                              value={t.ora_fine ? t.ora_fine.slice(0, 5) : ""}
                              onChange={(v) =>
                                updateTurno(i, { ora_fine: v || null })
                              }
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
