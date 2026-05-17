import { createServerClient } from "@/lib/supabase/server";
import {
  PersonaleClient,
  type PersonaleRow,
} from "./_components/PersonaleClient";
import type { PersonaRubrica } from "./_components/AggiungiPersonaleModal";

type DbRow = {
  id: string;
  personale_id: string;
  ruolo_specifico: string | null;
  presenza: string | null;
  compenso: number | null;
  note: string | null;
  confermato: boolean;
  persona: {
    nome: string;
    cognome: string;
    ruolo_principale: string;
    categoria: string | null;
  } | null;
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EventoPersonalePage({ params }: Props) {
  const { id } = await params;
  const sb = createServerClient();

  const [evPersRes, rubricaRes] = await Promise.all([
    sb
      .from("evento_personale")
      .select(
        `id, personale_id, ruolo_specifico, presenza, compenso, note, confermato,
         persona:personale_esterno(nome, cognome, ruolo_principale, categoria)`,
      )
      .eq("evento_id", id),
    sb
      .from("personale_esterno")
      .select("id, nome, cognome, ruolo_principale, categoria")
      .order("cognome"),
  ]);

  const dbRows = (evPersRes.data ?? []) as unknown as DbRow[];
  const rubrica = (rubricaRes.data ?? []) as PersonaRubrica[];

  const rows: PersonaleRow[] = dbRows
    .filter((r) => r.persona !== null)
    .map((r) => ({
      id: r.id,
      personaleId: r.personale_id,
      ruolo_specifico: r.ruolo_specifico,
      presenza: r.presenza,
      compenso: r.compenso,
      note: r.note,
      confermato: r.confermato,
      personaLabel: `${r.persona!.nome} ${r.persona!.cognome}`,
      ruoloRubrica: r.persona!.ruolo_principale,
      categoria: r.persona!.categoria,
      nome: r.persona!.nome,
      cognome: r.persona!.cognome,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
          Personale
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Staff dell&apos;evento raggruppato per categoria. Indica la presenza
          (es. tutti i giorni, sabato sera) e nelle note specifica cosa fa.
        </p>
      </div>

      {evPersRes.error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Errore: {evPersRes.error.message}
        </p>
      )}

      <PersonaleClient eventoId={id} rows={rows} rubrica={rubrica} />
    </div>
  );
}
