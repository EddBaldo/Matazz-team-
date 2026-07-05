"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleRimborsatoR(
  eventoId: string,
  categoria: string,
  sourceId: string,
  rimborsato: boolean,
): Promise<{ ok: boolean }> {
  const sb = createServerClient();
  const { error } = await sb.from("evento_rimborsi").upsert(
    { evento_id: eventoId, categoria, source_id: sourceId, rimborsato },
    { onConflict: "evento_id,categoria,source_id" },
  );
  if (error) return { ok: false };
  revalidatePath(`/eventi/${eventoId}/rimborsi`);
  return { ok: true };
}

const TABLE_MAP: Record<string, string> = {
  artisti: "evento_artisti",
  personale: "evento_personale",
  materiali: "evento_materiali",
  merchandising: "evento_merchandising",
  bar: "evento_bar_costi_reali",
  food_truck: "evento_food_truck",
  voci_extra: "evento_budget_extra",
};

export async function aggiornaPagatoDaR(
  eventoId: string,
  categoria: string,
  sourceId: string,
  pagatoDa: string | null,
): Promise<{ ok: boolean }> {
  const table = TABLE_MAP[categoria];
  if (!table) return { ok: false };
  const sb = createServerClient();
  const { error } = await sb
    .from(table)
    .update({ pagato_da: pagatoDa })
    .eq("id", sourceId);
  if (error) return { ok: false };
  revalidatePath(`/eventi/${eventoId}/rimborsi`);
  return { ok: true };
}
