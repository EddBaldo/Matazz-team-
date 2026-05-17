import { createServerClient } from "@/lib/supabase/server";
import {
  LocationsClient,
  type LocationRow,
} from "./_components/LocationsClient";

type DbRow = {
  id: string;
  nome: string;
  citta: string;
  stato: string | null;
  indirizzo: string | null;
  capienza: number | null;
  contatti_referente: string | null;
  costo_tipico: number | null;
  link: string | null;
  note: string | null;
  creato_da: { nome: string } | null;
};

export default async function LocationsPage() {
  const sb = createServerClient();
  const { data, error } = await sb
    .from("locations")
    .select(
      `id, nome, citta, stato, indirizzo, capienza, contatti_referente, costo_tipico, link, note,
       creato_da:team_matazz(nome)`,
    )
    .order("nome");

  const dbRows = (data ?? []) as unknown as DbRow[];
  const rows: LocationRow[] = dbRows.map((r) => ({
    id: r.id,
    nome: r.nome,
    citta: r.citta,
    stato: r.stato ?? "Svizzera",
    indirizzo: r.indirizzo,
    capienza: r.capienza,
    contatti_referente: r.contatti_referente,
    costo_tipico: r.costo_tipico,
    link: r.link,
    note: r.note,
    creatoDaNome: r.creato_da?.nome ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
          Scouting Location
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Potenziali location raggruppate per stato. Aggiungi qui qualsiasi
          posto che potrebbe ospitare un evento futuro.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Errore: {error.message}
        </p>
      )}

      <LocationsClient rows={rows} />
    </div>
  );
}
