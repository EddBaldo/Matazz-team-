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

function revalidateFB(eventoId: string) {
  revalidatePath(`/eventi/${eventoId}`);
  revalidatePath(`/eventi/${eventoId}/food-beverage`);
  revalidatePath(`/eventi/${eventoId}/budget`);
}

// ----- STIME EVENTO (persone + bevande/persona) --------------------------

export async function aggiornaStimePersoneR(
  eventoId: string,
  persone: string | null,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const sb = createServerClient();
  const { error } = await sb
    .from("eventi")
    .update({
      persone_stimati: Math.max(0, Math.floor(toNumber(persone, 0))),
    })
    .eq("id", eventoId);

  if (error) {
    console.error("Errore update stime persone:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }
  revalidateFB(eventoId);
  return { ok: true };
}

// ----- TOGGLE SEZIONI BAR / FOOD TRUCK ----------------------------------

export async function toggleBarAttivoR(
  eventoId: string,
  attivo: boolean,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const sb = createServerClient();
  const { error } = await sb
    .from("eventi")
    .update({ bar_attivo: attivo })
    .eq("id", eventoId);

  if (error) {
    console.error("Errore toggle bar attivo:", error);
    return { ok: false, error: "Errore. Riprova." };
  }
  revalidateFB(eventoId);
  return { ok: true };
}

export async function toggleFoodTruckAttivoR(
  eventoId: string,
  attivo: boolean,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const sb = createServerClient();
  const { error } = await sb
    .from("eventi")
    .update({ food_truck_attivo: attivo })
    .eq("id", eventoId);

  if (error) {
    console.error("Errore toggle food truck attivo:", error);
    return { ok: false, error: "Errore. Riprova." };
  }
  revalidateFB(eventoId);
  return { ok: true };
}

// ----- BAR COSTO REALE (per fonte/fornitore) --------------------------------

export async function upsertBarCostoRealeR(
  eventoId: string,
  fonte: string,
  costoReale: number | null,
  pagatoDa: string | null,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const sb = createServerClient();
  const costo = costoReale == null || !Number.isFinite(costoReale) ? null : Math.max(0, costoReale);
  const pagato = pagatoDa?.trim() || null;
  const { error } = await sb
    .from("evento_bar_costi_reali")
    .upsert(
      { evento_id: eventoId, fonte, costo_reale: costo, pagato_da: pagato },
      { onConflict: "evento_id,fonte" },
    );
  if (error) {
    console.error("Errore salva costo reale bar:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }
  revalidateFB(eventoId);
  return { ok: true };
}

export async function aggiornaFoodTruckCostoRealeR(
  eventoId: string,
  valore: number | null,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const sb = createServerClient();
  const val = valore == null || !Number.isFinite(valore) ? null : Math.max(0, valore);
  const { error } = await sb
    .from("eventi")
    .update({ food_truck_costo_reale_acquisto: val })
    .eq("id", eventoId);
  if (error) return { ok: false, error: "Errore nel salvataggio. Riprova." };
  revalidateFB(eventoId);
  return { ok: true };
}

// ----- BAR ---------------------------------------------------------------

export type BarInput = {
  articolo: string;
  fonte: "Noi" | "Fornitore";
  fornitore: string | null;
  costo_unitario: string | null;
  prezzo_vendita: string | null;
  consumo_per_persona: string | null;
  note: string | null;
};

function validateBar(input: BarInput): string | null {
  if (input.articolo.trim().length === 0)
    return "Il nome dell'articolo è obbligatorio.";
  if (input.fonte !== "Noi" && input.fonte !== "Fornitore")
    return "Fonte non valida.";
  if (input.fonte === "Fornitore" && (!input.fornitore || input.fornitore.trim().length === 0))
    return "Il nome del fornitore è obbligatorio.";
  return null;
}

export async function creaBarR(
  eventoId: string,
  input: BarInput,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const err = validateBar(input);
  if (err) return { ok: false, error: err };

  const sb = createServerClient();
  const { error } = await sb.from("evento_bar_articoli").insert({
    evento_id: eventoId,
    articolo: input.articolo.trim(),
    fonte: input.fonte,
    fornitore: input.fonte === "Fornitore" ? trimOrNull(input.fornitore) : null,
    costo_unitario: toNumber(input.costo_unitario, 0),
    prezzo_vendita: toNumber(input.prezzo_vendita, 0),
    consumo_per_persona: Math.max(0, toNumber(input.consumo_per_persona, 0)),
    note: trimOrNull(input.note),
  });

  if (error) {
    console.error("Errore crea bar articolo:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }
  revalidateFB(eventoId);
  return { ok: true };
}

export async function aggiornaBarR(
  eventoId: string,
  barId: string,
  input: BarInput,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const err = validateBar(input);
  if (err) return { ok: false, error: err };

  const sb = createServerClient();
  const { error } = await sb
    .from("evento_bar_articoli")
    .update({
      articolo: input.articolo.trim(),
      fonte: input.fonte,
      fornitore:
        input.fonte === "Fornitore" ? trimOrNull(input.fornitore) : null,
      costo_unitario: toNumber(input.costo_unitario, 0),
      prezzo_vendita: toNumber(input.prezzo_vendita, 0),
      consumo_per_persona: Math.max(
        0,
        toNumber(input.consumo_per_persona, 0),
      ),
      note: trimOrNull(input.note),
    })
    .eq("id", barId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("Errore update bar articolo:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }
  revalidateFB(eventoId);
  return { ok: true };
}

export async function eliminaBarR(
  eventoId: string,
  barId: string,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const sb = createServerClient();
  const { error } = await sb
    .from("evento_bar_articoli")
    .delete()
    .eq("id", barId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("Errore delete bar articolo:", error);
    return { ok: false, error: "Errore nell'eliminazione. Riprova." };
  }
  revalidateFB(eventoId);
  return { ok: true };
}

// ----- FOOD TRUCK --------------------------------------------------------

export type FoodTruckInput = {
  nome: string;
  modello: "Percentuale" | "Acquisto";
  // modello Percentuale
  incasso_lordo_stimato: string | null;
  percentuale_matazz: string | null;
  // modello Acquisto
  costo_unitario: string | null;
  prezzo_vendita: string | null;
  consumo_per_persona: string | null;
  quantita_acquistata: string | null;
  pagato_da: string | null;
  // common
  selezionata: boolean;
  note: string | null;
};

function validateFoodTruck(input: FoodTruckInput): string | null {
  if (input.nome.trim().length === 0) return "Il nome è obbligatorio.";
  if (input.modello !== "Percentuale" && input.modello !== "Acquisto")
    return "Modello non valido.";
  return null;
}

function buildFoodTruckPayload(input: FoodTruckInput) {
  const isAcquisto = input.modello === "Acquisto";
  return {
    nome: input.nome.trim(),
    modello: input.modello,
    incasso_lordo_stimato: isAcquisto
      ? 0
      : toNumber(input.incasso_lordo_stimato, 0),
    percentuale_matazz: isAcquisto
      ? 0
      : toNumber(input.percentuale_matazz, 0),
    costo_unitario: isAcquisto ? toNumber(input.costo_unitario, 0) : null,
    prezzo_vendita: isAcquisto ? toNumber(input.prezzo_vendita, 0) : null,
    consumo_per_persona: isAcquisto
      ? Math.max(0, toNumber(input.consumo_per_persona, 0))
      : 0,
    quantita_acquistata: isAcquisto
      ? Math.max(0, toNumber(input.quantita_acquistata, 0))
      : null,
    pagato_da: isAcquisto ? trimOrNull(input.pagato_da) : null,
    selezionata: input.selezionata,
    note: trimOrNull(input.note),
  };
}

export async function creaFoodTruckR(
  eventoId: string,
  input: FoodTruckInput,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const err = validateFoodTruck(input);
  if (err) return { ok: false, error: err };

  const sb = createServerClient();
  const { error } = await sb.from("evento_food_truck").insert({
    evento_id: eventoId,
    ...buildFoodTruckPayload(input),
  });

  if (error) {
    console.error("Errore crea food truck:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }
  revalidateFB(eventoId);
  return { ok: true };
}

export async function aggiornaFoodTruckR(
  eventoId: string,
  ftId: string,
  input: FoodTruckInput,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const err = validateFoodTruck(input);
  if (err) return { ok: false, error: err };

  const sb = createServerClient();
  const { error } = await sb
    .from("evento_food_truck")
    .update(buildFoodTruckPayload(input))
    .eq("id", ftId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("Errore update food truck:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }
  revalidateFB(eventoId);
  return { ok: true };
}

export async function eliminaFoodTruckR(
  eventoId: string,
  ftId: string,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const sb = createServerClient();
  const { error } = await sb
    .from("evento_food_truck")
    .delete()
    .eq("id", ftId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("Errore delete food truck:", error);
    return { ok: false, error: "Errore nell'eliminazione. Riprova." };
  }
  revalidateFB(eventoId);
  return { ok: true };
}

export async function toggleFoodTruckSelezionata(
  eventoId: string,
  ftId: string,
  selezionata: boolean,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const sb = createServerClient();
  const { error } = await sb
    .from("evento_food_truck")
    .update({ selezionata })
    .eq("id", ftId)
    .eq("evento_id", eventoId);

  if (error) return { ok: false, error: "Errore." };
  revalidateFB(eventoId);
  return { ok: true };
}
