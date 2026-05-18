"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X, Trash2 } from "lucide-react";
import { CATEGORIE_COMPITI } from "@/lib/compiti";
import { Select } from "@/components/ui/Select";
import { DateInput } from "@/components/ui/DateInput";
import { TimeInput } from "@/components/ui/TimeInput";
import {
  aggiornaCompitoR,
  creaCompitoR,
  eliminaCompitoR,
  type CompitoInput,
} from "../actions";

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500";

export type CompitoEdit = {
  id: string;
  titolo: string;
  data: string;
  data_fine: string | null;
  ora: string | null;
  categoria: string | null;
  assegnato_a_id: string | null;
  evento_id: string | null;
  descrizione: string | null;
  fatto: boolean;
};

export type TeamMember = { id: string; nome: string };
export type EventoOption = { id: string; nome: string };

type Mode = { kind: "add" } | { kind: "edit"; compito: CompitoEdit };

type Props = {
  mode: Mode | null;
  team: TeamMember[];
  eventi: EventoOption[];
  onClose: () => void;
};

export function CompitoModal({ mode, team, eventi, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Stato controllato dei campi custom (Select / DateInput / TimeInput)
  const [data, setData] = useState<string>("");
  const [dataFine, setDataFine] = useState<string>("");
  const [ora, setOra] = useState<string>("");
  const [categoria, setCategoria] = useState<string>("");
  const [assegnatoA, setAssegnatoA] = useState<string>("");
  const [eventoId, setEventoId] = useState<string>("");

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (mode) {
      setError(null);
      if (mode.kind === "edit") {
        const c = mode.compito;
        setData(c.data ?? "");
        setDataFine(c.data_fine ?? "");
        setOra(c.ora ? c.ora.slice(0, 5) : "");
        setCategoria(c.categoria ?? "");
        setAssegnatoA(c.assegnato_a_id ?? "");
        setEventoId(c.evento_id ?? "");
      } else {
        setData("");
        setDataFine("");
        setOra("");
        setCategoria("");
        setAssegnatoA("");
        setEventoId("");
      }
      if (!dlg.open) dlg.showModal();
    } else if (dlg.open) {
      dlg.close();
    }
  }, [mode]);

  if (!mode) return null;

  const isEdit = mode.kind === "edit";
  const c: CompitoEdit | null = mode.kind === "edit" ? mode.compito : null;

  const currentMode = mode;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input: CompitoInput = {
      titolo: String(fd.get("titolo") ?? ""),
      data,
      data_fine: dataFine && dataFine.length > 0 ? dataFine : null,
      ora: ora && ora.length > 0 ? ora : null,
      categoria: categoria || null,
      assegnato_a_id: assegnatoA || null,
      evento_id: eventoId || null,
      descrizione: (fd.get("descrizione") as string) || null,
      fatto: fd.get("fatto") === "on",
    };
    startTransition(async () => {
      const res =
        currentMode.kind === "edit"
          ? await aggiornaCompitoR(currentMode.compito.id, input)
          : await creaCompitoR(input);
      if (res.ok) onClose();
      else setError(res.error);
    });
  }

  function handleDelete() {
    if (currentMode.kind !== "edit") return;
    if (!confirm(`Eliminare "${currentMode.compito.titolo}"?`)) return;
    const id = currentMode.compito.id;
    startTransition(async () => {
      const res = await eliminaCompitoR(id);
      if (res.ok) onClose();
      else setError(res.error);
    });
  }

  const categoriaOptions = [
    { value: "", label: "— Nessun team —" },
    ...(c?.categoria &&
    !(CATEGORIE_COMPITI as readonly string[]).includes(c.categoria)
      ? [{ value: c.categoria, label: `${c.categoria} (vecchio)` }]
      : []),
    ...CATEGORIE_COMPITI.map((cat) => ({ value: cat, label: cat })),
  ];

  const teamOptions = [
    { value: "", label: "— Nessuno —" },
    ...team.map((m) => ({ value: m.id, label: m.nome })),
  ];

  const eventiOptions = [
    { value: "", label: "— Nessuno —" },
    ...eventi.map((ev) => ({ value: ev.id, label: ev.nome })),
  ];

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:left-[calc(50%+7.5rem)] m-0 rounded-3xl p-0 backdrop:bg-black/40 w-[calc(100vw-2rem)] max-w-md max-h-[90vh]"
    >
      <div className="bg-white rounded-3xl p-6 max-h-[90vh] overflow-y-auto overflow-x-visible">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-neutral-900">
            {isEdit ? "Modifica impegno" : "Nuovo impegno"}
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
          {isEdit && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="fatto"
                defaultChecked={c?.fatto ?? false}
                className="w-4 h-4 text-amber-600 focus:ring-amber-500 border-neutral-300 rounded"
              />
              <span className="text-sm text-neutral-800 font-medium">
                Fatto
              </span>
            </label>
          )}

          <Field label="Titolo" required>
            <input
              type="text"
              name="titolo"
              required
              defaultValue={c?.titolo ?? ""}
              className={INPUT_CLASS}
            />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Data" required>
              <DateInput
                value={data}
                onChange={setData}
                required
                name="data"
              />
            </Field>
            <Field label="Fine">
              <DateInput
                value={dataFine}
                onChange={setDataFine}
                name="data_fine"
              />
            </Field>
            <Field label="Ora">
              <TimeInput value={ora} onChange={setOra} name="ora" />
            </Field>
          </div>

          <Field label="Team / categoria">
            <Select
              value={categoria}
              onChange={setCategoria}
              options={categoriaOptions}
              name="categoria"
            />
          </Field>

          <Field label="Assegnato a">
            <Select
              value={assegnatoA}
              onChange={setAssegnatoA}
              options={teamOptions}
              name="assegnato_a_id"
            />
          </Field>

          <Field label="Collegato a evento">
            <Select
              value={eventoId}
              onChange={setEventoId}
              options={eventiOptions}
              name="evento_id"
            />
            <p className="text-xs text-neutral-500 mt-1.5">
              Indica se l&apos;impegno è legato a un evento. Se l&apos;evento
              non esiste ancora, ricordati di crearlo prima.
            </p>
          </Field>

          <Field label="Descrizione">
            <textarea
              name="descrizione"
              rows={3}
              defaultValue={c?.descrizione ?? ""}
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
