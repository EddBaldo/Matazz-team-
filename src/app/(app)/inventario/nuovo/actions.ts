"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireCurrentIdentity } from "@/lib/auth/identity";
import { createServerClient } from "@/lib/supabase/server";

const CONDIZIONI_VALIDE = [
  "Ottimo",
  "Buono",
  "Da riparare",
  "Da buttare",
] as const;

function parseIntWithDefault(
  v: FormDataEntryValue | null,
  def: number,
): number {
  if (typeof v !== "string" || v.trim().length === 0) return def;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
}

function trimOrNull(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

export async function creaInventario(formData: FormData) {
  const articolo = formData.get("articolo");
  const quantita = formData.get("quantita");
  const doveSiTrova = formData.get("dove_si_trova");
  const condizione = formData.get("condizione");
  const note = formData.get("note");

  if (typeof articolo !== "string" || articolo.trim().length === 0) {
    redirect("/inventario/nuovo?error=articolo");
  }
  if (
    typeof condizione !== "string" ||
    !(CONDIZIONI_VALIDE as readonly string[]).includes(condizione)
  ) {
    redirect("/inventario/nuovo?error=condizione");
  }

  const me = await requireCurrentIdentity();

  const sb = createServerClient();
  const { error } = await sb.from("inventario").insert({
    articolo: articolo.trim(),
    quantita: parseIntWithDefault(quantita, 1),
    dove_si_trova: trimOrNull(doveSiTrova),
    condizione,
    note: trimOrNull(note),
    creato_da_id: me.id,
  });

  if (error) {
    console.error("Errore creazione inventario:", error);
    redirect("/inventario/nuovo?error=generic");
  }

  revalidatePath("/inventario");
  redirect("/inventario");
}
