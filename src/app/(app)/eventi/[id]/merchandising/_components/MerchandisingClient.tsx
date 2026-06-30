"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, Check, Circle } from "lucide-react";
import { formatMoney } from "@/lib/format";
import {
  salvaStimaVenditeMerchR,
  toggleMerchInclusoR,
} from "../actions";
import {
  MerchandisingModal,
  type MerchandisingEdit,
} from "./MerchandisingModal";

export type MerchandisingRow = MerchandisingEdit;

type Props = {
  eventoId: string;
  rows: MerchandisingRow[];
  stimaVendite: number;
};

export function MerchandisingClient({
  eventoId,
  rows,
  stimaVendite,
}: Props) {
  const [modal, setModal] = useState<
    { kind: "add" } | { kind: "edit"; merch: MerchandisingEdit } | null
  >(null);

  const inclusi = rows.filter((r) => r.inclusa_nel_budget);
  const totaleSpesa = inclusi.reduce(
    (s, r) => s + Number(r.costo_totale),
    0,
  );
  const totaleEscluso = rows
    .filter((r) => !r.inclusa_nel_budget)
    .reduce((s, r) => s + Number(r.costo_totale), 0);
  const margine = stimaVendite - totaleSpesa;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ResumeCard
          label="Quanto paghiamo"
          value={formatMoney(totaleSpesa)}
          sub={`${inclusi.length}/${rows.length} ${
            rows.length === 1 ? "articolo" : "articoli"
          } nel budget${
            totaleEscluso > 0
              ? ` · esclusi ${formatMoney(totaleEscluso)}`
              : ""
          }`}
        />
        <StimaCard
          eventoId={eventoId}
          initial={stimaVendite}
          spesa={totaleSpesa}
          margine={margine}
        />
      </div>

      <div className="flex items-center justify-end gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => setModal({ kind: "add" })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
        >
          <Plus className="w-4 h-4" />
          Aggiungi articolo
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center">
          <p className="text-neutral-600">Nessun articolo merch ancora.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200">
              <tr>
                <Th align="left">Articolo</Th>
                <Th align="right">Pezzi</Th>
                <Th align="right">Costo totale</Th>
                <Th align="left">Pagato da</Th>
                <Th align="left">Note</Th>
                <Th align="center">Budget</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <MerchRow
                  key={r.id}
                  eventoId={eventoId}
                  row={r}
                  onClick={() => setModal({ kind: "edit", merch: r })}
                />
              ))}
            </tbody>
            <tfoot className="border-t border-neutral-200 bg-neutral-50">
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-3 text-xs uppercase tracking-wide text-neutral-500 text-right font-medium"
                >
                  Totale spesa nel budget
                </td>
                <td className="px-4 py-3 text-sm text-neutral-900 text-right font-semibold tabular-nums">
                  {formatMoney(totaleSpesa)}
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <MerchandisingModal
        eventoId={eventoId}
        mode={modal}
        onClose={() => setModal(null)}
      />
    </>
  );
}

function ResumeCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 sm:p-6">
      <p className="text-xs uppercase tracking-wide text-neutral-500 font-medium">
        {label}
      </p>
      <p className="text-3xl font-semibold text-neutral-900 mt-1 tabular-nums">
        {value}
      </p>
      {sub && <p className="text-xs text-neutral-500 mt-1">{sub}</p>}
    </div>
  );
}

function StimaCard({
  eventoId,
  initial,
  spesa,
  margine,
}: {
  eventoId: string;
  initial: number;
  spesa: number;
  margine: number;
}) {
  const [value, setValue] = useState<string>(String(initial));
  const [savedValue, setSavedValue] = useState<number>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Allinea allo stato server quando cambia (es. dopo revalidate)
  useEffect(() => {
    setValue(String(initial));
    setSavedValue(initial);
  }, [initial]);

  function commit() {
    const n = Number(value);
    const safe = Number.isFinite(n) && n >= 0 ? n : 0;
    if (safe === savedValue) return;
    startTransition(async () => {
      const res = await salvaStimaVenditeMerchR(eventoId, safe);
      if (res.ok) {
        setSavedValue(safe);
        setError(null);
      } else {
        setError(res.error);
        setValue(String(savedValue));
      }
    });
  }

  const dirty = Number(value) !== savedValue;

  return (
    <div className="rounded-3xl bg-white p-5 sm:p-6">
      <p className="text-xs uppercase tracking-wide text-neutral-500 font-medium">
        Stima vendite
      </p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-neutral-900 tabular-nums">
          CHF
        </span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          disabled={pending}
          className="flex-1 min-w-0 text-3xl font-semibold text-neutral-900 tabular-nums bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-amber-500 focus:outline-none disabled:opacity-50"
        />
      </div>
      <p
        className={`text-xs mt-1 ${
          margine >= 0 ? "text-green-700" : "text-red-700"
        }`}
      >
        margine stimato {margine >= 0 ? "+" : ""}
        {formatMoney(margine)}
        {dirty && " · invio per salvare"}
        {pending && " · salvataggio…"}
        {error && ` · ${error}`}
      </p>
      <p className="text-[11px] text-neutral-400 mt-1">
        Sincronizzata con Budget e Costi → riga &quot;Merchandising (stima
        vendite)&quot;.
      </p>
    </div>
  );
}

function MerchRow({
  eventoId,
  row,
  onClick,
}: {
  eventoId: string;
  row: MerchandisingRow;
  onClick: () => void;
}) {
  const [pending, startTransition] = useTransition();
  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      await toggleMerchInclusoR(eventoId, row.id, !row.inclusa_nel_budget);
    });
  }
  return (
    <tr
      onClick={onClick}
      className={`border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 cursor-pointer ${
        row.inclusa_nel_budget ? "" : "opacity-60"
      }`}
    >
      <td className="px-4 py-3 text-neutral-900 font-medium">
        {row.articolo}
      </td>
      <td className="px-4 py-3 text-neutral-900 text-right tabular-nums">
        {row.quantita}
      </td>
      <td className="px-4 py-3 text-neutral-900 text-right tabular-nums font-medium">
        {formatMoney(Number(row.costo_totale))}
      </td>
      <td className="px-4 py-3">
        {row.pagato_da ? (
          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            {row.pagato_da}
          </span>
        ) : (
          <span className="text-neutral-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-neutral-700 text-sm">
        {row.note ?? "—"}
      </td>
      <td className="px-4 py-3 text-center">
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          aria-label={
            row.inclusa_nel_budget
              ? "Escludi dal budget"
              : "Includi nel budget"
          }
          title={
            row.inclusa_nel_budget
              ? "Incluso nel budget — clicca per escludere"
              : "Escluso dal budget — clicca per includere"
          }
          className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors disabled:opacity-50 ${
            row.inclusa_nel_budget
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
          }`}
        >
          {row.inclusa_nel_budget ? (
            <Check className="w-4 h-4" />
          ) : (
            <Circle className="w-4 h-4" />
          )}
        </button>
      </td>
    </tr>
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
    <th
      className={`px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-neutral-500 ${cls}`}
    >
      {children}
    </th>
  );
}
