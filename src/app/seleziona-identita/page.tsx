import { createServerClient } from "@/lib/supabase/server";
import { selezionaIdentita } from "./actions";

export default async function SelezionaIdentitaPage() {
  const sb = createServerClient();
  const { data: membri, error } = await sb
    .from("team_matazz")
    .select("id, nome")
    .order("nome");

  if (error || !membri) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <p className="text-red-700">
          Errore nel caricamento dei membri del team.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-4 text-neutral-800">
      <div className="w-full max-w-2xl">
        <h1 className="text-xl font-medium text-center text-neutral-900">
          Chi sei?
        </h1>
        <p className="text-sm text-neutral-700 text-center mt-1 mb-6">
          Seleziona il tuo nome.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {membri.map((m) => (
            <form key={m.id} action={selezionaIdentita}>
              <input type="hidden" name="id" value={m.id} />
              <button
                type="submit"
                className="w-full py-6 bg-white border border-neutral-200 rounded-lg text-lg font-medium text-neutral-900 hover:bg-amber-50 hover:border-amber-400"
              >
                {m.nome}
              </button>
            </form>
          ))}
        </div>
      </div>
    </main>
  );
}
