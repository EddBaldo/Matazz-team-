import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { CATEGORIE_COMPITI } from "@/lib/compiti";
import { aggiornaCompito } from "./actions";
import { DeleteCompitoButton } from "../_components/DeleteCompitoButton";

const ERROR_MESSAGES: Record<string, string> = {
  titolo: "Il titolo è obbligatorio.",
  data: "La data è obbligatoria.",
  categoria: "La categoria è obbligatoria.",
  generic: "Errore nel salvataggio. Riprova.",
  delete: "Errore nell'eliminazione. Riprova.",
};

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500";

type Compito = {
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

type TeamMember = { id: string; nome: string };
type EventoOption = { id: string; nome: string };

type Props = {
  params: Promise<{ compId: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function ModificaCompitoPage({
  params,
  searchParams,
}: Props) {
  const { compId } = await params;
  const { error: errorParam, saved } = await searchParams;

  const sb = createServerClient();
  const { data } = await sb
    .from("compiti")
    .select(
      "id, titolo, data, data_fine, ora, categoria, assegnato_a_id, evento_id, descrizione, fatto",
    )
    .eq("id", compId)
    .maybeSingle();

  if (!data) notFound();
  const c = data as Compito;

  const [teamRes, eventiRes] = await Promise.all([
    sb.from("team_matazz").select("id, nome").order("nome"),
    sb.from("eventi").select("id, nome").order("data_inizio", { ascending: false }),
  ]);
  const team = (teamRes.data ?? []) as TeamMember[];
  const eventi = (eventiRes.data ?? []) as EventoOption[];

  const backHref = c.evento_id
    ? `/eventi/${c.evento_id}/compiti`
    : "/calendario";
  const backLabel = c.evento_id
    ? "Torna alla tabella di marcia"
    : "Torna al calendario";

  const errorMessage = errorParam ? ERROR_MESSAGES[errorParam] : null;
  const aggiornaConId = aggiornaCompito.bind(null, compId);

  return (
    <div className="max-w-2xl">
      <Link
        href={backHref}
        className="text-sm text-neutral-700 hover:text-neutral-900 underline"
      >
        ← {backLabel}
      </Link>

      <div className="flex items-start justify-between mt-2 gap-3 flex-wrap mb-6">
        <h2 className="text-2xl font-medium text-neutral-900">{c.titolo}</h2>
        <DeleteCompitoButton compId={compId} />
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
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="fatto"
            defaultChecked={c.fatto}
            className="w-4 h-4 text-amber-600 focus:ring-amber-500 border-neutral-300 rounded"
          />
          <span className="text-sm text-neutral-800 font-medium">Fatto</span>
        </label>

        <Field label="Titolo" required>
          <input
            type="text"
            name="titolo"
            required
            defaultValue={c.titolo}
            className={INPUT_CLASS}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Data inizio" required>
            <input
              type="date"
              name="data"
              required
              defaultValue={c.data}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Data fine">
            <input
              type="date"
              name="data_fine"
              defaultValue={c.data_fine ?? ""}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Ora">
            <input
              type="time"
              name="ora"
              defaultValue={c.ora ? c.ora.slice(0, 5) : ""}
              className={INPUT_CLASS}
            />
          </Field>
        </div>

        <Field label="Team / categoria">
          <select
            name="categoria"
            defaultValue={c.categoria ?? ""}
            className={INPUT_CLASS}
          >
            <option value="">— Senza team —</option>
            {c.categoria &&
              !(CATEGORIE_COMPITI as readonly string[]).includes(
                c.categoria,
              ) && (
                <option value={c.categoria}>{c.categoria} (vecchio)</option>
              )}
            {CATEGORIE_COMPITI.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Assegnato a">
          <select
            name="assegnato_a_id"
            defaultValue={c.assegnato_a_id ?? ""}
            className={INPUT_CLASS}
          >
            <option value="">— Nessuno —</option>
            {team.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Collegato a evento">
          <select
            name="evento_id"
            defaultValue={c.evento_id ?? ""}
            className={INPUT_CLASS}
          >
            <option value="">— Nessuno —</option>
            {eventi.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Descrizione">
          <textarea
            name="descrizione"
            rows={3}
            defaultValue={c.descrizione ?? ""}
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
            href={backHref}
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
