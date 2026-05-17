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

export async function aggiornaInventario(id: string, formData: FormData) {
  await requireCurrentIdentity();

  const articolo = formData.get("articolo");
  const quantita = formData.get("quantita");
  const doveSiTrova = formData.get("dove_si_trova");
  const condizione = formData.get("condizione");
  const note = formData.get("note");

  if (typeof articolo !== "string" || articolo.trim().length === 0) {
    redirect(`/inventario/${id}?error=articolo`);
  }
  if (
    typeof condizione !== "string" ||
    !(CONDIZIONI_VALIDE as readonly string[]).includes(condizione)
  ) {
    redirect(`/inventario/${id}?error=condizione`);
  }

  const sb = createServerClient();
  const { error } = await sb
    .from("inventario")
    .update({
      articolo: articolo.trim(),
      quantita: parseIntWithDefault(quantita, 1),
      dove_si_trova: trimOrNull(doveSiTrova),
      condizione,
      note: trimOrNull(note),
    })
    .eq("id", id);

  if (error) {
    console.error("Errore update inventario:", error);
    redirect(`/inventario/${id}?error=generic`);
  }

  revalidatePath("/inventario");
  revalidatePath(`/inventario/${id}`);
  redirect(`/inventario/${id}?saved=1`);
}

export async function eliminaInventario(id: string) {
  await requireCurrentIdentity();

  const sb = createServerClient();
  const { error } = await sb.from("inventario").delete().eq("id", id);

  if (error) {
    console.error("Errore delete inventario:", error);
    redirect(`/inventario/${id}?error=delete`);
  }

  revalidatePath("/inventario");
  redirect("/inventario");
}
