"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentIdentity } from "@/lib/auth/identity";
import { createServerClient } from "@/lib/supabase/server";
import { TIPI_SPONSOR } from "./constants";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type SponsorInput = {
  nome: string;
  tipo: string;
  contatto: string | null;
  indirizzo: string | null;
  telefono: string | null;
  sito_web: string | null;
  note: string | null;
};

function trimOrNull(v: string | null): string | null {
  if (!v) return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function validate(input: SponsorInput): string | null {
  if (input.nome.trim().length === 0)
    return "Il nome dello sponsor è obbligatorio.";
  if (!(TIPI_SPONSOR as readonly string[]).includes(input.tipo))
    return "Tipo non valido.";
  return null;
}

export async function creaSponsorR(
  input: SponsorInput,
): Promise<ActionResult> {
  const me = await requireCurrentIdentity();
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const sb = createServerClient();
  const { error } = await sb.from("sponsor").insert({
    nome: input.nome.trim(),
    tipo: input.tipo,
    contatto: trimOrNull(input.contatto),
    indirizzo: trimOrNull(input.indirizzo),
    telefono: trimOrNull(input.telefono),
    sito_web: trimOrNull(input.sito_web),
    note: trimOrNull(input.note),
    creato_da_id: me.id,
  });

  if (error) {
    console.error("Errore crea sponsor:", error);
    if (error.code === "23505")
      return { ok: false, error: "Esiste già uno sponsor con questo nome." };
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }
  revalidatePath("/sponsor");
  return { ok: true };
}

export async function aggiornaSponsorR(
  id: string,
  input: SponsorInput,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const sb = createServerClient();
  const { error } = await sb
    .from("sponsor")
    .update({
      nome: input.nome.trim(),
      tipo: input.tipo,
      contatto: trimOrNull(input.contatto),
      indirizzo: trimOrNull(input.indirizzo),
      telefono: trimOrNull(input.telefono),
      sito_web: trimOrNull(input.sito_web),
      note: trimOrNull(input.note),
    })
    .eq("id", id);

  if (error) {
    console.error("Errore update sponsor:", error);
    if (error.code === "23505")
      return { ok: false, error: "Esiste già uno sponsor con questo nome." };
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }
  revalidatePath("/sponsor");
  return { ok: true };
}

export async function eliminaSponsorR(id: string): Promise<ActionResult> {
  await requireCurrentIdentity();
  const sb = createServerClient();
  const { error } = await sb.from("sponsor").delete().eq("id", id);

  if (error) {
    console.error("Errore delete sponsor:", error);
    if (error.code === "23503")
      return {
        ok: false,
        error:
          "Questo sponsor è ancora collegato a uno o più eventi. Rimuovilo dagli eventi prima.",
      };
    return { ok: false, error: "Errore nell'eliminazione. Riprova." };
  }
  revalidatePath("/sponsor");
  return { ok: true };
}
