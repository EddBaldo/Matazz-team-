import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { STATI_LOCATION } from "@/lib/locations";
import { aggiornaLocation } from "./actions";
import { DeleteLocationButton } from "./_components/DeleteLocationButton";

const ERROR_MESSAGES: Record<string, string> = {
  nome: "Il nome è obbligatorio.",
  citta: "La città è obbligatoria.",
  generic: "Errore nel salvataggio. Riprova.",
  delete:
    "Errore nell'eliminazione. La location potrebbe essere usata da eventi attivi.",
};

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500";

type Location = {
  id: string;
  nome: string;
  citta: string;
  stato: string | null;
  indirizzo: string | null;
  capienza: number | null;
  contatti_referente: string | null;
  costo_tipico: number | null;
  link: string | null;
  note: string | null;
  creato_da: { nome: string } | null;
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function LocationDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { error: errorParam, saved } = await searchParams;

  const sb = createServerClient();
  const { data } = await sb
    .from("locations")
    .select(
      `id, nome, citta, stato, indirizzo, capienza, contatti_referente, costo_tipico, link, note,
       creato_da:team_matazz(nome)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const loc = data as unknown as Location;

  const errorMessage = errorParam ? ERROR_MESSAGES[errorParam] : null;
  const aggiornaConId = aggiornaLocation.bind(null, id);

  return (
    <div className="max-w-2xl">
      <Link
        href="/locations"
        className="text-sm text-neutral-700 hover:text-neutral-900 underline"
      >
        ← Torna alla lista
      </Link>

      <div className="flex items-start justify-between mt-2 gap-3 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-medium text-neutral-900">{loc.nome}</h1>
          <p className="text-sm text-neutral-700 mt-1">
            Proposto da {loc.creato_da?.nome ?? "—"}
          </p>
        </div>
        <DeleteLocationButton id={id} />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome" required>
            <input
              type="text"
              name="nome"
              required
              defaultValue={loc.nome}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Città" required>
            <input
              type="text"
              name="citta"
              required
              defaultValue={loc.citta}
              className={INPUT_CLASS}
            />
          </Field>
        </div>

        <Field label="Stato" required>
          <select
            name="stato"
            required
            defaultValue={loc.stato ?? "Svizzera"}
            className={INPUT_CLASS}
          >
            {loc.stato &&
              !(STATI_LOCATION as readonly string[]).includes(loc.stato) && (
                <option value={loc.stato}>{loc.stato}</option>
              )}
            {STATI_LOCATION.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Indirizzo">
          <input
            type="text"
            name="indirizzo"
            defaultValue={loc.indirizzo ?? ""}
            className={INPUT_CLASS}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Capienza">
            <input
              type="number"
              step="1"
              min="0"
              name="capienza"
              defaultValue={loc.capienza ?? ""}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Costo (CHF)">
            <input
              type="number"
              step="0.01"
              min="0"
              name="costo_tipico"
              defaultValue={loc.costo_tipico ?? ""}
              className={INPUT_CLASS}
            />
          </Field>
        </div>

        <Field label="Contatti referente">
          <input
            type="text"
            name="contatti_referente"
            defaultValue={loc.contatti_referente ?? ""}
            className={INPUT_CLASS}
          />
        </Field>

        <Field label="Link (sito o Google Maps)">
          <input
            type="text"
            name="link"
            defaultValue={loc.link ?? ""}
            className={INPUT_CLASS}
            placeholder="https://…"
          />
        </Field>

        <Field label="Note">
          <textarea
            name="note"
            rows={3}
            defaultValue={loc.note ?? ""}
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
            href="/locations"
            className="px-4 py-2 text-neutral-700 hover:text-neutral-900"
          >
            Annulla
          </Link>
        </div>
      </form>
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
