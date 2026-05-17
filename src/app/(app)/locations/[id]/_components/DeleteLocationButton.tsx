"use client";

import { useTransition } from "react";
import { eliminaLocation } from "../actions";

export function DeleteLocationButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (
      !confirm(
        "Eliminare definitivamente questa location?\n(Gli eventi che la usavano resteranno senza location.)",
      )
    )
      return;
    startTransition(() => {
      eliminaLocation(id);
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleClick}
      className="px-3 py-2 text-sm text-red-700 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50"
    >
      {isPending ? "Eliminazione…" : "Elimina location"}
    </button>
  );
}
