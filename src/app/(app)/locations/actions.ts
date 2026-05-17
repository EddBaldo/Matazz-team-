"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentIdentity } from "@/lib/auth/identity";
import { createServerClient } from "@/lib/supabase/server";
import { normalizeStato } from "@/lib/locations";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type LocationInput = {
  nome: string;
  citta: string;
  stato: string;
  indirizzo: string | null;
  capienza: number | null;
  contatti_referente: string | null;
  costo_tipico: number | null;
  link: string | null;
  note: string | null;
};

function trimOrNull(v: string | null): string | null {
  if (!v) return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function validate(input: LocationInput): string | null {
  if (input.nome.trim().length === 0) return "Il nome è obbligatorio.";
  if (input.citta.trim().length === 0) return "La città è obbligatoria.";
  if (input.stato.trim().length === 0) return "Lo stato è obbligatorio.";
  return null;
}

export async function creaLocationR(
  input: LocationInput,
): Promise<ActionResult> {
  const me = await requireCurrentIdentity();
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const sb = createServerClient();
  const { error } = await sb.from("locations").insert({
    nome: input.nome.trim(),
    citta: input.citta.trim(),
    stato: normalizeStato(input.stato),
    indirizzo: trimOrNull(input.indirizzo),
    capienza: input.capienza,
    contatti_referente: trimOrNull(input.contatti_referente),
    costo_tipico: input.costo_tipico,
    link: trimOrNull(input.link),
    note: trimOrNull(input.note),
    creato_da_id: me.id,
  });

  if (error) {
    console.error("Errore crea location:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }

  revalidatePath("/locations");
  return { ok: true };
}

export async function aggiornaLocationR(
  id: string,
  input: LocationInput,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const sb = createServerClient();
  const { error } = await sb
    .from("locations")
    .update({
      nome: input.nome.trim(),
      citta: input.citta.trim(),
      stato: normalizeStato(input.stato),
      indirizzo: trimOrNull(input.indirizzo),
      capienza: input.capienza,
      contatti_referente: trimOrNull(input.contatti_referente),
      costo_tipico: input.costo_tipico,
      link: trimOrNull(input.link),
      note: trimOrNull(input.note),
    })
    .eq("id", id);

  if (error) {
    console.error("Errore update location:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }

  revalidatePath("/locations");
  revalidatePath(`/locations/${id}`);
  return { ok: true };
}

export async function eliminaLocationR(id: string): Promise<ActionResult> {
  await requireCurrentIdentity();

  const sb = createServerClient();
  const { error } = await sb.from("locations").delete().eq("id", id);

  if (error) {
    console.error("Errore delete location:", error);
    if (error.code === "23503")
      return {
        ok: false,
        error:
          "Questa location è ancora usata da uno o più eventi. Rimuovila prima dagli eventi.",
      };
    return { ok: false, error: "Errore nell'eliminazione. Riprova." };
  }

  revalidatePath("/locations");
  return { ok: true };
}
