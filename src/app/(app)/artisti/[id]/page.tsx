import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { TIPI_ARTE } from "@/lib/artisti";
import { aggiornaArtista } from "./actions";
import { DeleteArtistaButton } from "./_components/DeleteArtistaButton";
import { InteresseEventiSection } from "./_components/InteresseEventiSection";

const ERROR_MESSAGES: Record<string, string> = {
  nome: "Il nome è obbligatorio.",
  tipo: "Tipo arte obbligatorio.",
  generic: "Errore nel salvataggio. Riprova.",
  delete: "Errore nell'eliminazione. Riprova.",
  in_uso:
    "Non puoi eliminare questo artista: è ancora collegato a uno o più eventi. Rimuovilo dagli eventi prima.",
  interesse: "Errore sulla gestione degli eventi di interesse. Riprova.",
};

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500";

type Artista = {
  id: string;
  nome: string;
  cognome: string;
  tipo_arte: string;
  residenza: string | null;
  link: string | null;
  link_opera: string | null;
  membri_extra: string | null;
  numero_persone: number;
  creato_da: { nome: string } | null;
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function ArtistaDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { error: errorParam, saved } = await searchParams;

  const sb = createServerClient();
  const { data } = await sb
    .from("artisti")
    .select(
      `id, nome, cognome, tipo_arte, residenza, link, link_opera,
       membri_extra, numero_persone,
       creato_da:team_matazz(nome)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const a = data as unknown as Artista;

  const errorMessage = errorParam ? ERROR_MESSAGES[errorParam] : null;
  const aggiornaConId = aggiornaArtista.bind(null, id);

  return (
    <div className="max-w-2xl">
      <Link
        href="/artisti"
        className="text-sm text-neutral-700 hover:text-neutral-900 underline"
      >
        ← Torna alla lista
      </Link>

      <div className="flex items-start justify-between mt-2 gap-3 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-medium text-neutral-900">
            {[a.nome, a.cognome].filter((x) => x && x.trim()).join(" ")}
          </h1>
          <p className="text-sm text-neutral-700 mt-1">
            Proposto da {a.creato_da?.nome ?? "—"}
          </p>
        </div>
        <DeleteArtistaButton id={id} />
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
              defaultValue={a.nome}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Cognome (vuoto per collettivi)">
            <input
              type="text"
              name="cognome"
              defaultValue={a.cognome}
              className={INPUT_CLASS}
              placeholder="Lascia vuoto se è un collettivo"
            />
          </Field>
        </div>

        <Field label="Tipo arte" required>
          <select
            name="tipo_arte"
            required
            defaultValue={a.tipo_arte}
            className={INPUT_CLASS}
          >
            {!(TIPI_ARTE as readonly string[]).includes(a.tipo_arte) && (
              <option value={a.tipo_arte}>{a.tipo_arte} (vecchio)</option>
            )}
            {TIPI_ARTE.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Residenza">
          <input
            type="text"
            name="residenza"
            defaultValue={a.residenza ?? ""}
            className={INPUT_CLASS}
            placeholder="Es. Lugano, Berlino…"
          />
        </Field>

        <Field label="Link (sito o Instagram)">
          <input
            type="text"
            name="link"
            defaultValue={a.link ?? ""}
            className={INPUT_CLASS}
            placeholder="https://…"
          />
        </Field>

        <Field label="Link opera di riferimento">
          <input
            type="text"
            name="link_opera"
            defaultValue={a.link_opera ?? ""}
            className={INPUT_CLASS}
            placeholder="https://… (video, articolo, pdf)"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
          <Field label="Altri membri (per duo / collettivi)">
            <input
              type="text"
              name="membri_extra"
              defaultValue={a.membri_extra ?? ""}
              className={INPUT_CLASS}
              placeholder="Es. Andrea Sassi"
            />
          </Field>
          <Field label="N. persone">
            <input
              type="number"
              name="numero_persone"
              min="1"
              step="1"
              defaultValue={a.numero_persone ?? 1}
              className={`${INPUT_CLASS} w-24`}
            />
          </Field>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-amber-600 text-white font-medium rounded hover:bg-amber-700"
          >
            Salva modifiche
          </button>
          <Link
            href="/artisti"
            className="px-4 py-2 text-neutral-700 hover:text-neutral-900"
          >
            Annulla
          </Link>
        </div>
      </form>

      <InteresseEventiSection artistaId={id} />
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
