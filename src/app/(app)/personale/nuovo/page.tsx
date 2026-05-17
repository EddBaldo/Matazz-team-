import Link from "next/link";
import { CATEGORIE_PERSONALE } from "@/lib/personale";
import { creaPersonale } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  nome: "Nome e cognome sono obbligatori.",
  ruolo: "Il ruolo principale è obbligatorio.",
  categoria: "Seleziona una categoria.",
  generic: "Errore nel salvataggio. Riprova.",
};

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NuovoPersonalePage({ searchParams }: Props) {
  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : null;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-2xl font-medium text-neutral-900">
          Nuova persona
        </h1>
        <Link
          href="/personale"
          className="text-sm text-neutral-700 hover:text-neutral-900 underline"
        >
          ← Torna alla lista
        </Link>
      </div>

      <form
        action={creaPersonale}
        className="space-y-4 bg-white p-6 rounded-lg border border-neutral-200"
      >
        {errorMessage && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {errorMessage}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome" required>
            <input type="text" name="nome" required className={INPUT_CLASS} />
          </Field>
          <Field label="Cognome" required>
            <input
              type="text"
              name="cognome"
              required
              className={INPUT_CLASS}
            />
          </Field>
        </div>

        <Field label="Categoria" required>
          <select
            name="categoria"
            required
            className={INPUT_CLASS}
            defaultValue=""
          >
            <option value="" disabled>
              — Seleziona —
            </option>
            {CATEGORIE_PERSONALE.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Ruolo principale" required>
          <input
            type="text"
            name="ruolo_principale"
            required
            className={INPUT_CLASS}
            placeholder="Es. Fotografo eventi, Tecnico FOH, Bar manager…"
          />
        </Field>

        <Field label="Contatti">
          <input
            type="text"
            name="contatti"
            className={INPUT_CLASS}
            placeholder="Telefono, email, Instagram…"
          />
        </Field>

        <Field label="Tariffa tipica (CHF)">
          <input
            type="number"
            step="0.01"
            min="0"
            name="tariffa_tipica"
            className={INPUT_CLASS}
          />
        </Field>

        <Field label="Note">
          <textarea name="note" rows={3} className={INPUT_CLASS} />
        </Field>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-amber-600 text-white font-medium rounded hover:bg-amber-700"
          >
            Crea
          </button>
          <Link
            href="/personale"
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
