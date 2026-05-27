"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentIdentity } from "@/lib/auth/identity";
import { createServerClient } from "@/lib/supabase/server";
import { TIPI_ARTE } from "@/lib/artisti";

export type ActionResult = { ok: true } | { ok: false; error: string };

const DOC_MANDATI_VALIDI = ["Sì", "Non ancora"] as const;

function trimOrNull(v: string | null | undefined): string | null {
  if (!v) return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function toNumberOrDefault(v: string | null | undefined, def: number): number {
  if (!v) return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

// ----- Aggiungi -----------------------------------------------------------

export async function aggiungiDaRubrica(
  eventoId: string,
  artistaId: string,
): Promise<ActionResult> {
  const me = await requireCurrentIdentity();
  if (!artistaId)
    return { ok: false, error: "Seleziona un artista dalla rubrica." };

  const sb = createServerClient();
  const { error } = await sb.from("evento_artisti").insert({
    evento_id: eventoId,
    artista_id: artistaId,
    creato_da_id: me.id,
  });

  if (error) {
    console.error("Errore aggiungi artista da rubrica:", error);
    if (error.code === "23505")
      return {
        ok: false,
        error: "Questo artista è già presente nell'evento.",
      };
    return { ok: false, error: "Errore. Riprova." };
  }

  revalidatePath(`/eventi/${eventoId}/artisti`);
  revalidatePath(`/eventi/${eventoId}`);
  return { ok: true };
}

export type NuovoArtistaInput = {
  nome: string;
  cognome: string;
  tipo_arte: string;
  residenza: string | null;
  link: string | null;
  link_opera: string | null;
  membri_extra: string | null;
  numero_persone: string | null;
};

export async function creaENuovoArtista(
  eventoId: string,
  input: NuovoArtistaInput,
): Promise<ActionResult> {
  const me = await requireCurrentIdentity();
  if (input.nome.trim().length === 0)
    return { ok: false, error: "Il nome è obbligatorio." };
  if (!(TIPI_ARTE as readonly string[]).includes(input.tipo_arte))
    return { ok: false, error: "Tipo arte obbligatorio." };

  const sb = createServerClient();

  const numPersone = (() => {
    if (!input.numero_persone) return 1;
    const n = Number.parseInt(input.numero_persone, 10);
    return Number.isFinite(n) && n >= 1 ? n : 1;
  })();

  const { data: artista, error: artErr } = await sb
    .from("artisti")
    .insert({
      nome: input.nome.trim(),
      cognome: input.cognome.trim(),
      tipo_arte: input.tipo_arte,
      residenza: trimOrNull(input.residenza),
      link: trimOrNull(input.link),
      link_opera: trimOrNull(input.link_opera),
      membri_extra: trimOrNull(input.membri_extra),
      numero_persone: numPersone,
      creato_da_id: me.id,
    })
    .select("id")
    .single();

  if (artErr || !artista) {
    console.error("Errore crea artista:", artErr);
    return { ok: false, error: "Errore nella creazione. Riprova." };
  }

  const { error: linkErr } = await sb.from("evento_artisti").insert({
    evento_id: eventoId,
    artista_id: artista.id,
    creato_da_id: me.id,
  });

  if (linkErr) {
    console.error("Errore link artista a evento:", linkErr);
    return {
      ok: false,
      error: "Artista creato ma errore nel collegamento all'evento.",
    };
  }

  revalidatePath(`/eventi/${eventoId}/artisti`);
  revalidatePath(`/eventi/${eventoId}`);
  return { ok: true };
}

// ----- Modifica / Elimina / Toggle ---------------------------------------

export type EventoArtistaInput = {
  chi_contatto_id: string | null;
  info_alloggio: string | null;
  ingombro: string | null;
  costi_produzione: string | null;
  artist_fee: string | null;
  intolleranze_cibo: string | null;
  commenti: string | null;
};

export async function aggiornaEventoArtistaR(
  eventoId: string,
  evArtId: string,
  input: EventoArtistaInput,
): Promise<ActionResult> {
  await requireCurrentIdentity();

  const sb = createServerClient();
  const { error } = await sb
    .from("evento_artisti")
    .update({
      chi_contatto_id: input.chi_contatto_id || null,
      info_alloggio: trimOrNull(input.info_alloggio),
      ingombro: trimOrNull(input.ingombro),
      costi_produzione: toNumberOrDefault(input.costi_produzione, 0),
      artist_fee: toNumberOrDefault(input.artist_fee, 0),
      intolleranze_cibo: trimOrNull(input.intolleranze_cibo),
      commenti: trimOrNull(input.commenti),
    })
    .eq("id", evArtId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("Errore update evento_artista:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }

  revalidatePath(`/eventi/${eventoId}/artisti`);
  revalidatePath(`/eventi/${eventoId}`);
  return { ok: true };
}

export async function toggleConfermaR(
  eventoId: string,
  evArtId: string,
  confermato: boolean,
): Promise<ActionResult> {
  await requireCurrentIdentity();

  const sb = createServerClient();
  const { error } = await sb
    .from("evento_artisti")
    .update({ confermato })
    .eq("id", evArtId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("Errore toggle conferma artista:", error);
    return { ok: false, error: "Errore. Riprova." };
  }

  revalidatePath(`/eventi/${eventoId}/artisti`);
  revalidatePath(`/eventi/${eventoId}`);
  return { ok: true };
}

type ToggleField =
  | "doc_info_artisti"
  | "doc_proposal"
  | "necessita_alloggio"
  | "presente_cena";

export async function toggleEventoArtistaBoolR(
  eventoId: string,
  evArtId: string,
  field: ToggleField,
  value: boolean,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const allowed: ToggleField[] = [
    "doc_info_artisti",
    "doc_proposal",
    "necessita_alloggio",
    "presente_cena",
  ];
  if (!allowed.includes(field))
    return { ok: false, error: "Campo non valido." };

  const sb = createServerClient();
  const { error } = await sb
    .from("evento_artisti")
    .update({ [field]: value })
    .eq("id", evArtId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("Errore toggle bool:", error);
    return { ok: false, error: "Errore. Riprova." };
  }
  revalidatePath(`/eventi/${eventoId}/artisti`);
  revalidatePath(`/eventi/${eventoId}/cena`);
  revalidatePath(`/eventi/${eventoId}`);
  return { ok: true };
}

export async function toggleDocMandatiR(
  eventoId: string,
  evArtId: string,
  value: "Sì" | "Non ancora",
): Promise<ActionResult> {
  await requireCurrentIdentity();
  if (!(DOC_MANDATI_VALIDI as readonly string[]).includes(value))
    return { ok: false, error: "Valore non valido." };

  const sb = createServerClient();
  const { error } = await sb
    .from("evento_artisti")
    .update({ doc_mandati: value })
    .eq("id", evArtId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("Errore toggle doc mandati:", error);
    return { ok: false, error: "Errore. Riprova." };
  }
  revalidatePath(`/eventi/${eventoId}/artisti`);
  revalidatePath(`/eventi/${eventoId}`);
  return { ok: true };
}

export async function eliminaEventoArtistaR(
  eventoId: string,
  evArtId: string,
): Promise<ActionResult> {
  await requireCurrentIdentity();

  const sb = createServerClient();
  const { error } = await sb
    .from("evento_artisti")
    .delete()
    .eq("id", evArtId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("Errore delete evento_artista:", error);
    return { ok: false, error: "Errore nella rimozione. Riprova." };
  }

  revalidatePath(`/eventi/${eventoId}/artisti`);
  revalidatePath(`/eventi/${eventoId}`);
  return { ok: true };
}
