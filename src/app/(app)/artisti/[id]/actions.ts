"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireCurrentIdentity } from "@/lib/auth/identity";
import { createServerClient } from "@/lib/supabase/server";
import { TIPI_ARTE } from "@/lib/artisti";

function trimOrNull(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

export async function aggiornaArtista(id: string, formData: FormData) {
  await requireCurrentIdentity();

  const nome = formData.get("nome");
  const cognome = formData.get("cognome");
  const tipoArte = formData.get("tipo_arte");
  const residenza = formData.get("residenza");
  const link = formData.get("link");
  const linkOpera = formData.get("link_opera");

  if (
    typeof nome !== "string" ||
    nome.trim().length === 0 ||
    typeof cognome !== "string" ||
    cognome.trim().length === 0
  ) {
    redirect(`/artisti/${id}?error=nome`);
  }
  if (
    typeof tipoArte !== "string" ||
    !(TIPI_ARTE as readonly string[]).includes(tipoArte)
  ) {
    redirect(`/artisti/${id}?error=tipo`);
  }

  const sb = createServerClient();
  const { error } = await sb
    .from("artisti")
    .update({
      nome: nome.trim(),
      cognome: cognome.trim(),
      tipo_arte: tipoArte,
      residenza: trimOrNull(residenza),
      link: trimOrNull(link),
      link_opera: trimOrNull(linkOpera),
    })
    .eq("id", id);

  if (error) {
    console.error("Errore update artista:", error);
    redirect(`/artisti/${id}?error=generic`);
  }

  revalidatePath("/artisti");
  revalidatePath(`/artisti/${id}`);
  redirect(`/artisti/${id}?saved=1`);
}

export async function eliminaArtista(id: string) {
  await requireCurrentIdentity();

  const sb = createServerClient();
  const { error } = await sb.from("artisti").delete().eq("id", id);

  if (error) {
    console.error("Errore delete artista:", error);
    if (error.code === "23503") {
      redirect(`/artisti/${id}?error=in_uso`);
    }
    redirect(`/artisti/${id}?error=delete`);
  }

  revalidatePath("/artisti");
  redirect("/artisti");
}

export async function aggiungiInteresseEvento(
  artistaId: string,
  formData: FormData,
) {
  const me = await requireCurrentIdentity();
  const eventoId = formData.get("evento_id");
  if (typeof eventoId !== "string" || eventoId.length === 0) {
    redirect(`/artisti/${artistaId}`);
  }

  const sb = createServerClient();
  const { error } = await sb.from("artisti_eventi_interesse").insert({
    artista_id: artistaId,
    evento_id: eventoId,
    creato_da_id: me.id,
  });

  if (error) {
    console.error("Errore aggiungi interesse:", error);
    redirect(`/artisti/${artistaId}?error=interesse`);
  }

  revalidatePath(`/artisti/${artistaId}`);
  revalidatePath(`/eventi/${eventoId}`);
  redirect(`/artisti/${artistaId}`);
}

export async function rimuoviInteresseEvento(
  artistaId: string,
  interesseId: string,
) {
  await requireCurrentIdentity();

  const sb = createServerClient();
  const { data: row } = await sb
    .from("artisti_eventi_interesse")
    .select("evento_id")
    .eq("id", interesseId)
    .maybeSingle();

  const { error } = await sb
    .from("artisti_eventi_interesse")
    .delete()
    .eq("id", interesseId);

  if (error) {
    console.error("Errore rimuovi interesse:", error);
    redirect(`/artisti/${artistaId}?error=interesse`);
  }

  revalidatePath(`/artisti/${artistaId}`);
  if (row?.evento_id) revalidatePath(`/eventi/${row.evento_id}`);
  redirect(`/artisti/${artistaId}`);
}
