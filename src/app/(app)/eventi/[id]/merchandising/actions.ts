"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentIdentity } from "@/lib/auth/identity";
import { createServerClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

function trimOrNull(v: string | null): string | null {
  if (!v) return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function toInt(v: string | null, def: number): number {
  if (v == null || v === "") return def;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : def;
}

function toNumber(v: string | null, def: number): number {
  if (v == null || v === "") return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function revalidateMerch(eventoId: string) {
  revalidatePath(`/eventi/${eventoId}`);
  revalidatePath(`/eventi/${eventoId}/merchandising`);
  revalidatePath(`/eventi/${eventoId}/budget`);
}

export type MerchandisingInput = {
  articolo: string;
  quantita: string | null;
  costo_totale: string | null;
  ricavo_stimato: string | null;
  note: string | null;
};

function validate(input: MerchandisingInput): string | null {
  if (input.articolo.trim().length === 0) return "L'articolo è obbligatorio.";
  return null;
}

function normalize(input: MerchandisingInput) {
  return {
    articolo: input.articolo.trim(),
    quantita: toInt(input.quantita, 1),
    costo_totale: toNumber(input.costo_totale, 0),
    ricavo_stimato: toNumber(input.ricavo_stimato, 0),
    note: trimOrNull(input.note),
  };
}

export async function creaMerchandisingR(
  eventoId: string,
  input: MerchandisingInput,
): Promise<ActionResult> {
  const me = await requireCurrentIdentity();
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const sb = createServerClient();
  const { error } = await sb.from("evento_merchandising").insert({
    evento_id: eventoId,
    ...normalize(input),
    creato_da_id: me.id,
  });

  if (error) {
    console.error("Errore crea merch:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }
  revalidateMerch(eventoId);
  return { ok: true };
}

export async function aggiornaMerchandisingR(
  eventoId: string,
  rowId: string,
  input: MerchandisingInput,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const sb = createServerClient();
  const { error } = await sb
    .from("evento_merchandising")
    .update(normalize(input))
    .eq("id", rowId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("Errore update merch:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }
  revalidateMerch(eventoId);
  return { ok: true };
}

export async function eliminaMerchandisingR(
  eventoId: string,
  rowId: string,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const sb = createServerClient();
  const { error } = await sb
    .from("evento_merchandising")
    .delete()
    .eq("id", rowId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("Errore delete merch:", error);
    return { ok: false, error: "Errore nella rimozione. Riprova." };
  }
  revalidateMerch(eventoId);
  return { ok: true };
}
