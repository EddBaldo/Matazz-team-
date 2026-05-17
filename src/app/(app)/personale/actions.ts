"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentIdentity } from "@/lib/auth/identity";
import { createServerClient } from "@/lib/supabase/server";
import { CATEGORIE_PERSONALE } from "@/lib/personale";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type PersonaleInput = {
  nome: string;
  cognome: string;
  ruolo_principale: string;
  categoria: string;
  contatti: string | null;
  note: string | null;
};

function trimOrNull(v: string | null): string | null {
  if (!v) return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function validate(input: PersonaleInput): string | null {
  if (input.nome.trim().length === 0 || input.cognome.trim().length === 0)
    return "Nome e cognome sono obbligatori.";
  if (input.ruolo_principale.trim().length === 0)
    return "Il ruolo principale è obbligatorio.";
  if (!(CATEGORIE_PERSONALE as readonly string[]).includes(input.categoria))
    return "Seleziona una categoria.";
  return null;
}

export async function creaPersonaleR(
  input: PersonaleInput,
): Promise<ActionResult> {
  const me = await requireCurrentIdentity();
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const sb = createServerClient();
  const { error } = await sb.from("personale_esterno").insert({
    nome: input.nome.trim(),
    cognome: input.cognome.trim(),
    ruolo_principale: input.ruolo_principale.trim(),
    categoria: input.categoria,
    contatti: trimOrNull(input.contatti),
    note: trimOrNull(input.note),
    creato_da_id: me.id,
  });

  if (error) {
    console.error("Errore crea personale:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }

  revalidatePath("/personale");
  return { ok: true };
}

export async function aggiornaPersonaleR(
  id: string,
  input: PersonaleInput,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const sb = createServerClient();
  const { error } = await sb
    .from("personale_esterno")
    .update({
      nome: input.nome.trim(),
      cognome: input.cognome.trim(),
      ruolo_principale: input.ruolo_principale.trim(),
      categoria: input.categoria,
      contatti: trimOrNull(input.contatti),
      note: trimOrNull(input.note),
    })
    .eq("id", id);

  if (error) {
    console.error("Errore update personale:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }

  revalidatePath("/personale");
  revalidatePath(`/personale/${id}`);
  return { ok: true };
}

export async function eliminaPersonaleR(id: string): Promise<ActionResult> {
  await requireCurrentIdentity();

  const sb = createServerClient();
  const { error } = await sb.from("personale_esterno").delete().eq("id", id);

  if (error) {
    console.error("Errore delete personale:", error);
    if (error.code === "23503")
      return {
        ok: false,
        error:
          "Questa persona è ancora collegata a uno o più eventi. Rimuovila dagli eventi prima.",
      };
    return { ok: false, error: "Errore nell'eliminazione. Riprova." };
  }

  revalidatePath("/personale");
  return { ok: true };
}
