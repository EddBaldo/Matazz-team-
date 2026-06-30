"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentIdentity } from "@/lib/auth/identity";
import { createServerClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function salvaIncassoRealeR(
  eventoId: string,
  valore: number | null,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const sb = createServerClient();
  const val =
    valore == null || !Number.isFinite(valore) ? null : Math.max(0, valore);
  const { error } = await sb
    .from("eventi")
    .update({ incasso_reale_vendite: val })
    .eq("id", eventoId);
  if (error) {
    console.error("Errore salva incasso reale:", error);
    return { ok: false, error: "Errore nel salvataggio." };
  }
  revalidatePath(`/eventi/${eventoId}`);
  revalidatePath(`/eventi/${eventoId}/budget`);
  return { ok: true };
}

export async function salvaStima(
  eventoId: string,
  chiave: string,
  importo: number,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  if (!chiave) return { ok: false, error: "Chiave mancante." };
  const val = Number.isFinite(importo) ? importo : 0;

  const sb = createServerClient();
  const { error } = await sb.from("evento_budget_stime").upsert(
    {
      evento_id: eventoId,
      chiave,
      importo: val,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "evento_id,chiave" },
  );

  if (error) {
    console.error("Errore salva stima:", error);
    return { ok: false, error: "Errore nel salvataggio." };
  }
  revalidatePath(`/eventi/${eventoId}/budget`);
  return { ok: true };
}
