import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { CATEGORIE_PERSONALE } from "@/lib/personale";
import { aggiornaPersonale } from "./actions";
import { DeletePersonaleButton } from "./_components/DeletePersonaleButton";

const ERROR_MESSAGES: Record<string, string> = {
  nome: "Nome e cognome sono obbligatori.",
  ruolo: "Il ruolo principale è obbligatorio.",
  categoria: "Seleziona una categoria.",
  generic: "Errore nel salvataggio. Riprova.",
  delete: "Errore nell'eliminazione. Riprova.",
  in_uso:
    "Non puoi eliminare questa persona: è ancora collegata a uno o più eventi. Rimuovila dagli eventi prima.",
};

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500";

type Persona = {
  id: string;
  nome: string;
  cognome: string;
  ruolo_principale: string;
  categoria: string | null;
  contatti: string | null;
  tariffa_tipica: number | null;
  note: string | null;
  creato_da: { nome: string } | null;
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function PersonaleDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { error: errorParam, saved } = await searchParams;

  const sb = createServerClient();
  const { data } = await sb
    .from("personale_esterno")
    .select(
      `id, nome, cognome, ruolo_principale, categoria, contatti, tariffa_tipica, note,
       creato_da:team_matazz(nome)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const p = data as unknown as Persona;

  const errorMessage = errorParam ? ERROR_MESSAGES[errorParam] : null;
  const aggiornaConId = aggiornaPersonale.bind(null, id);

  return (
    <div className="max-w-2xl">
      <Link
        href="/personale"
        className="text-sm text-neutral-700 hover:text-neutral-900 underline"
      >
        ← Torna alla lista
      </Link>

      <div className="flex items-start justify-between mt-2 gap-3 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-medium text-neutral-900">
            {p.nome} {p.cognome}
          </h1>
          <p className="text-sm text-neutral-700 mt-1">
            Proposto da {p.creato_da?.nome ?? "—"}
          </p>
        </div>
        <DeletePersonaleButton id={id} />
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
              defaultValue={p.nome}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Cognome" required>
            <input
              type="text"
              name="cognome"
              required
              defaultValue={p.cognome}
              className={INPUT_CLASS}
            />
          </Field>
        </div>

        <Field label="Categoria" required>
          <select
            name="categoria"
            required
            defaultValue={p.categoria ?? ""}
            className={INPUT_CLASS}
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
            defaultValue={p.ruolo_principale}
            className={INPUT_CLASS}
          />
        </Field>

        <Field label="Contatti">
          <input
            type="text"
            name="contatti"
            defaultValue={p.contatti ?? ""}
            className={INPUT_CLASS}
          />
        </Field>

        <Field label="Tariffa tipica (CHF)">
          <input
            type="number"
            step="0.01"
            min="0"
            name="tariffa_tipica"
            defaultValue={p.tariffa_tipica ?? ""}
            className={INPUT_CLASS}
          />
        </Field>

        <Field label="Note">
          <textarea
            name="note"
            rows={3}
            defaultValue={p.note ?? ""}
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
