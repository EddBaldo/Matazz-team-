"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireCurrentIdentity } from "@/lib/auth/identity";
import { createServerClient } from "@/lib/supabase/server";

const STATI_VALIDI = ["In pianificazione", "Concluso"] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function aggiornaEvento(id: string, formData: FormData) {
  await requireCurrentIdentity();

  const nome = formData.get("nome");
  const dataInizio = formData.get("data_inizio");
  const dataFine = formData.get("data_fine");
  const locationId = formData.get("location_id");
  const stato = formData.get("stato");
  const descrizione = formData.get("descrizione");

  if (typeof nome !== "string" || nome.trim().length === 0) {
    redirect(`/eventi/${id}/modifica?error=nome`);
  }
  if (typeof dataInizio !== "string" || !DATE_RE.test(dataInizio)) {
    redirect(`/eventi/${id}/modifica?error=data`);
  }
  if (
    typeof stato !== "string" ||
    !(STATI_VALIDI as readonly string[]).includes(stato)
  ) {
    redirect(`/eventi/${id}/modifica?error=stato`);
  }

  const sb = createServerClient();
  const { error } = await sb
    .from("eventi")
    .update({
      nome: nome.trim(),
      data_inizio: dataInizio,
      data_fine:
        typeof dataFine === "string" && DATE_RE.test(dataFine)
          ? dataFine
          : null,
      location_id:
        typeof locationId === "string" && locationId.length > 0
          ? locationId
          : null,
      stato,
      descrizione:
        typeof descrizione === "string" && descrizione.trim().length > 0
          ? descrizione.trim()
          : null,
    })
    .eq("id", id);

  if (error) {
    console.error("Errore update evento:", error);
    redirect(`/eventi/${id}/modifica?error=generic`);
  }

  revalidatePath(`/eventi/${id}`);
  revalidatePath("/eventi");
  revalidatePath("/");
  redirect(`/eventi/${id}/modifica?saved=1`);
}

export async function eliminaEvento(id: string) {
  await requireCurrentIdentity();

  const sb = createServerClient();
  const { error } = await sb.from("eventi").delete().eq("id", id);

  if (error) {
    console.error("Errore delete evento:", error);
    redirect(`/eventi/${id}/modifica?error=delete`);
  }

  revalidatePath("/eventi");
  revalidatePath("/");
  redirect("/eventi");
}
