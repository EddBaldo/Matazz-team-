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
      <main className="min-h-screen flex items-center justify-center p-4 bg-neutral-50">
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          Errore nel caricamento dei membri del team.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">
            Chi sei?
          </h1>
          <p className="text-sm text-neutral-600 mt-2">
            Seleziona il tuo nome per continuare.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {membri.map((m) => (
            <form key={m.id} action={selezionaIdentita}>
              <input type="hidden" name="id" value={m.id} />
              <button
                type="submit"
                className="w-full py-6 bg-white rounded-3xl text-lg font-medium text-neutral-900 hover:-translate-y-0.5 transition-transform"
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
