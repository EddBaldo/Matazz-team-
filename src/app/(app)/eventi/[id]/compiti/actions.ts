"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentIdentity } from "@/lib/auth/identity";
import { createServerClient } from "@/lib/supabase/server";
import { CATEGORIE_COMPITI } from "@/lib/compiti";

export type ActionResult = { ok: true } | { ok: false; error: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(?::\d{2})?$/;

function trimOrNull(v: string | null): string | null {
  if (!v) return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function timeOrNull(v: string | null): string | null {
  if (!v) return null;
  return TIME_RE.test(v) ? v : null;
}

function revalidateCompiti(eventoId: string) {
  revalidatePath(`/eventi/${eventoId}`);
  revalidatePath(`/eventi/${eventoId}/compiti`);
  revalidatePath("/calendario");
}

export type TurnoInput = {
  personale_id: string | null;
  nome_libero: string | null;
  ora_inizio: string | null;
  ora_fine: string | null;
  note: string | null;
};

export type CompitoInput = {
  titolo: string;
  data: string;
  data_fine: string | null;
  tipo: "singolo" | "turni";
  // solo per singolo
  ora: string | null;
  ora_fine: string | null;
  assegnato_a_id: string | null;
  // sempre
  categoria: string | null;
  descrizione: string | null;
  // solo per turni
  turni: TurnoInput[];
};

function validateCompito(input: CompitoInput): string | null {
  if (input.titolo.trim().length === 0) return "Il titolo è obbligatorio.";
  if (!DATE_RE.test(input.data)) return "La data è obbligatoria.";
  if (input.data_fine && !DATE_RE.test(input.data_fine))
    return "Data di fine non valida.";
  if (input.tipo !== "singolo" && input.tipo !== "turni")
    return "Tipo non valido.";
  return null;
}

function normalizeCompito(input: CompitoInput) {
  const categoria =
    input.categoria &&
    (CATEGORIE_COMPITI as readonly string[]).includes(input.categoria)
      ? input.categoria
      : null;
  const dataFine =
    input.data_fine &&
    DATE_RE.test(input.data_fine) &&
    input.data_fine > input.data
      ? input.data_fine
      : null;
  const isTurni = input.tipo === "turni";
  return {
    titolo: input.titolo.trim(),
    data: input.data,
    data_fine: dataFine,
    tipo: input.tipo,
    ora: isTurni ? null : timeOrNull(input.ora),
    ora_fine: isTurni ? null : timeOrNull(input.ora_fine),
    categoria,
    assegnato_a_id: isTurni ? null : input.assegnato_a_id || null,
    descrizione: trimOrNull(input.descrizione),
  };
}

function normalizeTurni(turni: TurnoInput[]) {
  return turni
    .map((t) => ({
      personale_id: t.personale_id || null,
      nome_libero: trimOrNull(t.nome_libero),
      ora_inizio: timeOrNull(t.ora_inizio),
      ora_fine: timeOrNull(t.ora_fine),
      note: trimOrNull(t.note),
    }))
    .filter(
      (t) =>
        t.personale_id ||
        t.nome_libero ||
        t.ora_inizio ||
        t.ora_fine ||
        t.note,
    );
}

export async function creaCompitoR(
  eventoId: string,
  input: CompitoInput,
): Promise<ActionResult> {
  const me = await requireCurrentIdentity();
  const err = validateCompito(input);
  if (err) return { ok: false, error: err };

  const sb = createServerClient();
  const { data: created, error } = await sb
    .from("compiti")
    .insert({
      evento_id: eventoId,
      ...normalizeCompito(input),
      creato_da_id: me.id,
    })
    .select("id")
    .single();

  if (error || !created) {
    console.error("Errore crea compito:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }

  if (input.tipo === "turni") {
    const turni = normalizeTurni(input.turni);
    if (turni.length > 0) {
      const rows = turni.map((t, i) => ({
        compito_id: created.id,
        ordine: i,
        ...t,
      }));
      const { error: subErr } = await sb.from("compiti_sub").insert(rows);
      if (subErr) {
        console.error("Errore insert sub:", subErr);
      }
    }
  }

  revalidateCompiti(eventoId);
  return { ok: true };
}

export async function aggiornaCompitoR(
  eventoId: string,
  compId: string,
  input: CompitoInput,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const err = validateCompito(input);
  if (err) return { ok: false, error: err };

  const sb = createServerClient();
  const { error } = await sb
    .from("compiti")
    .update(normalizeCompito(input))
    .eq("id", compId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("Errore update compito:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }

  // Sync sub: cancella e reinserisci se turni
  await sb.from("compiti_sub").delete().eq("compito_id", compId);

  if (input.tipo === "turni") {
    const turni = normalizeTurni(input.turni);
    if (turni.length > 0) {
      const rows = turni.map((t, i) => ({
        compito_id: compId,
        ordine: i,
        ...t,
      }));
      const { error: subErr } = await sb.from("compiti_sub").insert(rows);
      if (subErr) {
        console.error("Errore reinsert sub:", subErr);
      }
    }
  }

  revalidateCompiti(eventoId);
  return { ok: true };
}

export async function eliminaCompitoR(
  eventoId: string,
  compId: string,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const sb = createServerClient();
  const { error } = await sb
    .from("compiti")
    .delete()
    .eq("id", compId)
    .eq("evento_id", eventoId);

  if (error) {
    console.error("Errore delete compito:", error);
    return { ok: false, error: "Errore nell'eliminazione. Riprova." };
  }
  revalidateCompiti(eventoId);
  return { ok: true };
}

export async function toggleFattoR(
  eventoId: string,
  compId: string,
  fatto: boolean,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const sb = createServerClient();
  const { error } = await sb
    .from("compiti")
    .update({ fatto })
    .eq("id", compId)
    .eq("evento_id", eventoId);

  if (error) return { ok: false, error: "Errore." };
  revalidateCompiti(eventoId);
  return { ok: true };
}
