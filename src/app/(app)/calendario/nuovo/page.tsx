import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { CATEGORIE_COMPITI } from "@/lib/compiti";
import { creaCompitoGlobale } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  titolo: "Il titolo è obbligatorio.",
  data: "La data è obbligatoria.",
  categoria: "La categoria è obbligatoria.",
  generic: "Errore nel salvataggio. Riprova.",
};

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500";

type TeamMember = { id: string; nome: string };
type Evento = { id: string; nome: string };

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NuovoCompitoGlobalePage({ searchParams }: Props) {
  const { error: errorParam } = await searchParams;
  const errorMessage = errorParam ? ERROR_MESSAGES[errorParam] : null;

  const sb = createServerClient();
  const [teamRes, eventiRes] = await Promise.all([
    sb.from("team_matazz").select("id, nome").order("nome"),
    sb.from("eventi").select("id, nome").order("data_inizio", { ascending: false }),
  ]);
  const team = (teamRes.data ?? []) as TeamMember[];
  const eventi = (eventiRes.data ?? []) as Evento[];

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-2xl font-medium text-neutral-900">Nuovo impegno</h1>
        <Link
          href="/calendario"
          className="text-sm text-neutral-700 hover:text-neutral-900 underline"
        >
          ← Torna al calendario
        </Link>
      </div>

      <form
        action={creaCompitoGlobale}
        className="space-y-4 bg-white p-6 rounded-lg border border-neutral-200"
      >
        {errorMessage && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {errorMessage}
          </p>
        )}

        <Field label="Titolo" required>
          <input type="text" name="titolo" required className={INPUT_CLASS} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Data inizio" required>
            <input type="date" name="data" required className={INPUT_CLASS} />
          </Field>
          <Field label="Data fine">
            <input type="date" name="data_fine" className={INPUT_CLASS} />
          </Field>
          <Field label="Ora">
            <input type="time" name="ora" className={INPUT_CLASS} />
          </Field>
        </div>
        <p className="text-xs text-neutral-600 -mt-2">
          Lascia &quot;Data fine&quot; vuota per un impegno di un solo giorno.
        </p>

        <Field label="Team / categoria">
          <select name="categoria" defaultValue="" className={INPUT_CLASS}>
            <option value="">— Senza team —</option>
            {CATEGORIE_COMPITI.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Assegnato a">
          <select
            name="assegnato_a_id"
            defaultValue=""
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

        <Field label="Collega a un evento (opzionale)">
          <select name="evento_id" defaultValue="" className={INPUT_CLASS}>
            <option value="">— Nessuno (meeting di team) —</option>
            {eventi.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Descrizione">
          <textarea name="descrizione" rows={3} className={INPUT_CLASS} />
        </Field>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-amber-600 text-white font-medium rounded hover:bg-amber-700"
          >
            Crea
          </button>
          <Link
            href="/calendario"
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
