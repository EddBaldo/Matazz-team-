"use client";

import { useTransition } from "react";
import { eliminaEvento } from "../actions";

export function DeleteEventoButton({
  id,
  nome,
}: {
  id: string;
  nome?: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const msg = nome
      ? `Sei sicuro di voler eliminare l'evento "${nome}"?\n\nVerranno persi tutti i dati collegati: artisti, programma, personale, budget, materiali, sponsor. L'azione non è reversibile.`
      : "Sei sicuro di voler eliminare questo evento?\n\nVerranno persi tutti i dati collegati: artisti, programma, personale, budget, materiali, sponsor. L'azione non è reversibile.";
    if (!confirm(msg)) return;
    startTransition(() => {
      eliminaEvento(id);
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleClick}
      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
    >
      {isPending ? "Eliminazione…" : "Elimina evento"}
    </button>
  );
}
