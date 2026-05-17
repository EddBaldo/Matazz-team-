"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentIdentity } from "@/lib/auth/identity";
import { createServerClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

const STATI_VALIDI = ["In pianificazione", "Concluso"] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function trimOrNull(v: string | null): string | null {
  if (!v) return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

export type EventoInput = {
  nome: string;
  data_inizio: string;
  data_fine: string | null;
  location_id: string | null;
  stato: string;
  descrizione: string | null;
};

function validate(input: EventoInput): string | null {
  if (input.nome.trim().length === 0) return "Il nome è obbligatorio.";
  if (!DATE_RE.test(input.data_inizio))
    return "La data di inizio è obbligatoria.";
  if (input.data_fine && !DATE_RE.test(input.data_fine))
    return "Data fine non valida.";
  if (!(STATI_VALIDI as readonly string[]).includes(input.stato))
    return "Stato non valido.";
  return null;
}

export async function creaEventoR(
  input: EventoInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const me = await requireCurrentIdentity();
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const sb = createServerClient();
  const { data, error } = await sb
    .from("eventi")
    .insert({
      nome: input.nome.trim(),
      data_inizio: input.data_inizio,
      data_fine: input.data_fine || null,
      location_id: input.location_id || null,
      stato: input.stato,
      descrizione: trimOrNull(input.descrizione),
      creato_da_id: me.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Errore creazione evento:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }
  revalidatePath("/eventi");
  return { ok: true, id: data.id };
}
