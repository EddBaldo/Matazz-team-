"use client";

import { useTransition } from "react";
import { eliminaPersonale } from "../actions";

export function DeletePersonaleButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (
      !confirm(
        "Eliminare definitivamente questa persona dalla rubrica?\n(L'azione fallisce se è ancora collegata a uno o più eventi.)",
      )
    )
      return;
    startTransition(() => {
      eliminaPersonale(id);
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleClick}
      className="px-3 py-2 text-sm text-red-700 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50"
    >
      {isPending ? "Eliminazione…" : "Elimina"}
    </button>
  );
}
