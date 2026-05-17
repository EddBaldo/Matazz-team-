"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, MapPin, Calendar } from "lucide-react";
import {
  NuovoEventoModal,
  type LocationOption,
} from "./NuovoEventoModal";

const VALID_STATI = ["In pianificazione", "Concluso"] as const;
const FILTRI = ["Tutti", ...VALID_STATI] as const;

const STATO_BADGE: Record<string, string> = {
  "In pianificazione": "bg-amber-100 text-amber-800",
  Concluso: "bg-neutral-200 text-neutral-700",
};

export type EventoCard = {
  id: string;
  nome: string;
  data_inizio: string;
  data_fine: string | null;
  stato: string;
  descrizione: string | null;
  locationNome: string | null;
  locationCitta: string | null;
  creatoDaNome: string | null;
};

type Props = {
  eventi: EventoCard[];
  locations: LocationOption[];
};

function formatRange(start: string, end: string | null): string {
  const s = new Date(start + "T00:00:00").toLocaleDateString("it-CH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  if (!end || end === start) return s;
  const e = new Date(end + "T00:00:00").toLocaleDateString("it-CH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${s} → ${e}`;
}

export function EventiClient({ eventi, locations }: Props) {
  const [filtro, setFiltro] = useState<string>("Tutti");
  const [addOpen, setAddOpen] = useState(false);

  const filtrati = useMemo(
    () =>
      filtro === "Tutti"
        ? eventi
        : eventi.filter((e) => e.stato === filtro),
    [eventi, filtro],
  );

  return (
    <>
      <div className="flex items-center justify-end gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
        >
          <Plus className="w-4 h-4" />
          Nuovo evento
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTRI.map((f) => {
          const isActive = filtro === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? "bg-neutral-900 text-white"
                  : "bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      {filtrati.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center">
          <p className="text-neutral-600">
            {filtro === "Tutti"
              ? "Nessun evento ancora."
              : `Nessun evento con stato "${filtro}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtrati.map((e) => (
            <Link
              key={e.id}
              href={`/eventi/${e.id}`}
              className="group block rounded-3xl bg-white p-6 hover:-translate-y-0.5 transition-transform"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-semibold text-neutral-900 truncate">
                  {e.nome}
                </h3>
                <span
                  className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    STATO_BADGE[e.stato] ?? "bg-neutral-100 text-neutral-700"
                  }`}
                >
                  {e.stato}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-sm text-neutral-700">
                <p className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-neutral-500 shrink-0" />
                  <span className="truncate">
                    {formatRange(e.data_inizio, e.data_fine)}
                  </span>
                </p>
                {e.locationNome && (
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-neutral-500 shrink-0" />
                    <span className="truncate">
                      {e.locationNome}
                      {e.locationCitta ? ` (${e.locationCitta})` : ""}
                    </span>
                  </p>
                )}
              </div>

              {e.descrizione && (
                <p className="text-sm text-neutral-600 mt-3 line-clamp-2">
                  {e.descrizione}
                </p>
              )}

              {e.creatoDaNome && (
                <p className="text-xs text-neutral-400 mt-4 pt-3 border-t border-neutral-100">
                  Aggiunto da {e.creatoDaNome}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}

      <NuovoEventoModal
        open={addOpen}
        locations={locations}
        onClose={() => setAddOpen(false)}
      />
    </>
  );
}
