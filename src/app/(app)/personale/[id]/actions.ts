"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireCurrentIdentity } from "@/lib/auth/identity";
import { createServerClient } from "@/lib/supabase/server";
import { CATEGORIE_PERSONALE } from "@/lib/personale";

function parseOptionalNumber(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string" || v.trim().length === 0) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function trimOrNull(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

export async function aggiornaPersonale(id: string, formData: FormData) {
  await requireCurrentIdentity();

  const nome = formData.get("nome");
  const cognome = formData.get("cognome");
  const ruoloPrincipale = formData.get("ruolo_principale");
  const categoria = formData.get("categoria");
  const contatti = formData.get("contatti");
  const tariffaTipica = formData.get("tariffa_tipica");
  const note = formData.get("note");

  if (
    typeof nome !== "string" ||
    nome.trim().length === 0 ||
    typeof cognome !== "string" ||
    cognome.trim().length === 0
  ) {
    redirect(`/personale/${id}?error=nome`);
  }
  if (typeof ruoloPrincipale !== "string" || ruoloPrincipale.trim().length === 0) {
    redirect(`/personale/${id}?error=ruolo`);
  }
  if (
    typeof categoria !== "string" ||
    !(CATEGORIE_PERSONALE as readonly string[]).includes(categoria)
  ) {
    redirect(`/personale/${id}?error=categoria`);
  }

  const sb = createServerClient();
  const { error } = await sb
    .from("personale_esterno")
    .update({
      nome: nome.trim(),
      cognome: cognome.trim(),
      ruolo_principale: ruoloPrincipale.trim(),
      categoria,
      contatti: trimOrNull(contatti),
      tariffa_tipica: parseOptionalNumber(tariffaTipica),
      note: trimOrNull(note),
    })
    .eq("id", id);

  if (error) {
    console.error("Errore update personale:", error);
    redirect(`/personale/${id}?error=generic`);
  }

  revalidatePath("/personale");
  revalidatePath(`/personale/${id}`);
  redirect(`/personale/${id}?saved=1`);
}

export async function eliminaPersonale(id: string) {
  await requireCurrentIdentity();

  const sb = createServerClient();
  const { error } = await sb.from("personale_esterno").delete().eq("id", id);

  if (error) {
    console.error("Errore delete personale:", error);
    if (error.code === "23503") {
      redirect(`/personale/${id}?error=in_uso`);
    }
    redirect(`/personale/${id}?error=delete`);
  }

  revalidatePath("/personale");
  redirect("/personale");
}
