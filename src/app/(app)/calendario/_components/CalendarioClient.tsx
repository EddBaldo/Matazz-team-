"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CATEGORIE_COMPITI, CATEGORIA_BADGE, CATEGORIA_DOT } from "@/lib/compiti";
import { formatDateIT, formatTime } from "@/lib/format";
import { CalendarioMese } from "@/components/CalendarioMese";
import {
  CompitoModal,
  type CompitoEdit,
  type EventoOption,
} from "./CompitoModal";

export type CompitoRow = CompitoEdit & {
  eventoNome: string | null;
};

type Props = {
  year: number;
  month: number;
  teamsAttivi: string[];
  compitiMese: CompitoRow[];
  prossimiCompiti: CompitoRow[];
  eventiDays: string[];
  eventi: EventoOption[];
  hrefMesePrev: string;
  hrefMeseNext: string;
  toggleHrefs: Record<string, string>;
};

export function CalendarioClient({
  year,
  month,
  teamsAttivi,
  compitiMese,
  prossimiCompiti,
  eventiDays,
  eventi,
  hrefMesePrev,
  hrefMeseNext,
  toggleHrefs,
}: Props) {
  const [modal, setModal] = useState<
    { kind: "add" } | { kind: "edit"; compito: CompitoEdit } | null
  >(null);

  const allCompitiById = new Map<string, CompitoEdit>();
  for (const c of compitiMese) allCompitiById.set(c.id, c);
  for (const c of prossimiCompiti) allCompitiById.set(c.id, c);

  function openEdit(id: string) {
    const c = allCompitiById.get(id);
    if (c) setModal({ kind: "edit", compito: c });
  }

  return (
    <>
      <div className="flex items-center justify-end gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => setModal({ kind: "add" })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
        >
          <Plus className="w-4 h-4" />
          Nuovo impegno
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIE_COMPITI.map((t) => {
          const isActive = teamsAttivi.includes(t);
          return (
            <Link
              key={t}
              href={toggleHrefs[t]}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                isActive
                  ? `${CATEGORIA_BADGE[t] ?? "bg-neutral-200 text-neutral-800"} font-medium`
                  : "bg-white text-neutral-500 border border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${CATEGORIA_DOT[t]}`}
              ></span>
              {t}
            </Link>
          );
        })}
      </div>

      <CalendarioMese
        year={year}
        month={month}
        compiti={compitiMese}
        eventiDays={eventiDays}
        onCompitoClick={openEdit}
        hrefMesePrev={hrefMesePrev}
        hrefMeseNext={hrefMeseNext}
      />

      <section>
        <h2 className="text-lg font-semibold text-neutral-900 mb-3">
          Prossimi impegni
        </h2>
        {prossimiCompiti.length === 0 ? (
          <div className="rounded-3xl bg-white p-6 text-center">
            <p className="text-sm text-neutral-600">
              Nessun impegno in arrivo.
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {prossimiCompiti.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => openEdit(c.id)}
                  className="w-full flex items-start gap-3 bg-white rounded-2xl px-4 py-3 hover:bg-neutral-50 text-left"
                >
                  <span className="text-sm text-neutral-900 whitespace-nowrap font-semibold tabular-nums pt-0.5">
                    {formatDateIT(c.data)}
                    {c.data_fine && c.data_fine !== c.data
                      ? ` → ${formatDateIT(c.data_fine)}`
                      : ""}
                    {c.ora ? ` · ${formatTime(c.ora)}` : ""}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 mt-2 ${
                      c.categoria
                        ? CATEGORIA_DOT[c.categoria] ?? "bg-neutral-400"
                        : "bg-neutral-400"
                    }`}
                  ></span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-neutral-600 font-normal truncate">
                      {c.titolo}
                      {c.eventoNome && (
                        <span className="text-neutral-400">
                          {" "}
                          · {c.eventoNome}
                        </span>
                      )}
                    </span>
                    {c.descrizione && (
                      <span className="block text-xs text-neutral-500 mt-0.5 line-clamp-2">
                        {c.descrizione}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <CompitoModal
        mode={modal}
        eventi={eventi}
        onClose={() => setModal(null)}
      />
    </>
  );
}
