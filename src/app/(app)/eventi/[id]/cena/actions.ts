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

function toNumber(v: string | null | undefined, def: number): number {
  if (v == null || v === "") return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function revalidateCena(eventoId: string) {
  revalidatePath(`/eventi/${eventoId}`);
  revalidatePath(`/eventi/${eventoId}/cena`);
  revalidatePath(`/eventi/${eventoId}/food-beverage`);
}

// ----- CATERING ----------------------------------------------------------

export type CateringInput = {
  nome_fornitore: string;
  descrizione: string | null;
  prezzo_per_persona: string | null;
  selezionata: boolean;
  note: string | null;
};

function validateCatering(input: CateringInput): string | null {
  if (input.nome_fornitore.trim().length === 0)
    return "Il nome dello chef è obbligatorio.";
  return null;
}

export async function creaCateringR(
  eventoId: string,
  input: CateringInput,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const err = validateCatering(input);
  if (err) return { ok: false, error: err };

  const sb = createServerClient();
  const { error } = await sb.from("evento_catering").insert({
    evento_id: eventoId,
    nome_fornitore: input.nome_fornitore.trim(),
    descrizione: trimOrNull(input.descrizione),
    prezzo_per_persona: toNumber(input.prezzo_per_persona, 0),
    selezionata: input.selezionata,
    note: trimOrNull(input.note),
  });

  if (error) {
    console.error("Errore crea catering:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }
  revalidateCena(eventoId);
  return { ok: true };
}

export async function aggiornaCateringR(
  eventoId: string,
  catId: string,
  input: CateringInput,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const err = validateCatering(input);
  if (err) return { ok: false, error: err };

  const sb = createServerClient();
  const { error } = await sb
    .from("evento_catering")
    .update({
      nome_fornitore: input.nome_fornitore.trim(),
      descrizione: trimOrNull(input.descrizione),
      prezzo_per_persona: toNumber(input.prezzo_per_persona, 0),
      selezionata: input.selezionata,
      note: trimOrNull(input.note),
    })
    .eq("id", catId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("Errore update catering:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }
  revalidateCena(eventoId);
  return { ok: true };
}

export async function eliminaCateringR(
  eventoId: string,
  catId: string,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const sb = createServerClient();
  const { error } = await sb
    .from("evento_catering")
    .delete()
    .eq("id", catId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("Errore delete catering:", error);
    return { ok: false, error: "Errore nell'eliminazione. Riprova." };
  }
  revalidateCena(eventoId);
  return { ok: true };
}

export async function toggleCateringSelezionata(
  eventoId: string,
  catId: string,
  selezionata: boolean,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const sb = createServerClient();
  const { error } = await sb
    .from("evento_catering")
    .update({ selezionata })
    .eq("id", catId)
    .eq("evento_id", eventoId);

  if (error) return { ok: false, error: "Errore." };
  revalidateCena(eventoId);
  return { ok: true };
}

// ----- OSPITI EXTRA (Family & Friends) -----------------------------------

export async function aggiungiOspiteR(
  eventoId: string,
  nome: string,
  note: string | null,
): Promise<ActionResult> {
  const me = await requireCurrentIdentity();
  const nomeTrim = nome.trim();
  if (nomeTrim.length === 0) return { ok: false, error: "Il nome è obbligatorio." };

  const sb = createServerClient();
  const { error } = await sb.from("evento_cena_ospiti").insert({
    evento_id: eventoId,
    nome: nomeTrim,
    note: trimOrNull(note),
    creato_da_id: me.id,
  });

  if (error) {
    console.error("Errore aggiungi ospite cena:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }
  revalidateCena(eventoId);
  return { ok: true };
}

export async function rimuoviOspiteR(
  eventoId: string,
  ospiteId: string,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const sb = createServerClient();
  const { error } = await sb
    .from("evento_cena_ospiti")
    .delete()
    .eq("id", ospiteId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("Errore delete ospite cena:", error);
    return { ok: false, error: "Errore nella rimozione. Riprova." };
  }
  revalidateCena(eventoId);
  return { ok: true };
}
