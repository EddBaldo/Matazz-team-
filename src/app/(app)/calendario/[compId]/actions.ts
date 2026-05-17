"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireCurrentIdentity } from "@/lib/auth/identity";
import { createServerClient } from "@/lib/supabase/server";
import { CATEGORIE_COMPITI } from "@/lib/compiti";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(?::\d{2})?$/;

function trimOrNull(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

async function eventoIdOf(compId: string): Promise<string | null> {
  const sb = createServerClient();
  const { data } = await sb
    .from("compiti")
    .select("evento_id")
    .eq("id", compId)
    .maybeSingle();
  return data?.evento_id ?? null;
}

export async function aggiornaCompito(compId: string, formData: FormData) {
  await requireCurrentIdentity();

  const titolo = formData.get("titolo");
  const data = formData.get("data");
  const dataFine = formData.get("data_fine");
  const ora = formData.get("ora");
  const categoria = formData.get("categoria");
  const assegnatoA = formData.get("assegnato_a_id");
  const eventoIdField = formData.get("evento_id");
  const descrizione = formData.get("descrizione");
  const fatto = formData.get("fatto") === "on";

  if (typeof titolo !== "string" || titolo.trim().length === 0) {
    redirect(`/calendario/${compId}?error=titolo`);
  }
  if (typeof data !== "string" || !DATE_RE.test(data)) {
    redirect(`/calendario/${compId}?error=data`);
  }
  const categoriaValida =
    typeof categoria === "string" &&
    (CATEGORIE_COMPITI as readonly string[]).includes(categoria)
      ? categoria
      : null;
  const dataFineValida =
    typeof dataFine === "string" && DATE_RE.test(dataFine) && dataFine > data
      ? dataFine
      : null;

  const sb = createServerClient();
  const { error } = await sb
    .from("compiti")
    .update({
      titolo: titolo.trim(),
      data,
      data_fine: dataFineValida,
      ora: typeof ora === "string" && TIME_RE.test(ora) ? ora : null,
      categoria: categoriaValida,
      assegnato_a_id:
        typeof assegnatoA === "string" && assegnatoA.length > 0
          ? assegnatoA
          : null,
      evento_id:
        typeof eventoIdField === "string" && eventoIdField.length > 0
          ? eventoIdField
          : null,
      descrizione: trimOrNull(descrizione),
      fatto,
    })
    .eq("id", compId);

  if (error) {
    console.error("Errore update compito:", error);
    redirect(`/calendario/${compId}?error=generic`);
  }

  revalidatePath("/calendario");
  revalidatePath(`/calendario/${compId}`);
  if (typeof eventoIdField === "string" && eventoIdField.length > 0) {
    revalidatePath(`/eventi/${eventoIdField}/compiti`);
  }
  redirect(`/calendario/${compId}?saved=1`);
}

export async function eliminaCompito(compId: string) {
  await requireCurrentIdentity();
  const prevEventoId = await eventoIdOf(compId);

  const sb = createServerClient();
  const { error } = await sb.from("compiti").delete().eq("id", compId);

  if (error) {
    console.error("Errore delete compito:", error);
    redirect(`/calendario/${compId}?error=delete`);
  }

  revalidatePath("/calendario");
  if (prevEventoId) revalidatePath(`/eventi/${prevEventoId}/compiti`);
  redirect("/calendario");
}

export async function toggleFatto(compId: string, fatto: boolean) {
  await requireCurrentIdentity();
  const eventoId = await eventoIdOf(compId);

  const sb = createServerClient();
  const { error } = await sb
    .from("compiti")
    .update({ fatto })
    .eq("id", compId);

  if (error) {
    console.error("Errore toggle fatto:", error);
    return;
  }

  revalidatePath("/calendario");
  if (eventoId) revalidatePath(`/eventi/${eventoId}/compiti`);
}
