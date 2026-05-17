"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentIdentity } from "@/lib/auth/identity";
import { createServerClient } from "@/lib/supabase/server";
import { STATI_SPONSOR } from "./constants";

export type ActionResult = { ok: true } | { ok: false; error: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

function revalidateSp(eventoId: string) {
  revalidatePath(`/eventi/${eventoId}`);
  revalidatePath(`/eventi/${eventoId}/sponsor`);
}

export async function aggiungiSponsorR(
  eventoId: string,
  sponsorId: string,
): Promise<ActionResult> {
  const me = await requireCurrentIdentity();
  if (!sponsorId) return { ok: false, error: "Seleziona uno sponsor." };

  const sb = createServerClient();
  const { error } = await sb.from("evento_sponsor").insert({
    evento_id: eventoId,
    sponsor_id: sponsorId,
    creato_da_id: me.id,
  });

  if (error) {
    console.error("Errore aggiungi sponsor a evento:", error);
    if (error.code === "23505")
      return { ok: false, error: "Sponsor già collegato a questo evento." };
    return { ok: false, error: "Errore. Riprova." };
  }
  revalidateSp(eventoId);
  return { ok: true };
}

export type EventoSponsorInput = {
  chi_contatto_id: string | null;
  stato: string;
  importo: string | null;
  data_contatto: string | null;
  note: string | null;
};

function validateEvSp(input: EventoSponsorInput): string | null {
  if (!(STATI_SPONSOR as readonly string[]).includes(input.stato))
    return "Stato non valido.";
  if (input.data_contatto && !DATE_RE.test(input.data_contatto))
    return "Data contatto non valida.";
  return null;
}

export async function aggiornaEventoSponsorR(
  eventoId: string,
  evSpId: string,
  input: EventoSponsorInput,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const err = validateEvSp(input);
  if (err) return { ok: false, error: err };

  const sb = createServerClient();
  const { error } = await sb
    .from("evento_sponsor")
    .update({
      chi_contatto_id: input.chi_contatto_id || null,
      stato: input.stato,
      importo: toNumber(input.importo, 0),
      data_contatto: input.data_contatto || null,
      note: trimOrNull(input.note),
    })
    .eq("id", evSpId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("Errore update evento_sponsor:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }
  revalidateSp(eventoId);
  return { ok: true };
}

export async function eliminaEventoSponsorR(
  eventoId: string,
  evSpId: string,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const sb = createServerClient();
  const { error } = await sb
    .from("evento_sponsor")
    .delete()
    .eq("id", evSpId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("Errore delete evento_sponsor:", error);
    return { ok: false, error: "Errore nella rimozione. Riprova." };
  }
  revalidateSp(eventoId);
  return { ok: true };
}
