import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { aggiornaEvento } from "../actions";
import { DeleteEventoButton } from "../_components/DeleteEventoButton";

const STATI = ["In pianificazione", "Concluso"];

const ERROR_MESSAGES: Record<string, string> = {
  nome: "Il nome è obbligatorio.",
  data: "La data di inizio è obbligatoria.",
  stato: "Stato non valido.",
  generic: "Errore nel salvataggio. Riprova.",
};

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500";

type Evento = {
  id: string;
  nome: string;
  data_inizio: string;
  data_fine: string | null;
  location_id: string | null;
  stato: string;
  descrizione: string | null;
};

type Location = { id: string; nome: string; citta: string };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function ModificaEventoPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { error: errorParam, saved } = await searchParams;

  const sb = createServerClient();
  const { data, error } = await sb
    .from("eventi")
    .select(
      "id, nome, data_inizio, data_fine, location_id, stato, descrizione",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();
  const evento = data as Evento;

  const { data: locationsData } = await sb
    .from("locations")
    .select("id, nome, citta")
    .order("nome");
  const locations = (locationsData ?? []) as Location[];

  const errorMessage = errorParam ? ERROR_MESSAGES[errorParam] : null;
  const aggiornaConId = aggiornaEvento.bind(null, id);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-lg font-medium text-neutral-900">
          Modifica info evento
        </h2>
        <Link
          href={`/eventi/${id}`}
          className="text-sm text-neutral-700 hover:text-neutral-900 underline"
        >
          ← Torna alla dashboard
        </Link>
      </div>

      {errorMessage && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">
          {errorMessage}
        </p>
      )}
      {saved && (
        <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded px-3 py-2 mb-4">
          Modifiche salvate.
        </p>
      )}

      <form
        action={aggiornaConId}
        className="space-y-4 bg-white p-6 rounded-lg border border-neutral-200"
      >
        <Field label="Nome evento" required>
          <input
            type="text"
            name="nome"
            required
            defaultValue={evento.nome}
            className={INPUT_CLASS}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Data inizio" required>
            <input
              type="date"
              name="data_inizio"
              required
              defaultValue={evento.data_inizio ?? ""}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Data fine">
            <input
              type="date"
              name="data_fine"
              defaultValue={evento.data_fine ?? ""}
              className={INPUT_CLASS}
            />
          </Field>
        </div>

        <Field label="Stato" required>
          <select
            name="stato"
            required
            defaultValue={evento.stato}
            className={INPUT_CLASS}
          >
            {!STATI.includes(evento.stato) && (
              <option value={evento.stato}>{evento.stato} (vecchio)</option>
            )}
            {STATI.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Location">
          <select
            name="location_id"
            className={INPUT_CLASS}
            defaultValue={evento.location_id ?? ""}
          >
            <option value="">— Nessuna —</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome} ({l.citta})
              </option>
            ))}
          </select>
        </Field>

        <Field label="Descrizione">
          <textarea
            name="descrizione"
            rows={3}
            defaultValue={evento.descrizione ?? ""}
            className={INPUT_CLASS}
          />
        </Field>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-amber-600 text-white font-medium rounded hover:bg-amber-700"
          >
            Salva modifiche
          </button>
          <Link
            href={`/eventi/${id}`}
            className="px-4 py-2 text-neutral-700 hover:text-neutral-900"
          >
            Annulla
          </Link>
        </div>
      </form>

      <section className="mt-10 bg-red-50 border border-red-200 rounded-lg p-5">
        <h3 className="text-base font-medium text-red-900 mb-1">
          Zona pericolosa
        </h3>
        <p className="text-sm text-red-800 mb-3">
          Eliminando l&apos;evento si perdono in modo definitivo artisti,
          programma, personale, budget, materiali e sponsor collegati.
        </p>
        <DeleteEventoButton id={id} nome={evento.nome} />
      </section>
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
        {label} {required && <span className="text-red-700">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
