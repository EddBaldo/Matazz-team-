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

export async function creaPersonale(formData: FormData) {
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
    redirect("/personale/nuovo?error=nome");
  }
  if (typeof ruoloPrincipale !== "string" || ruoloPrincipale.trim().length === 0) {
    redirect("/personale/nuovo?error=ruolo");
  }
  if (
    typeof categoria !== "string" ||
    !(CATEGORIE_PERSONALE as readonly string[]).includes(categoria)
  ) {
    redirect("/personale/nuovo?error=categoria");
  }

  const me = await requireCurrentIdentity();

  const sb = createServerClient();
  const { error } = await sb.from("personale_esterno").insert({
    nome: nome.trim(),
    cognome: cognome.trim(),
    ruolo_principale: ruoloPrincipale.trim(),
    categoria,
    contatti: trimOrNull(contatti),
    tariffa_tipica: parseOptionalNumber(tariffaTipica),
    note: trimOrNull(note),
    creato_da_id: me.id,
  });

  if (error) {
    console.error("Errore creazione personale:", error);
    redirect("/personale/nuovo?error=generic");
  }

  revalidatePath("/personale");
  redirect("/personale");
}
