"use client";

import { useTransition } from "react";
import { eliminaCompito } from "../[compId]/actions";

export function DeleteCompitoButton({ compId }: { compId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Eliminare questo compito?")) return;
    startTransition(() => {
      eliminaCompito(compId);
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleClick}
      className="px-3 py-2 text-sm text-red-700 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50"
    >
      {isPending ? "Eliminazione…" : "Elimina compito"}
    </button>
  );
}
