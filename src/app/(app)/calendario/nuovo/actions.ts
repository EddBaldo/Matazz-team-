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

export async function creaCompitoGlobale(formData: FormData) {
  const me = await requireCurrentIdentity();

  const titolo = formData.get("titolo");
  const data = formData.get("data");
  const dataFine = formData.get("data_fine");
  const ora = formData.get("ora");
  const categoria = formData.get("categoria");
  const assegnatoA = formData.get("assegnato_a_id");
  const eventoId = formData.get("evento_id");
  const descrizione = formData.get("descrizione");

  if (typeof titolo !== "string" || titolo.trim().length === 0) {
    redirect("/calendario/nuovo?error=titolo");
  }
  if (typeof data !== "string" || !DATE_RE.test(data)) {
    redirect("/calendario/nuovo?error=data");
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
  const { error } = await sb.from("compiti").insert({
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
      typeof eventoId === "string" && eventoId.length > 0 ? eventoId : null,
    descrizione: trimOrNull(descrizione),
    creato_da_id: me.id,
  });

  if (error) {
    console.error("Errore crea compito globale:", error);
    redirect("/calendario/nuovo?error=generic");
  }

  revalidatePath("/calendario");
  if (typeof eventoId === "string" && eventoId.length > 0) {
    revalidatePath(`/eventi/${eventoId}/compiti`);
  }
  redirect("/calendario");
}
