import Link from "next/link";
import { creaInventario } from "./actions";

const CONDIZIONI = ["Ottimo", "Buono", "Da riparare", "Da buttare"];

const ERROR_MESSAGES: Record<string, string> = {
  articolo: "Il nome dell'articolo è obbligatorio.",
  condizione: "La condizione è obbligatoria.",
  generic: "Errore nel salvataggio. Riprova.",
};

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NuovoInventarioPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : null;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-2xl font-medium text-neutral-900">
          Nuovo articolo
        </h1>
        <Link
          href="/inventario"
          className="text-sm text-neutral-700 hover:text-neutral-900 underline"
        >
          ← Torna all&apos;inventario
        </Link>
      </div>

      <form
        action={creaInventario}
        className="space-y-4 bg-white p-6 rounded-lg border border-neutral-200"
      >
        {errorMessage && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {errorMessage}
          </p>
        )}

        <Field label="Articolo" required>
          <input type="text" name="articolo" required className={INPUT_CLASS} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Quantità">
            <input
              type="number"
              step="1"
              min="0"
              name="quantita"
              defaultValue={1}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Condizione" required>
            <select
              name="condizione"
              required
              defaultValue="Buono"
              className={INPUT_CLASS}
            >
              {CONDIZIONI.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Dove si trova">
          <input
            type="text"
            name="dove_si_trova"
            className={INPUT_CLASS}
            placeholder="Es. Magazzino Lugano, casa Pie…"
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
            Aggiungi
          </button>
          <Link
            href="/inventario"
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
