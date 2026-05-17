import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";

type Suggerito = {
  id: string;
  artista: {
    id: string;
    nome: string;
    cognome: string;
    tipo_arte: string;
  } | null;
};

export async function ArtistiSuggeritiSection({
  eventoId,
}: {
  eventoId: string;
}) {
  const sb = createServerClient();
  const { data } = await sb
    .from("artisti_eventi_interesse")
    .select("id, artista:artisti(id, nome, cognome, tipo_arte)")
    .eq("evento_id", eventoId)
    .order("created_at");

  const suggeriti = (data ?? []) as unknown as Suggerito[];

  return (
    <section className="mt-8 space-y-3">
      <h2 className="text-lg font-medium text-neutral-900">
        Artisti suggeriti per questo evento
      </h2>
      <p className="text-sm text-neutral-700">
        Artisti candidati (non ancora partecipanti). Gestisci i suggerimenti
        dalla scheda di ogni artista.
      </p>

      {suggeriti.length === 0 ? (
        <p className="text-sm text-neutral-700 bg-white border border-neutral-200 rounded px-3 py-2">
          Nessun artista suggerito.
        </p>
      ) : (
        <ul className="space-y-1">
          {suggeriti.map(
            (s) =>
              s.artista && (
                <li
                  key={s.id}
                  className="bg-white border border-neutral-200 rounded px-3 py-2 flex items-center justify-between gap-2 flex-wrap"
                >
                  <Link
                    href={`/artisti/${s.artista.id}`}
                    className="text-neutral-900 font-medium hover:text-amber-700 hover:underline"
                  >
                    {s.artista.nome} {s.artista.cognome}
                  </Link>
                  <span className="text-sm text-neutral-700">
                    {s.artista.tipo_arte}
                  </span>
                </li>
              ),
          )}
        </ul>
      )}
    </section>
  );
}
