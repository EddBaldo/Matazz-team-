"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Trash2 } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { DateInput } from "@/components/ui/DateInput";
import {
  aggiornaEventoR,
  creaEventoR,
  eliminaEventoR,
  type EventoInput,
} from "../actions";

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500";

const STATI = ["In pianificazione", "Concluso"];

export type LocationOption = { id: string; nome: string; citta: string };

export type EventoEdit = {
  id: string;
  nome: string;
  data_inizio: string;
  data_fine: string | null;
  location_id: string | null;
  stato: string;
  descrizione: string | null;
};

type Mode = { kind: "add" } | { kind: "edit"; evento: EventoEdit };

type Props = {
  mode: Mode | null;
  locations: LocationOption[];
  onClose: () => void;
};

export function EventoModal({ mode, locations, onClose }: Props) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [statoSelected, setStatoSelected] = useState<string>(
    "In pianificazione",
  );
  const [dataInizio, setDataInizio] = useState<string>("");
  const [dataFine, setDataFine] = useState<string>("");
  const [locationId, setLocationId] = useState<string>("");

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (mode) {
      setError(null);
      if (mode.kind === "edit") {
        const ev = mode.evento;
        setStatoSelected(ev.stato);
        setDataInizio(ev.data_inizio ?? "");
        setDataFine(ev.data_fine ?? "");
        setLocationId(ev.location_id ?? "");
      } else {
        setStatoSelected("In pianificazione");
        setDataInizio("");
        setDataFine("");
        setLocationId("");
      }
      if (!dlg.open) dlg.showModal();
    } else if (dlg.open) {
      dlg.close();
    }
  }, [mode]);

  if (!mode) return null;

  const isEdit = mode.kind === "edit";
  const e: EventoEdit | null = mode.kind === "edit" ? mode.evento : null;
  const currentMode = mode;

  // Banner di avviso quando si cambia stato in edit
  const prevStato = e?.stato ?? null;
  const transizioneAConcluso =
    isEdit && prevStato !== "Concluso" && statoSelected === "Concluso";
  const transizioneARiapertura =
    isEdit && prevStato === "Concluso" && statoSelected !== "Concluso";

  function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    const input: EventoInput = {
      nome: String(fd.get("nome") ?? ""),
      data_inizio: dataInizio,
      data_fine: dataFine || null,
      location_id: locationId || null,
      stato: statoSelected,
      descrizione: (fd.get("descrizione") as string) || null,
    };

    // Conferma esplicita per transizioni di stato che toccano il conto
    if (transizioneAConcluso) {
      if (
        !confirm(
          `Concludere "${input.nome}"?\n\nVerrà aggiunto automaticamente al Conto Matazz un movimento col saldo finale dell'evento (entrate − uscite).`,
        )
      )
        return;
    }
    if (transizioneARiapertura) {
      if (
        !confirm(
          `Riaprire "${input.nome}"?\n\nIl movimento del conto generato alla conclusione verrà eliminato (il conto torna come prima).`,
        )
      )
        return;
    }

    startTransition(async () => {
      if (currentMode.kind === "edit") {
        const res = await aggiornaEventoR(currentMode.evento.id, input);
        if (res.ok) onClose();
        else setError(res.error);
      } else {
        const res = await creaEventoR(input);
        if (res.ok) {
          onClose();
          router.push(`/eventi/${res.id}`);
        } else {
          setError(res.error);
        }
      }
    });
  }

  function handleDelete() {
    if (currentMode.kind !== "edit") return;
    if (
      !confirm(
        `Eliminare l'evento "${currentMode.evento.nome}"?\n\nQuesta operazione non è reversibile.`,
      )
    )
      return;
    const id = currentMode.evento.id;
    startTransition(async () => {
      const res = await eliminaEventoR(id);
      if (res.ok) {
        onClose();
        router.push("/eventi");
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:left-[calc(50%+7.5rem)] m-0 rounded-3xl p-0 backdrop:bg-black/40 w-[calc(100vw-2rem)] max-w-sm max-h-[90vh]"
    >
      <div className="bg-white rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-neutral-900">
            {isEdit ? "Modifica evento" : "Nuovo evento"}
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
          <Field label="Nome evento" required>
            <input
              type="text"
              name="nome"
              required
              defaultValue={e?.nome ?? ""}
              className={INPUT_CLASS}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Data inizio" required>
              <DateInput
                value={dataInizio}
                onChange={setDataInizio}
                required
              />
            </Field>
            <Field label="Data fine">
              <DateInput value={dataFine} onChange={setDataFine} />
            </Field>
          </div>

          <Field label="Stato" required>
            <Select
              value={statoSelected}
              onChange={setStatoSelected}
              options={STATI.map((s) => ({ value: s, label: s }))}
              required
            />
          </Field>

          {transizioneAConcluso && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
              Salvando, l&apos;evento verrà <strong>concluso</strong> e nel
              Conto Matazz comparirà automaticamente il saldo finale (entrate
              − uscite). Confermerai al click su Salva.
            </div>
          )}

          {transizioneARiapertura && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
              Salvando, l&apos;evento verrà <strong>riaperto</strong>: il
              movimento creato nel conto alla conclusione verrà eliminato.
            </div>
          )}

          <Field label="Location">
            <Select
              value={locationId}
              onChange={setLocationId}
              options={[
                { value: "", label: "— Nessuna —" },
                ...locations.map((l) => ({
                  value: l.id,
                  label: `${l.nome} (${l.citta})`,
                })),
              ]}
            />
          </Field>

          <Field label="Descrizione">
            <textarea
              name="descrizione"
              rows={3}
              defaultValue={e?.descrizione ?? ""}
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
                {pending
                  ? "Salvataggio…"
                  : isEdit
                    ? "Salva"
                    : "Crea evento"}
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
