"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentIdentity } from "@/lib/auth/identity";
import { createServerClient } from "@/lib/supabase/server";
import { TIPI_VOCE } from "./constants";

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

function revalidateExtra(eventoId: string) {
  revalidatePath(`/eventi/${eventoId}`);
  revalidatePath(`/eventi/${eventoId}/voci-extra`);
  revalidatePath(`/eventi/${eventoId}/budget`);
}

export type VoceExtraInput = {
  voce: string;
  tipo: string;
  importo: string | null;
  categoria: string | null;
  note: string | null;
};

function validate(input: VoceExtraInput): string | null {
  if (input.voce.trim().length === 0) return "La voce è obbligatoria.";
  if (!(TIPI_VOCE as readonly string[]).includes(input.tipo))
    return "Tipo non valido.";
  return null;
}

function normalize(input: VoceExtraInput) {
  return {
    voce: input.voce.trim(),
    tipo: input.tipo,
    importo: toNumber(input.importo, 0),
    categoria: trimOrNull(input.categoria),
    note: trimOrNull(input.note),
  };
}

export async function creaVoceExtraR(
  eventoId: string,
  input: VoceExtraInput,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const sb = createServerClient();
  const { error } = await sb.from("evento_budget_extra").insert({
    evento_id: eventoId,
    ...normalize(input),
  });

  if (error) {
    console.error("Errore crea voce extra:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }
  revalidateExtra(eventoId);
  return { ok: true };
}

export async function aggiornaVoceExtraR(
  eventoId: string,
  bextId: string,
  input: VoceExtraInput,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const sb = createServerClient();
  const { error } = await sb
    .from("evento_budget_extra")
    .update(normalize(input))
    .eq("id", bextId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("Errore update voce extra:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }
  revalidateExtra(eventoId);
  return { ok: true };
}

export async function eliminaVoceExtraR(
  eventoId: string,
  bextId: string,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const sb = createServerClient();
  const { error } = await sb
    .from("evento_budget_extra")
    .delete()
    .eq("id", bextId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("Errore delete voce extra:", error);
    return { ok: false, error: "Errore nella rimozione. Riprova." };
  }
  revalidateExtra(eventoId);
  return { ok: true };
}
