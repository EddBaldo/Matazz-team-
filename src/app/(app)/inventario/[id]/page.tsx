import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { aggiornaInventario } from "./actions";
import { DeleteInventarioButton } from "./_components/DeleteInventarioButton";

const CONDIZIONI = ["Ottimo", "Buono", "Da riparare", "Da buttare"];

const ERROR_MESSAGES: Record<string, string> = {
  articolo: "Il nome dell'articolo è obbligatorio.",
  condizione: "La condizione è obbligatoria.",
  generic: "Errore nel salvataggio. Riprova.",
  delete: "Errore nell'eliminazione. Riprova.",
};

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500";

type Inventario = {
  id: string;
  articolo: string;
  quantita: number;
  dove_si_trova: string | null;
  condizione: string;
  note: string | null;
  creato_da: { nome: string } | null;
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function InventarioDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { error: errorParam, saved } = await searchParams;

  const sb = createServerClient();
  const { data } = await sb
    .from("inventario")
    .select(
      `id, articolo, quantita, dove_si_trova, condizione, note,
       creato_da:team_matazz(nome)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const i = data as unknown as Inventario;

  const errorMessage = errorParam ? ERROR_MESSAGES[errorParam] : null;
  const aggiornaConId = aggiornaInventario.bind(null, id);

  return (
    <div className="max-w-2xl">
      <Link
        href="/inventario"
        className="text-sm text-neutral-700 hover:text-neutral-900 underline"
      >
        ← Torna all&apos;inventario
      </Link>

      <div className="flex items-start justify-between mt-2 gap-3 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-medium text-neutral-900">
            {i.articolo}
          </h1>
          <p className="text-sm text-neutral-700 mt-1">
            Aggiunto da {i.creato_da?.nome ?? "—"}
          </p>
        </div>
        <DeleteInventarioButton id={id} />
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
        <Field label="Articolo" required>
          <input
            type="text"
            name="articolo"
            required
            defaultValue={i.articolo}
            className={INPUT_CLASS}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Quantità">
            <input
              type="number"
              step="1"
              min="0"
              name="quantita"
              defaultValue={i.quantita}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Condizione" required>
            <select
              name="condizione"
              required
              defaultValue={i.condizione}
              className={INPUT_CLASS}
            >
              {!CONDIZIONI.includes(i.condizione) && (
                <option value={i.condizione}>{i.condizione} (vecchio)</option>
              )}
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
            defaultValue={i.dove_si_trova ?? ""}
            className={INPUT_CLASS}
          />
        </Field>

        <Field label="Note">
          <textarea
            name="note"
            rows={3}
            defaultValue={i.note ?? ""}
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
