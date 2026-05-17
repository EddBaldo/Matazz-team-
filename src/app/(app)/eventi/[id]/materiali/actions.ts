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

function toNumber(v: string | null, def: number): number {
  if (v == null || v === "") return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function revalidateMat(eventoId: string) {
  revalidatePath(`/eventi/${eventoId}`);
  revalidatePath(`/eventi/${eventoId}/materiali`);
}

export type MaterialeInput = {
  articolo: string;
  quantita: string | null;
  prezzo_unitario: string | null;
  a_cosa_serve: string | null;
  dove_lo_prendiamo: string | null;
  preso: boolean;
  gia_disponibile: boolean;
  note: string | null;
};

function validate(input: MaterialeInput): string | null {
  if (input.articolo.trim().length === 0)
    return "Il nome del materiale è obbligatorio.";
  return null;
}

function normalize(input: MaterialeInput) {
  return {
    articolo: input.articolo.trim(),
    quantita: toNumber(input.quantita, 1),
    prezzo_unitario: toNumber(input.prezzo_unitario, 0),
    a_cosa_serve: trimOrNull(input.a_cosa_serve),
    dove_lo_prendiamo: trimOrNull(input.dove_lo_prendiamo),
    preso: input.preso,
    gia_disponibile: input.gia_disponibile,
    note: trimOrNull(input.note),
  };
}

export async function creaMaterialeR(
  eventoId: string,
  input: MaterialeInput,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const sb = createServerClient();
  const { error } = await sb.from("evento_materiali").insert({
    evento_id: eventoId,
    ...normalize(input),
  });

  if (error) {
    console.error("Errore crea materiale:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }
  revalidateMat(eventoId);
  return { ok: true };
}

export async function aggiornaMaterialeR(
  eventoId: string,
  evMatId: string,
  input: MaterialeInput,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const sb = createServerClient();
  const { error } = await sb
    .from("evento_materiali")
    .update(normalize(input))
    .eq("id", evMatId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("Errore update materiale:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }
  revalidateMat(eventoId);
  return { ok: true };
}

export async function eliminaMaterialeR(
  eventoId: string,
  evMatId: string,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const sb = createServerClient();
  const { error } = await sb
    .from("evento_materiali")
    .delete()
    .eq("id", evMatId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("Errore delete materiale:", error);
    return { ok: false, error: "Errore nella rimozione. Riprova." };
  }
  revalidateMat(eventoId);
  return { ok: true };
}

export async function togglePresoR(
  eventoId: string,
  evMatId: string,
  preso: boolean,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const sb = createServerClient();
  const { error } = await sb
    .from("evento_materiali")
    .update({ preso })
    .eq("id", evMatId)
    .eq("evento_id", eventoId);
  if (error) return { ok: false, error: "Errore." };
  revalidateMat(eventoId);
  return { ok: true };
}
