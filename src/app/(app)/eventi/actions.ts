"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentIdentity } from "@/lib/auth/identity";
import { createServerClient } from "@/lib/supabase/server";
import { calcolaBudgetEvento } from "@/lib/budget-evento";

export type ActionResult = { ok: true } | { ok: false; error: string };

const STATI_VALIDI = ["In pianificazione", "Concluso"] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function trimOrNull(v: string | null): string | null {
  if (!v) return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

export type EventoInput = {
  nome: string;
  data_inizio: string;
  data_fine: string | null;
  location_id: string | null;
  stato: string;
  descrizione: string | null;
};

function validate(input: EventoInput): string | null {
  if (input.nome.trim().length === 0) return "Il nome è obbligatorio.";
  if (!DATE_RE.test(input.data_inizio))
    return "La data di inizio è obbligatoria.";
  if (input.data_fine && !DATE_RE.test(input.data_fine))
    return "Data fine non valida.";
  if (!(STATI_VALIDI as readonly string[]).includes(input.stato))
    return "Stato non valido.";
  return null;
}

export async function creaEventoR(
  input: EventoInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const me = await requireCurrentIdentity();
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const sb = createServerClient();
  const { data, error } = await sb
    .from("eventi")
    .insert({
      nome: input.nome.trim(),
      data_inizio: input.data_inizio,
      data_fine: input.data_fine || null,
      location_id: input.location_id || null,
      stato: input.stato,
      descrizione: trimOrNull(input.descrizione),
      creato_da_id: me.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Errore creazione evento:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }
  revalidatePath("/eventi");
  return { ok: true, id: data.id };
}

export async function aggiornaEventoR(
  id: string,
  input: EventoInput,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const sb = createServerClient();

  // Stato corrente per capire se c'è una transizione di stato
  const { data: prevData } = await sb
    .from("eventi")
    .select("stato, nome")
    .eq("id", id)
    .maybeSingle();
  const prevStato = prevData?.stato ?? null;

  const { error } = await sb
    .from("eventi")
    .update({
      nome: input.nome.trim(),
      data_inizio: input.data_inizio,
      data_fine: input.data_fine || null,
      location_id: input.location_id || null,
      stato: input.stato,
      descrizione: trimOrNull(input.descrizione),
    })
    .eq("id", id);

  if (error) {
    console.error("Errore update evento:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }

  // Sync col conto sulla base della transizione di stato
  await syncContoSuTransizione(sb, id, input.nome.trim(), prevStato, input.stato);

  revalidatePath("/eventi");
  revalidatePath(`/eventi/${id}`);
  revalidatePath(`/eventi/${id}/budget`);
  revalidatePath("/conto");
  return { ok: true };
}

export async function eliminaEventoR(id: string): Promise<ActionResult> {
  await requireCurrentIdentity();

  const sb = createServerClient();

  // I movimenti del conto collegati restano (evento_id diventa null) — non
  // li tocchiamo per non perdere lo storico contabile.
  const { error } = await sb.from("eventi").delete().eq("id", id);

  if (error) {
    console.error("Errore delete evento:", error);
    if (error.code === "23503")
      return {
        ok: false,
        error:
          "Impossibile eliminare: ci sono ancora dati collegati (artisti, compiti, ecc.).",
      };
    return { ok: false, error: "Errore nell'eliminazione. Riprova." };
  }

  revalidatePath("/eventi");
  revalidatePath("/conto");
  return { ok: true };
}

type SbClient = ReturnType<typeof createServerClient>;

async function syncContoSuTransizione(
  sb: SbClient,
  eventoId: string,
  eventoNome: string,
  prevStato: string | null,
  newStato: string,
) {
  // Pianificazione → Concluso: aggiungi movimento col saldo dell'evento.
  if (prevStato !== "Concluso" && newStato === "Concluso") {
    const budget = await calcolaBudgetEvento(sb, eventoId);
    const importo = budget.entrate - budget.uscite;
    const today = new Date();
    const data = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    await sb.from("conto_movimenti").insert({
      data,
      descrizione: `Evento "${eventoNome}" — saldo finale`,
      importo,
      evento_id: eventoId,
    });
    return;
  }

  // Concluso → Pianificazione: rimuovi i movimenti generati dalla conclusione.
  if (prevStato === "Concluso" && newStato !== "Concluso") {
    await sb.from("conto_movimenti").delete().eq("evento_id", eventoId);
    return;
  }
}
