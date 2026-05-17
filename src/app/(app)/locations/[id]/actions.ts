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

export async function aggiornaLocation(id: string, formData: FormData) {
  await requireCurrentIdentity();

  const nome = formData.get("nome");
  const citta = formData.get("citta");
  const stato = formData.get("stato");
  const indirizzo = formData.get("indirizzo");
  const capienza = formData.get("capienza");
  const contattiReferente = formData.get("contatti_referente");
  const costoTipico = formData.get("costo_tipico");
  const link = formData.get("link");
  const note = formData.get("note");

  if (typeof nome !== "string" || nome.trim().length === 0) {
    redirect(`/locations/${id}?error=nome`);
  }
  if (typeof citta !== "string" || citta.trim().length === 0) {
    redirect(`/locations/${id}?error=citta`);
  }

  const statoFinal =
    typeof stato === "string" && stato.trim().length > 0
      ? stato.trim()
      : "Svizzera";

  const sb = createServerClient();
  const { error } = await sb
    .from("locations")
    .update({
      nome: nome.trim(),
      citta: citta.trim(),
      stato: statoFinal,
      indirizzo: trimOrNull(indirizzo),
      capienza: parseOptionalInt(capienza),
      contatti_referente: trimOrNull(contattiReferente),
      costo_tipico: parseOptionalNumber(costoTipico),
      link: trimOrNull(link),
      note: trimOrNull(note),
    })
    .eq("id", id);

  if (error) {
    console.error("Errore update location:", error);
    redirect(`/locations/${id}?error=generic`);
  }

  revalidatePath("/locations");
  revalidatePath(`/locations/${id}`);
  redirect(`/locations/${id}?saved=1`);
}

export async function eliminaLocation(id: string) {
  await requireCurrentIdentity();

  const sb = createServerClient();
  const { error } = await sb.from("locations").delete().eq("id", id);

  if (error) {
    console.error("Errore delete location:", error);
    redirect(`/locations/${id}?error=delete`);
  }

  revalidatePath("/locations");
  redirect("/locations");
}
