"use client";

import { useTransition } from "react";
import { eliminaInventario } from "../actions";

export function DeleteInventarioButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Eliminare definitivamente questo articolo dall'inventario?"))
      return;
    startTransition(() => {
      eliminaInventario(id);
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleClick}
      className="px-3 py-2 text-sm text-red-700 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50"
    >
      {isPending ? "Eliminazione…" : "Elimina articolo"}
    </button>
  );
}
