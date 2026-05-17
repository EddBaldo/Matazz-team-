"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentIdentity } from "@/lib/auth/identity";
import { createServerClient } from "@/lib/supabase/server";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;

export type ActionResult = { ok: true } | { ok: false; error: string };

export type GiornataInput = {
  data: string;
  descrizione: string | null;
};

export type VoceProgrammaInput = {
  ora_inizio: string | null;
  ora_fine: string | null;
  titolo: string;
  descrizione: string | null;
  artista_id: string | null;
};

function timeOrNull(v: string | null): string | null {
  if (!v) return null;
  const t = v.trim();
  if (t.length === 0) return null;
  return TIME_RE.test(t) ? t : null;
}

function trimOrNull(v: string | null): string | null {
  if (!v) return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

// ----- Giornate ---------------------------------------------------------

export async function creaGiornata(
  eventoId: string,
  input: GiornataInput,
): Promise<ActionResult> {
  const me = await requireCurrentIdentity();
  if (!DATE_RE.test(input.data))
    return { ok: false, error: "La data è obbligatoria." };

  const sb = createServerClient();
  const { error } = await sb.from("evento_giornate").insert({
    evento_id: eventoId,
    data: input.data,
    descrizione: trimOrNull(input.descrizione),
    creato_da_id: me.id,
  });

  if (error) {
    console.error("Errore crea giornata:", error);
    if (error.code === "23505")
      return { ok: false, error: "Esiste già una giornata con questa data." };
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }

  revalidatePath(`/eventi/${eventoId}`);
  revalidatePath(`/eventi/${eventoId}/programma`);
  return { ok: true };
}

export async function aggiornaGiornata(
  eventoId: string,
  giornataId: string,
  input: GiornataInput,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  if (!DATE_RE.test(input.data))
    return { ok: false, error: "La data è obbligatoria." };

  const sb = createServerClient();
  const { error } = await sb
    .from("evento_giornate")
    .update({
      data: input.data,
      descrizione: trimOrNull(input.descrizione),
    })
    .eq("id", giornataId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("Errore update giornata:", error);
    if (error.code === "23505")
      return { ok: false, error: "Esiste già una giornata con questa data." };
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }

  revalidatePath(`/eventi/${eventoId}`);
  revalidatePath(`/eventi/${eventoId}/programma`);
  return { ok: true };
}

export async function eliminaGiornata(
  eventoId: string,
  giornataId: string,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const sb = createServerClient();
  const { error } = await sb
    .from("evento_giornate")
    .delete()
    .eq("id", giornataId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("Errore delete giornata:", error);
    return { ok: false, error: "Errore nell'eliminazione. Riprova." };
  }

  revalidatePath(`/eventi/${eventoId}`);
  revalidatePath(`/eventi/${eventoId}/programma`);
  return { ok: true };
}

// ----- Voci -------------------------------------------------------------

export async function creaVoce(
  eventoId: string,
  giornataId: string,
  input: VoceProgrammaInput,
): Promise<ActionResult> {
  const me = await requireCurrentIdentity();
  if (input.titolo.trim().length === 0)
    return { ok: false, error: "Il titolo è obbligatorio." };

  const sb = createServerClient();
  const { error } = await sb.from("evento_programma").insert({
    evento_id: eventoId,
    giornata_id: giornataId,
    ora_inizio: timeOrNull(input.ora_inizio),
    ora_fine: timeOrNull(input.ora_fine),
    titolo: input.titolo.trim(),
    descrizione: trimOrNull(input.descrizione),
    artista_id: input.artista_id || null,
    creato_da_id: me.id,
  });

  if (error) {
    console.error("Errore crea voce programma:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }

  revalidatePath(`/eventi/${eventoId}`);
  revalidatePath(`/eventi/${eventoId}/programma`);
  return { ok: true };
}

export async function aggiornaVoce(
  eventoId: string,
  progId: string,
  input: VoceProgrammaInput,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  if (input.titolo.trim().length === 0)
    return { ok: false, error: "Il titolo è obbligatorio." };

  const sb = createServerClient();
  const { error } = await sb
    .from("evento_programma")
    .update({
      ora_inizio: timeOrNull(input.ora_inizio),
      ora_fine: timeOrNull(input.ora_fine),
      titolo: input.titolo.trim(),
      descrizione: trimOrNull(input.descrizione),
      artista_id: input.artista_id || null,
    })
    .eq("id", progId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("Errore update voce programma:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }

  revalidatePath(`/eventi/${eventoId}`);
  revalidatePath(`/eventi/${eventoId}/programma`);
  return { ok: true };
}

export async function eliminaVoce(
  eventoId: string,
  progId: string,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const sb = createServerClient();
  const { error } = await sb
    .from("evento_programma")
    .delete()
    .eq("id", progId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("Errore delete voce programma:", error);
    return { ok: false, error: "Errore nell'eliminazione. Riprova." };
  }

  revalidatePath(`/eventi/${eventoId}`);
  revalidatePath(`/eventi/${eventoId}/programma`);
  return { ok: true };
}
