import { createServerClient } from "@/lib/supabase/server";
import { VociExtraClient } from "./_components/VociExtraClient";
import type { VoceExtraEdit } from "./_components/VoceExtraModal";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EventoVociExtraPage({ params }: Props) {
  const { id } = await params;
  const sb = createServerClient();

  const { data, error } = await sb
    .from("evento_budget_extra")
    .select("id, voce, importo, tipo, categoria, note")
    .eq("evento_id", id)
    .order("tipo")
    .order("voce");

  const rows = (data ?? []) as VoceExtraEdit[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
          Voci extra di budget
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Entrate e uscite che non rientrano in artisti, sponsor, F&B o
          materiali. Es. SIAE, affitto location, assicurazione.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Errore: {error.message}
        </p>
      )}

      <VociExtraClient eventoId={id} rows={rows} />
    </div>
  );
}
