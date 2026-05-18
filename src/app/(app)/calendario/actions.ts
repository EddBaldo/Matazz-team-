"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentIdentity } from "@/lib/auth/identity";
import { createServerClient } from "@/lib/supabase/server";
import { CATEGORIE_COMPITI } from "@/lib/compiti";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type CompitoInput = {
  titolo: string;
  data: string;
  data_fine: string | null;
  ora: string | null;
  categoria: string | null;
  assegnato_a_id: string | null;
  assegnato_personale_id: string | null;
  evento_id: string | null;
  descrizione: string | null;
  fatto: boolean;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(?::\d{2})?$/;

function trimOrNull(v: string | null): string | null {
  if (!v) return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function normalizeInput(input: CompitoInput) {
  const categoria =
    input.categoria &&
    (CATEGORIE_COMPITI as readonly string[]).includes(input.categoria)
      ? input.categoria
      : null;
  const dataFine =
    input.data_fine && DATE_RE.test(input.data_fine) && input.data_fine > input.data
      ? input.data_fine
      : null;
  const ora = input.ora && TIME_RE.test(input.ora) ? input.ora : null;
  return { ...input, categoria, data_fine: dataFine, ora };
}

function validate(input: CompitoInput): string | null {
  if (input.titolo.trim().length === 0) return "Il titolo è obbligatorio.";
  if (!DATE_RE.test(input.data)) return "Data non valida.";
  return null;
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

export async function creaCompitoR(
  input: CompitoInput,
): Promise<ActionResult> {
  const me = await requireCurrentIdentity();
  const err = validate(input);
  if (err) return { ok: false, error: err };
  const n = normalizeInput(input);

  const sb = createServerClient();
  const { error } = await sb.from("compiti").insert({
    titolo: n.titolo.trim(),
    data: n.data,
    data_fine: n.data_fine,
    ora: n.ora,
    categoria: n.categoria,
    assegnato_a_id: n.assegnato_a_id,
    assegnato_personale_id: n.assegnato_personale_id,
    evento_id: n.evento_id,
    descrizione: trimOrNull(n.descrizione),
    fatto: n.fatto,
    creato_da_id: me.id,
  });

  if (error) {
    console.error("Errore crea compito:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }

  revalidatePath("/calendario");
  if (n.evento_id) revalidatePath(`/eventi/${n.evento_id}/compiti`);
  return { ok: true };
}

export async function aggiornaCompitoR(
  compId: string,
  input: CompitoInput,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const err = validate(input);
  if (err) return { ok: false, error: err };
  const n = normalizeInput(input);

  const prevEventoId = await eventoIdOf(compId);

  const sb = createServerClient();
  const { error } = await sb
    .from("compiti")
    .update({
      titolo: n.titolo.trim(),
      data: n.data,
      data_fine: n.data_fine,
      ora: n.ora,
      categoria: n.categoria,
      assegnato_a_id: n.assegnato_a_id,
      assegnato_personale_id: n.assegnato_personale_id,
      evento_id: n.evento_id,
      descrizione: trimOrNull(n.descrizione),
      fatto: n.fatto,
    })
    .eq("id", compId);

  if (error) {
    console.error("Errore update compito:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }

  revalidatePath("/calendario");
  revalidatePath(`/calendario/${compId}`);
  if (prevEventoId) revalidatePath(`/eventi/${prevEventoId}/compiti`);
  if (n.evento_id && n.evento_id !== prevEventoId)
    revalidatePath(`/eventi/${n.evento_id}/compiti`);
  return { ok: true };
}

export async function eliminaCompitoR(compId: string): Promise<ActionResult> {
  await requireCurrentIdentity();
  const prevEventoId = await eventoIdOf(compId);

  const sb = createServerClient();
  const { error } = await sb.from("compiti").delete().eq("id", compId);

  if (error) {
    console.error("Errore delete compito:", error);
    return { ok: false, error: "Errore nell'eliminazione. Riprova." };
  }

  revalidatePath("/calendario");
  if (prevEventoId) revalidatePath(`/eventi/${prevEventoId}/compiti`);
  return { ok: true };
}

export async function toggleFattoR(
  compId: string,
  fatto: boolean,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const eventoId = await eventoIdOf(compId);

  const sb = createServerClient();
  const { error } = await sb
    .from("compiti")
    .update({ fatto })
    .eq("id", compId);

  if (error) {
    console.error("Errore toggle fatto:", error);
    return { ok: false, error: "Errore nel salvataggio." };
  }

  revalidatePath("/calendario");
  if (eventoId) revalidatePath(`/eventi/${eventoId}/compiti`);
  return { ok: true };
}
