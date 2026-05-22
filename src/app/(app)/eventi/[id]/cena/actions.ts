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
  modello: "PerPersona" | "Totale";
  prezzo_per_persona: string | null;
  numero_persone: string | null;
  prezzo_totale: string | null;
  selezionata: boolean;
  note: string | null;
};

function validateCatering(input: CateringInput): string | null {
  if (input.nome_fornitore.trim().length === 0)
    return "Il nome dello chef è obbligatorio.";
  if (input.modello !== "PerPersona" && input.modello !== "Totale")
    return "Modello prezzo non valido.";
  return null;
}

function cateringPayload(input: CateringInput) {
  const isTotale = input.modello === "Totale";
  return {
    nome_fornitore: input.nome_fornitore.trim(),
    descrizione: trimOrNull(input.descrizione),
    modello: input.modello,
    prezzo_per_persona: isTotale ? 0 : toNumber(input.prezzo_per_persona, 0),
    numero_persone: isTotale ? 0 : toNumber(input.numero_persone, 0),
    prezzo_totale: isTotale ? toNumber(input.prezzo_totale, 0) : 0,
    selezionata: input.selezionata,
    note: trimOrNull(input.note),
  };
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
    ...cateringPayload(input),
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
    .update(cateringPayload(input))
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

export async function allineaCateringPersoneR(
  eventoId: string,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const sb = createServerClient();

  const [
    artistiCount,
    personaleCount,
    ospitiCount,
    teamCount,
    teamEsclusiCount,
  ] = await Promise.all([
    sb
      .from("evento_artisti")
      .select("id", { count: "exact", head: true })
      .eq("evento_id", eventoId)
      .eq("presente_cena", true),
    sb
      .from("evento_personale")
      .select("id", { count: "exact", head: true })
      .eq("evento_id", eventoId)
      .eq("presente_cena", true),
    sb
      .from("evento_cena_ospiti")
      .select("id", { count: "exact", head: true })
      .eq("evento_id", eventoId),
    sb.from("team_matazz").select("id", { count: "exact", head: true }),
    sb
      .from("evento_team_cena_esclusi")
      .select("id", { count: "exact", head: true })
      .eq("evento_id", eventoId),
  ]);

  const totale =
    (artistiCount.count ?? 0) +
    (personaleCount.count ?? 0) +
    (ospitiCount.count ?? 0) +
    Math.max(0, (teamCount.count ?? 0) - (teamEsclusiCount.count ?? 0));

  const { error } = await sb
    .from("evento_catering")
    .update({ numero_persone: totale })
    .eq("evento_id", eventoId)
    .eq("modello", "PerPersona");

  if (error) {
    console.error("Errore allinea catering persone:", error);
    return { ok: false, error: "Errore nell'aggiornamento. Riprova." };
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
  intolleranze: string | null,
): Promise<ActionResult> {
  const me = await requireCurrentIdentity();
  const nomeTrim = nome.trim();
  if (nomeTrim.length === 0) return { ok: false, error: "Il nome è obbligatorio." };

  const sb = createServerClient();
  const { error } = await sb.from("evento_cena_ospiti").insert({
    evento_id: eventoId,
    nome: nomeTrim,
    intolleranze_cibo: trimOrNull(intolleranze),
    creato_da_id: me.id,
  });

  if (error) {
    console.error("Errore aggiungi ospite cena:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }
  revalidateCena(eventoId);
  return { ok: true };
}

// ----- TEAM MATAZZ ALLA CENA --------------------------------------------

export async function toggleTeamCenaR(
  eventoId: string,
  teamMatazzId: string,
  presente: boolean,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const sb = createServerClient();

  if (presente) {
    // includere: rimuovi eventuale esclusione
    const { error } = await sb
      .from("evento_team_cena_esclusi")
      .delete()
      .eq("evento_id", eventoId)
      .eq("team_matazz_id", teamMatazzId);
    if (error) {
      console.error("Errore includi team cena:", error);
      return { ok: false, error: "Errore. Riprova." };
    }
  } else {
    // escludere: inserisci (idempotente per via dell'unique)
    const { error } = await sb.from("evento_team_cena_esclusi").upsert(
      { evento_id: eventoId, team_matazz_id: teamMatazzId },
      { onConflict: "evento_id,team_matazz_id" },
    );
    if (error) {
      console.error("Errore escludi team cena:", error);
      return { ok: false, error: "Errore. Riprova." };
    }
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
