import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { formatDateIT } from "@/lib/format";
import {
  aggiungiInteresseEvento,
  rimuoviInteresseEvento,
} from "../actions";

type Interesse = {
  id: string;
  evento: { id: string; nome: string; data_inizio: string } | null;
};

type Evento = { id: string; nome: string; data_inizio: string };

const INPUT_CLASS =
  "w-full px-3 py-2 border border-neutral-300 rounded text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500";

export async function InteresseEventiSection({
  artistaId,
}: {
  artistaId: string;
}) {
  const sb = createServerClient();

  const [interessiRes, eventiRes] = await Promise.all([
    sb
      .from("artisti_eventi_interesse")
      .select("id, evento:eventi(id, nome, data_inizio)")
      .eq("artista_id", artistaId)
      .order("created_at"),
    sb
      .from("eventi")
      .select("id, nome, data_inizio")
      .order("data_inizio", { ascending: false }),
  ]);

  const interessi = (interessiRes.data ?? []) as unknown as Interesse[];
  const allEventi = (eventiRes.data ?? []) as Evento[];

  const collectedIds = new Set(
    interessi.map((i) => i.evento?.id).filter(Boolean) as string[],
  );
  const eventiDisponibili = allEventi.filter((e) => !collectedIds.has(e.id));

  const aggiungiConArtista = aggiungiInteresseEvento.bind(null, artistaId);

  return (
    <section className="mt-8 space-y-3">
      <h2 className="text-lg font-medium text-neutral-900">
        Eventi di interesse
      </h2>
      <p className="text-sm text-neutral-700">
        Eventi per cui questo artista potrebbe essere adatto (suggerimenti, non
        partecipazioni effettive).
      </p>

      {interessi.length === 0 ? (
        <p className="text-sm text-neutral-700 bg-white border border-neutral-200 rounded px-3 py-2">
          Nessun evento di interesse ancora.
        </p>
      ) : (
        <ul className="space-y-1">
          {interessi.map(
            (i) =>
              i.evento && (
                <li
                  key={i.id}
                  className="flex items-center gap-2 bg-white border border-neutral-200 rounded px-3 py-2"
                >
                  <Link
                    href={`/eventi/${i.evento.id}`}
                    className="flex-1 text-neutral-900 hover:text-amber-700 hover:underline"
                  >
                    {i.evento.nome}{" "}
                    <span className="text-sm text-neutral-700">
                      — {formatDateIT(i.evento.data_inizio)}
                    </span>
                  </Link>
                  <form
                    action={rimuoviInteresseEvento.bind(null, artistaId, i.id)}
                  >
                    <button
                      type="submit"
                      aria-label="Rimuovi interesse"
                      className="text-neutral-500 hover:text-red-700 text-xl leading-none px-2"
                    >
                      ×
                    </button>
                  </form>
                </li>
              ),
          )}
        </ul>
      )}

      {eventiDisponibili.length > 0 && (
        <form
          action={aggiungiConArtista}
          className="flex items-end gap-2 flex-wrap"
        >
          <label className="flex-1 min-w-[200px]">
            <span className="text-sm font-medium text-neutral-800">
              Aggiungi evento
            </span>
            <select
              name="evento_id"
              required
              className={INPUT_CLASS}
              defaultValue=""
            >
              <option value="" disabled>
                — Seleziona —
              </option>
              {eventiDisponibili.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome} ({formatDateIT(e.data_inizio)})
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="px-4 py-2 bg-amber-600 text-white font-medium rounded hover:bg-amber-700"
          >
            Aggiungi
          </button>
        </form>
      )}
    </section>
  );
}
