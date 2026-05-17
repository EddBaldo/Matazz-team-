import { createServerClient } from "@/lib/supabase/server";
import {
  EventiClient,
  type EventoCard,
} from "./_components/EventiClient";
import type { LocationOption } from "./_components/NuovoEventoModal";

type DbEvento = {
  id: string;
  nome: string;
  data_inizio: string;
  data_fine: string | null;
  stato: string;
  descrizione: string | null;
  location: { nome: string; citta: string } | null;
  creato_da: { nome: string } | null;
};

export default async function EventiPage() {
  const sb = createServerClient();

  const [eventiRes, locsRes] = await Promise.all([
    sb
      .from("eventi")
      .select(
        `id, nome, data_inizio, data_fine, stato, descrizione,
         location:locations(nome, citta),
         creato_da:team_matazz(nome)`,
      )
      .order("data_inizio", { ascending: false }),
    sb.from("locations").select("id, nome, citta").order("nome"),
  ]);

  const dbEventi = (eventiRes.data ?? []) as unknown as DbEvento[];
  const locations = (locsRes.data ?? []) as LocationOption[];

  const eventi: EventoCard[] = dbEventi.map((e) => ({
    id: e.id,
    nome: e.nome,
    data_inizio: e.data_inizio,
    data_fine: e.data_fine,
    stato: e.stato,
    descrizione: e.descrizione,
    locationNome: e.location?.nome ?? null,
    locationCitta: e.location?.citta ?? null,
    creatoDaNome: e.creato_da?.nome ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
          Eventi
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Tutti gli eventi di Matazz. Clicca su una card per aprire il dettaglio.
        </p>
      </div>

      {eventiRes.error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Errore: {eventiRes.error.message}
        </p>
      )}

      <EventiClient eventi={eventi} locations={locations} />
    </div>
  );
}
