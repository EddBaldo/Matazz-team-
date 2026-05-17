"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentIdentity } from "@/lib/auth/identity";
import { createServerClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type MovimentoInput = {
  data: string;
  descrizione: string;
  importo: number;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validate(input: MovimentoInput): string | null {
  if (!DATE_RE.test(input.data)) return "Data non valida.";
  if (input.descrizione.trim().length === 0)
    return "La descrizione è obbligatoria.";
  if (!Number.isFinite(input.importo) || input.importo === 0)
    return "L'importo deve essere un numero diverso da zero.";
  return null;
}

export async function creaMovimentoR(
  input: MovimentoInput,
): Promise<ActionResult> {
  const me = await requireCurrentIdentity();
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const sb = createServerClient();
  const { error } = await sb.from("conto_movimenti").insert({
    data: input.data,
    descrizione: input.descrizione.trim(),
    importo: input.importo,
    creato_da_id: me.id,
  });

  if (error) {
    console.error("Errore crea movimento:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }

  revalidatePath("/conto");
  return { ok: true };
}

export async function aggiornaMovimentoR(
  id: string,
  input: MovimentoInput,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const sb = createServerClient();
  const { error } = await sb
    .from("conto_movimenti")
    .update({
      data: input.data,
      descrizione: input.descrizione.trim(),
      importo: input.importo,
    })
    .eq("id", id);

  if (error) {
    console.error("Errore update movimento:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }

  revalidatePath("/conto");
  return { ok: true };
}

export async function eliminaMovimentoR(id: string): Promise<ActionResult> {
  await requireCurrentIdentity();

  const sb = createServerClient();
  const { error } = await sb.from("conto_movimenti").delete().eq("id", id);

  if (error) {
    console.error("Errore delete movimento:", error);
    return { ok: false, error: "Errore nell'eliminazione. Riprova." };
  }

  revalidatePath("/conto");
  return { ok: true };
}
