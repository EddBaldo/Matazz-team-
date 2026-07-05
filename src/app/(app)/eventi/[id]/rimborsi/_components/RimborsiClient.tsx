"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { formatMoney, fmtOrDash } from "@/lib/format";
import { toggleRimborsatoR, aggiornaPagatoDaR } from "../actions";

export type RimborsoItem = {
  categoria: string;
  categoriaLabel: string;
  sourceId: string;        // unique key used for rimborsato tracking
  pagatoDaSourceId: string; // DB row id for pagato_da updates (may differ from sourceId)
  descrizione: string;
  importo: number;
  pagatoDa: string | null;
  rimborsato: boolean;
};

type Props = {
  eventoId: string;
  items: RimborsoItem[];
};

export function RimborsiClient({ eventoId, items }: Props) {
  const [localItems, setLocalItems] = useState<RimborsoItem[]>(items);

  const totaleDaRimborsare = localItems
    .filter((i) => i.pagatoDa != null && !i.rimborsato)
    .reduce((s, i) => s + i.importo, 0);
  const totaleRimborsato = localItems
    .filter((i) => i.rimborsato)
    .reduce((s, i) => s + i.importo, 0);

  function updateItem(sourceId: string, categoria: string, patch: Partial<RimborsoItem>) {
    setLocalItems((prev) => {
      // When updating pagato_da, propagate to all items sharing the same pagatoDaSourceId
      // (e.g. multiple sub-rows for the same artista)
      if ("pagatoDa" in patch) {
        const target = prev.find(
          (i) => i.sourceId === sourceId && i.categoria === categoria,
        );
        if (target) {
          return prev.map((i) =>
            i.pagatoDaSourceId === target.pagatoDaSourceId && i.categoria === categoria
              ? { ...i, ...patch }
              : i,
          );
        }
      }
      return prev.map((i) =>
        i.sourceId === sourceId && i.categoria === categoria ? { ...i, ...patch } : i,
      );
    });
  }

  // Group preserving insertion order
  const order: string[] = [];
  const grouped: Record<string, RimborsoItem[]> = {};
  for (const item of localItems) {
    if (!grouped[item.categoria]) {
      order.push(item.categoria);
      grouped[item.categoria] = [];
    }
    grouped[item.categoria].push(item);
  }

  if (localItems.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center">
        <p className="text-neutral-600">Nessuna spesa registrata per questo evento.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-neutral-100">
          <div className="px-6 py-5">
            <p className="text-xs uppercase tracking-wide text-neutral-500 font-medium">Da rimborsare</p>
            <p className="text-3xl font-bold tabular-nums mt-1 text-red-700">
              {formatMoney(totaleDaRimborsare)}
            </p>
            <p className="text-[10px] text-neutral-400 mt-1">Solo voci con "chi ha pagato" compilato</p>
          </div>
          <div className="px-6 py-5">
            <p className="text-xs uppercase tracking-wide text-neutral-500 font-medium">Già rimborsato</p>
            <p className="text-3xl font-bold tabular-nums mt-1 text-green-700">
              {formatMoney(totaleRimborsato)}
            </p>
          </div>
        </div>
      </div>

      {order.map((cat) => {
        const groupItems = grouped[cat];
        const totaleDa = groupItems
          .filter((i) => i.pagatoDa != null && !i.rimborsato)
          .reduce((s, i) => s + i.importo, 0);
        const label = groupItems[0].categoriaLabel;

        return (
          <section key={cat}>
            <h3 className="text-base font-semibold text-neutral-900 mb-2 flex items-baseline justify-between gap-2">
              <span>{label}</span>
              {totaleDa > 0 && (
                <span className="text-sm font-normal text-red-600 tabular-nums">
                  {formatMoney(totaleDa)} da rimborsare
                </span>
              )}
            </h3>
            <div className="bg-white rounded-3xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-200">
                  <tr>
                    <Th align="left">Voce</Th>
                    <Th align="right">Importo</Th>
                    <Th align="left">Chi ha pagato</Th>
                    <Th align="center">Rimborsato</Th>
                  </tr>
                </thead>
                <tbody>
                  {groupItems.map((item) => (
                    <RimborsoRow
                      key={`${item.categoria}:${item.sourceId}`}
                      eventoId={eventoId}
                      item={item}
                      onPagatoDaChange={(v) =>
                        updateItem(item.sourceId, item.categoria, { pagatoDa: v })
                      }
                      onRimborsatoChange={(v) =>
                        updateItem(item.sourceId, item.categoria, { rimborsato: v })
                      }
                    />
                  ))}
                </tbody>
                <tfoot className="border-t border-neutral-200 bg-neutral-50">
                  <tr>
                    <td className="px-4 py-3 text-xs uppercase tracking-wide text-neutral-500 font-medium">
                      Totale
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-neutral-900">
                      {formatMoney(groupItems.reduce((s, i) => s + i.importo, 0))}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function RimborsoRow({
  eventoId,
  item,
  onPagatoDaChange,
  onRimborsatoChange,
}: {
  eventoId: string;
  item: RimborsoItem;
  onPagatoDaChange: (v: string | null) => void;
  onRimborsatoChange: (v: boolean) => void;
}) {
  return (
    <tr
      className={`border-b border-neutral-100 last:border-b-0 transition-opacity ${
        item.rimborsato ? "opacity-40" : ""
      }`}
    >
      <td className="px-4 py-3 text-neutral-800">{item.descrizione}</td>
      <td className="px-4 py-3 text-right tabular-nums text-neutral-900">
        {fmtOrDash(item.importo)}
      </td>
      <td className="px-4 py-3">
        <PagatoDaInput
          eventoId={eventoId}
          categoria={item.categoria}
          sourceId={item.sourceId}
          pagatoDaSourceId={item.pagatoDaSourceId}
          value={item.pagatoDa}
          onChange={onPagatoDaChange}
        />
      </td>
      <td className="px-4 py-3 text-center">
        <RimborsatoToggle
          eventoId={eventoId}
          categoria={item.categoria}
          sourceId={item.sourceId}
          value={item.rimborsato}
          onChange={onRimborsatoChange}
        />
      </td>
    </tr>
  );
}

function PagatoDaInput({
  eventoId,
  categoria,
  sourceId,
  pagatoDaSourceId,
  value,
  onChange,
}: {
  eventoId: string;
  categoria: string;
  sourceId: string;
  pagatoDaSourceId: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const [local, setLocal] = useState(value ?? "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function commit() {
    const trimmed = local.trim();
    const newVal = trimmed === "" ? null : trimmed;
    if (newVal === value) return;
    onChange(newVal);
    startTransition(async () => {
      const res = await aggiornaPagatoDaR(eventoId, categoria, pagatoDaSourceId, newVal);
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1200);
      }
    });
  }

  return (
    <input
      type="text"
      value={local}
      placeholder="—"
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      disabled={pending}
      className={`w-36 px-2 py-1 rounded-lg text-sm border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
        saved
          ? "border-green-400 bg-green-50"
          : "border-neutral-200 hover:border-neutral-300"
      }`}
    />
  );
}

function RimborsatoToggle({
  eventoId,
  categoria,
  sourceId,
  value,
  onChange,
}: {
  eventoId: string;
  categoria: string;
  sourceId: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();

  function toggle() {
    const newVal = !value;
    onChange(newVal);
    startTransition(async () => {
      await toggleRimborsatoR(eventoId, categoria, sourceId, newVal);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={value ? "Segna come non rimborsato" : "Segna come rimborsato"}
      className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors disabled:opacity-50 ${
        value
          ? "bg-green-100 text-green-700 hover:bg-green-200"
          : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200"
      }`}
    >
      {value && <Check className="w-4 h-4" />}
    </button>
  );
}

function Th({
  children,
  align,
}: {
  children: React.ReactNode;
  align: "left" | "right" | "center";
}) {
  const cls =
    align === "right"
      ? "text-right"
      : align === "center"
        ? "text-center"
        : "text-left";
  return (
    <th className={`px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-neutral-500 ${cls}`}>
      {children}
    </th>
  );
}
