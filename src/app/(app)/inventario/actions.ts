"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentIdentity } from "@/lib/auth/identity";
import { createServerClient } from "@/lib/supabase/server";
import { CONDIZIONI } from "@/lib/inventario";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type InventarioInput = {
  articolo: string;
  quantita: number;
  dove_si_trova: string | null;
  condizione: string;
  note: string | null;
};

function trimOrNull(v: string | null): string | null {
  if (!v) return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function validate(input: InventarioInput): string | null {
  if (input.articolo.trim().length === 0)
    return "Il nome dell'articolo è obbligatorio.";
  if (!(CONDIZIONI as readonly string[]).includes(input.condizione))
    return "Condizione non valida.";
  return null;
}

export async function creaInventarioR(
  input: InventarioInput,
): Promise<ActionResult> {
  const me = await requireCurrentIdentity();
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const sb = createServerClient();
  const { error } = await sb.from("inventario").insert({
    articolo: input.articolo.trim(),
    quantita: Number.isFinite(input.quantita) ? input.quantita : 1,
    dove_si_trova: trimOrNull(input.dove_si_trova),
    condizione: input.condizione,
    note: trimOrNull(input.note),
    creato_da_id: me.id,
  });

  if (error) {
    console.error("Errore crea inventario:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }

  revalidatePath("/inventario");
  return { ok: true };
}

export async function aggiornaInventarioR(
  id: string,
  input: InventarioInput,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const sb = createServerClient();
  const { error } = await sb
    .from("inventario")
    .update({
      articolo: input.articolo.trim(),
      quantita: Number.isFinite(input.quantita) ? input.quantita : 1,
      dove_si_trova: trimOrNull(input.dove_si_trova),
      condizione: input.condizione,
      note: trimOrNull(input.note),
    })
    .eq("id", id);

  if (error) {
    console.error("Errore update inventario:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }

  revalidatePath("/inventario");
  revalidatePath(`/inventario/${id}`);
  return { ok: true };
}

export async function eliminaInventarioR(id: string): Promise<ActionResult> {
  await requireCurrentIdentity();

  const sb = createServerClient();
  const { error } = await sb.from("inventario").delete().eq("id", id);

  if (error) {
    console.error("Errore delete inventario:", error);
    return { ok: false, error: "Errore nell'eliminazione. Riprova." };
  }

  revalidatePath("/inventario");
  return { ok: true };
}
