"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import {
  EventoModal,
  type EventoEdit,
  type LocationOption,
} from "../../_components/EventoModal";

type Props = {
  evento: EventoEdit;
  locations: LocationOption[];
};

export function ModificaEventoButton({ evento, locations }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
      >
        <Pencil className="w-4 h-4" />
        Modifica info
      </button>
      <EventoModal
        mode={open ? { kind: "edit", evento } : null}
        locations={locations}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
