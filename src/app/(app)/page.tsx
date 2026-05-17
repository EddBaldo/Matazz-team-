import Link from "next/link";
import { requireCurrentIdentity } from "@/lib/auth/identity";
import { createServerClient } from "@/lib/supabase/server";
import { formatDateIT } from "@/lib/format";

type EventoAttivo = {
  id: string;
  nome: string;
  data_inizio: string;
  stato: string;
  location: { nome: string } | null;
};

export default async function HomePage() {
  const me = await requireCurrentIdentity();
  const sb = createServerClient();
  const { data } = await sb
    .from("eventi")
    .select("id, nome, data_inizio, stato, location:locations(nome)")
    .eq("stato", "In pianificazione")
    .order("data_inizio", { ascending: true });

  const eventi = (data ?? []) as unknown as EventoAttivo[];

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-medium text-neutral-900">
            Ciao, {me.nome}
          </h1>
          <p className="text-neutral-700 mt-1">Eventi attivi:</p>
        </div>
        <Link
          href="/eventi"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
        >
          Vai agli eventi
        </Link>
      </div>

      {eventi.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded p-8 text-center">
          <p className="text-neutral-700">Nessun evento attivo al momento.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {eventi.map((e) => (
            <li
              key={e.id}
              className="bg-white border border-neutral-200 rounded p-4"
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-medium text-neutral-900">{e.nome}</p>
                  <p className="text-sm text-neutral-700 mt-0.5">
                    {formatDateIT(e.data_inizio)}
                    {e.location?.nome && ` · ${e.location.nome}`}
                  </p>
                </div>
                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                  {e.stato}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
