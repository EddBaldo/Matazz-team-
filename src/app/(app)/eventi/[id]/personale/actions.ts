"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentIdentity } from "@/lib/auth/identity";
import { createServerClient } from "@/lib/supabase/server";
import { CATEGORIE_PERSONALE } from "@/lib/personale";

export type ActionResult = { ok: true } | { ok: false; error: string };

function trimOrNull(v: string | null): string | null {
  if (!v) return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function toNumberOrNull(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function revalidatePers(eventoId: string) {
  revalidatePath(`/eventi/${eventoId}`);
  revalidatePath(`/eventi/${eventoId}/personale`);
  revalidatePath(`/eventi/${eventoId}/cena`);
}

// ----- AGGIUNGI ----------------------------------------------------------

export async function aggiungiPersonaleR(
  eventoId: string,
  personaleId: string,
): Promise<ActionResult> {
  const me = await requireCurrentIdentity();
  if (!personaleId) return { ok: false, error: "Seleziona una persona." };

  const sb = createServerClient();
  const { error } = await sb.from("evento_personale").insert({
    evento_id: eventoId,
    personale_id: personaleId,
    creato_da_id: me.id,
  });

  if (error) {
    console.error("Errore aggiungi personale:", error);
    if (error.code === "23505")
      return {
        ok: false,
        error: "Questa persona è già collegata all'evento.",
      };
    return { ok: false, error: "Errore. Riprova." };
  }
  revalidatePers(eventoId);
  return { ok: true };
}

export type NuovaPersonaInput = {
  nome: string;
  cognome: string;
  categoria: string;
  ruolo_principale: string;
  contatti: string | null;
  tariffa_tipica: string | null;
};

export async function creaENuovaPersona(
  eventoId: string,
  input: NuovaPersonaInput,
): Promise<ActionResult> {
  const me = await requireCurrentIdentity();
  if (input.nome.trim().length === 0 || input.cognome.trim().length === 0)
    return { ok: false, error: "Nome e cognome sono obbligatori." };
  if (!(CATEGORIE_PERSONALE as readonly string[]).includes(input.categoria))
    return { ok: false, error: "Categoria non valida." };
  if (input.ruolo_principale.trim().length === 0)
    return { ok: false, error: "Il ruolo principale è obbligatorio." };

  const sb = createServerClient();
  const { data: persona, error: persErr } = await sb
    .from("personale_esterno")
    .insert({
      nome: input.nome.trim(),
      cognome: input.cognome.trim(),
      categoria: input.categoria,
      ruolo_principale: input.ruolo_principale.trim(),
      contatti: trimOrNull(input.contatti),
      tariffa_tipica: toNumberOrNull(input.tariffa_tipica) ?? 0,
      creato_da_id: me.id,
    })
    .select("id")
    .single();

  if (persErr || !persona) {
    console.error("Errore crea persona:", persErr);
    return { ok: false, error: "Errore nella creazione. Riprova." };
  }

  const { error: linkErr } = await sb.from("evento_personale").insert({
    evento_id: eventoId,
    personale_id: persona.id,
    creato_da_id: me.id,
  });

  if (linkErr) {
    console.error("Errore link persona a evento:", linkErr);
    return {
      ok: false,
      error: "Persona creata ma errore nel collegamento all'evento.",
    };
  }

  revalidatePers(eventoId);
  return { ok: true };
}

// ----- MODIFICA / ELIMINA -----------------------------------------------

export type EventoPersonaleInput = {
  ruolo_specifico: string | null;
  presenza: string | null;
  compenso: string | null;
  costi_trasporto: string | null;
  note: string | null;
  intolleranze_cibo: string | null;
};

export async function aggiornaEventoPersonaleR(
  eventoId: string,
  evPersId: string,
  input: EventoPersonaleInput,
): Promise<ActionResult> {
  await requireCurrentIdentity();

  const sb = createServerClient();
  const { error } = await sb
    .from("evento_personale")
    .update({
      ruolo_specifico: trimOrNull(input.ruolo_specifico),
      presenza: trimOrNull(input.presenza),
      compenso: toNumberOrNull(input.compenso),
      costi_trasporto: toNumberOrNull(input.costi_trasporto),
      note: trimOrNull(input.note),
      intolleranze_cibo: trimOrNull(input.intolleranze_cibo),
    })
    .eq("id", evPersId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("Errore update evento_personale:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }
  revalidatePers(eventoId);
  return { ok: true };
}

export async function eliminaEventoPersonaleR(
  eventoId: string,
  evPersId: string,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const sb = createServerClient();
  const { error } = await sb
    .from("evento_personale")
    .delete()
    .eq("id", evPersId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("Errore delete evento_personale:", error);
    return { ok: false, error: "Errore nella rimozione. Riprova." };
  }
  revalidatePers(eventoId);
  return { ok: true };
}

export async function toggleConfermaPersonaleR(
  eventoId: string,
  evPersId: string,
  confermato: boolean,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const sb = createServerClient();
  const { error } = await sb
    .from("evento_personale")
    .update({ confermato })
    .eq("id", evPersId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("Errore toggle conferma personale:", error);
    return { ok: false, error: "Errore. Riprova." };
  }
  revalidatePers(eventoId);
  return { ok: true };
}

export async function togglePresenteCenaPersonaleR(
  eventoId: string,
  evPersId: string,
  presente: boolean,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const sb = createServerClient();
  const { error } = await sb
    .from("evento_personale")
    .update({ presente_cena: presente })
    .eq("id", evPersId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("Errore toggle presente_cena personale:", error);
    return { ok: false, error: "Errore. Riprova." };
  }
  revalidatePers(eventoId);
  return { ok: true };
}
