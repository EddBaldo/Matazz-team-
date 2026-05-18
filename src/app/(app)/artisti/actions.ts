"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentIdentity } from "@/lib/auth/identity";
import { createServerClient } from "@/lib/supabase/server";
import { TIPI_ARTE } from "@/lib/artisti";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type ArtistaInput = {
  nome: string;
  cognome: string;
  tipo_arte: string;
  residenza: string | null;
  link: string | null;
  link_opera: string | null;
};

function trimOrNull(v: string | null): string | null {
  if (!v) return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function validate(input: ArtistaInput): string | null {
  if (input.nome.trim().length === 0 || input.cognome.trim().length === 0)
    return "Nome e cognome sono obbligatori.";
  if (!(TIPI_ARTE as readonly string[]).includes(input.tipo_arte))
    return "Tipo arte obbligatorio.";
  return null;
}

export async function creaArtistaR(input: ArtistaInput): Promise<ActionResult> {
  const me = await requireCurrentIdentity();
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const sb = createServerClient();
  const { error } = await sb.from("artisti").insert({
    nome: input.nome.trim(),
    cognome: input.cognome.trim(),
    tipo_arte: input.tipo_arte,
    residenza: trimOrNull(input.residenza),
    link: trimOrNull(input.link),
    link_opera: trimOrNull(input.link_opera),
    creato_da_id: me.id,
  });

  if (error) {
    console.error("Errore crea artista:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }

  revalidatePath("/artisti");
  return { ok: true };
}

export type AnagraficaInput = {
  nome: string;
  cognome: string;
  tipo_arte: string;
};

export async function aggiornaArtistaAnagraficaR(
  id: string,
  input: AnagraficaInput,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  if (input.nome.trim().length === 0 || input.cognome.trim().length === 0)
    return { ok: false, error: "Nome e cognome sono obbligatori." };
  if (!(TIPI_ARTE as readonly string[]).includes(input.tipo_arte))
    return { ok: false, error: "Tipo arte obbligatorio." };

  const sb = createServerClient();
  const { error } = await sb
    .from("artisti")
    .update({
      nome: input.nome.trim(),
      cognome: input.cognome.trim(),
      tipo_arte: input.tipo_arte,
    })
    .eq("id", id);

  if (error) {
    console.error("Errore update anagrafica:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }

  revalidatePath("/artisti");
  revalidatePath(`/artisti/${id}`);
  revalidatePath("/eventi/[id]/artisti", "page");
  return { ok: true };
}

export async function aggiornaArtistaR(
  id: string,
  input: ArtistaInput,
): Promise<ActionResult> {
  await requireCurrentIdentity();
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const sb = createServerClient();
  const { error } = await sb
    .from("artisti")
    .update({
      nome: input.nome.trim(),
      cognome: input.cognome.trim(),
      tipo_arte: input.tipo_arte,
      residenza: trimOrNull(input.residenza),
      link: trimOrNull(input.link),
      link_opera: trimOrNull(input.link_opera),
    })
    .eq("id", id);

  if (error) {
    console.error("Errore update artista:", error);
    return { ok: false, error: "Errore nel salvataggio. Riprova." };
  }

  revalidatePath("/artisti");
  revalidatePath(`/artisti/${id}`);
  return { ok: true };
}

export async function eliminaArtistaR(id: string): Promise<ActionResult> {
  await requireCurrentIdentity();

  const sb = createServerClient();
  const { error } = await sb.from("artisti").delete().eq("id", id);

  if (error) {
    console.error("Errore delete artista:", error);
    if (error.code === "23503")
      return {
        ok: false,
        error:
          "Questo artista è ancora collegato a uno o più eventi. Rimuovilo dagli eventi prima.",
      };
    return { ok: false, error: "Errore nell'eliminazione. Riprova." };
  }

  revalidatePath("/artisti");
  return { ok: true };
}
