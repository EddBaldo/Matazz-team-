"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireCurrentIdentity } from "@/lib/auth/identity";
import { createServerClient } from "@/lib/supabase/server";

function parseOptionalNumber(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string" || v.trim().length === 0) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseOptionalInt(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string" || v.trim().length === 0) return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function trimOrNull(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

export async function creaLocation(formData: FormData) {
  const nome = formData.get("nome");
  const citta = formData.get("citta");
  const indirizzo = formData.get("indirizzo");
  const capienza = formData.get("capienza");
  const contattiReferente = formData.get("contatti_referente");
  const costoTipico = formData.get("costo_tipico");
  const link = formData.get("link");
  const note = formData.get("note");

  if (typeof nome !== "string" || nome.trim().length === 0) {
    redirect("/locations/nuova?error=nome");
  }
  if (typeof citta !== "string" || citta.trim().length === 0) {
    redirect("/locations/nuova?error=citta");
  }

  const me = await requireCurrentIdentity();

  const sb = createServerClient();
  const { error } = await sb.from("locations").insert({
    nome: nome.trim(),
    citta: citta.trim(),
    indirizzo: trimOrNull(indirizzo),
    capienza: parseOptionalInt(capienza),
    contatti_referente: trimOrNull(contattiReferente),
    costo_tipico: parseOptionalNumber(costoTipico),
    link: trimOrNull(link),
    note: trimOrNull(note),
    creato_da_id: me.id,
  });

  if (error) {
    console.error("Errore creazione location:", error);
    redirect("/locations/nuova?error=generic");
  }

  revalidatePath("/locations");
  redirect("/locations");
}
