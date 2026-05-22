"use client";

import { useState, useTransition } from "react";
import { Plus, Check, Circle } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { toggleFoodTruckSelezionata } from "../actions";
import { BarModal, type BarEdit } from "./BarModal";
import { FoodTruckModal, type FoodTruckEdit } from "./FoodTruckModal";

type Props = {
  eventoId: string;
  bar: BarEdit[];
  foodTruck: FoodTruckEdit[];
};

type BarModalState = { kind: "add" } | { kind: "edit"; bar: BarEdit } | null;
type FtModalState =
  | { kind: "add" }
  | { kind: "edit"; ft: FoodTruckEdit }
  | null;

function guadagnoFoodTruck(ft: FoodTruckEdit): number {
  if (ft.modello === "Acquisto") {
    return (
      (Number(ft.prezzo_vendita ?? 0) - Number(ft.costo_unitario ?? 0)) *
      Number(ft.quantita_stimata ?? 0)
    );
  }
  return (
    (Number(ft.incasso_lordo_stimato) * Number(ft.percentuale_matazz)) / 100
  );
}

export function FoodBeverageClient({
  eventoId,
  bar,
  foodTruck,
}: Props) {
  const [barModal, setBarModal] = useState<BarModalState>(null);
  const [ftModal, setFtModal] = useState<FtModalState>(null);

  // BAR totals (separati per fonte)
  const barNoi = bar.filter((b) => b.fonte === "Noi");
  const barFornitore = bar.filter((b) => b.fonte === "Fornitore");

  function barTotals(items: BarEdit[]) {
    const ricavo = items.reduce(
      (s, r) =>
        s + Number(r.prezzo_vendita ?? 0) * Number(r.quantita_stimata),
      0,
    );
    const costo = items.reduce(
      (s, r) =>
        s + Number(r.costo_unitario ?? 0) * Number(r.quantita_stimata),
      0,
    );
    return { ricavo, costo, margine: ricavo - costo };
  }

  const tNoi = barTotals(barNoi);
  const tForn = barTotals(barFornitore);
  const tBarTotale = barTotals(bar);

  const ftPercentuale = foodTruck.filter((f) => f.modello === "Percentuale");
  const ftAcquisto = foodTruck.filter((f) => f.modello === "Acquisto");

  const ftTotaleSel = foodTruck
    .filter((r) => r.selezionata)
    .reduce((s, r) => s + guadagnoFoodTruck(r), 0);

  return (
    <>
      {/* --- BAR --- */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 flex items-baseline gap-2">
              <span aria-hidden>🍻</span>
              <span>Bar</span>
              <span className="text-sm text-neutral-500 font-normal">
                ({bar.length})
              </span>
            </h3>
            <p className="text-sm text-neutral-600 mt-0.5">
              Ricavo {formatMoney(tBarTotale.ricavo)} · Costo{" "}
              {formatMoney(tBarTotale.costo)} ·{" "}
              <strong
                className={
                  tBarTotale.margine >= 0 ? "text-green-700" : "text-red-700"
                }
              >
                Margine {formatMoney(tBarTotale.margine)}
              </strong>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setBarModal({ kind: "add" })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
          >
            <Plus className="w-4 h-4" />
            Aggiungi articolo
          </button>
        </div>

        {bar.length === 0 ? (
          <EmptyBox text="Nessun articolo. Aggiungi il primo." />
        ) : (
          <>
            <BarSubgroup
              label="Nostri"
              items={barNoi}
              totals={tNoi}
              onRowClick={(b) => setBarModal({ kind: "edit", bar: b })}
            />
            <BarSubgroup
              label="Fornitori"
              items={barFornitore}
              totals={tForn}
              showFornitore
              onRowClick={(b) => setBarModal({ kind: "edit", bar: b })}
            />
          </>
        )}
      </section>

      {/* --- FOOD TRUCK --- */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 flex items-baseline gap-2">
              <span aria-hidden>🚚</span>
              <span>Food truck</span>
              <span className="text-sm text-neutral-500 font-normal">
                ({foodTruck.length})
              </span>
            </h3>
            <p className="text-sm text-neutral-600 mt-0.5">
              Guadagno nostro selezionato:{" "}
              <strong className="text-green-700">
                {formatMoney(ftTotaleSel)}
              </strong>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFtModal({ kind: "add" })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
          >
            <Plus className="w-4 h-4" />
            Aggiungi food truck
          </button>
        </div>

        {foodTruck.length === 0 ? (
          <EmptyBox text="Nessun food truck. Aggiungi il primo." />
        ) : (
          <>
            <FtSubgroupPercentuale
              eventoId={eventoId}
              items={ftPercentuale}
              onRowClick={(f) => setFtModal({ kind: "edit", ft: f })}
            />
            <FtSubgroupAcquisto
              eventoId={eventoId}
              items={ftAcquisto}
              onRowClick={(f) => setFtModal({ kind: "edit", ft: f })}
            />
          </>
        )}
      </section>

      <BarModal
        eventoId={eventoId}
        mode={barModal}
        onClose={() => setBarModal(null)}
      />
      <FoodTruckModal
        eventoId={eventoId}
        mode={ftModal}
        onClose={() => setFtModal(null)}
      />
    </>
  );
}

function BarSubgroup({
  label,
  items,
  totals: t,
  showFornitore,
  onRowClick,
}: {
  label: string;
  items: BarEdit[];
  totals: { ricavo: number; costo: number; margine: number };
  showFornitore?: boolean;
  onRowClick: (b: BarEdit) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1.5 px-1">
        <span className="text-xs uppercase tracking-wide text-neutral-500 font-medium">
          {label} ({items.length})
        </span>
        <span className="text-xs text-neutral-500">
          Costo {formatMoney(t.costo)} · Margine{" "}
          <strong
            className={t.margine >= 0 ? "text-green-700" : "text-red-700"}
          >
            {formatMoney(t.margine)}
          </strong>
        </span>
      </div>
      <div className="bg-white rounded-3xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200">
            <tr>
              <Th align="left">Articolo</Th>
              {showFornitore && <Th align="left">Fornitore</Th>}
              <Th align="right">Costo unit.</Th>
              <Th align="right">Vendita unit.</Th>
              <Th align="right">Qty stim.</Th>
              <Th align="right">Margine</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => {
              const ricavo =
                Number(r.prezzo_vendita ?? 0) * Number(r.quantita_stimata);
              const costo =
                Number(r.costo_unitario ?? 0) * Number(r.quantita_stimata);
              const margine = ricavo - costo;
              return (
                <tr
                  key={r.id}
                  onClick={() => onRowClick(r)}
                  className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 cursor-pointer"
                >
                  <td className="px-4 py-3 text-neutral-900 font-medium">
                    {r.articolo}
                  </td>
                  {showFornitore && (
                    <td className="px-4 py-3 text-neutral-700">
                      {r.fornitore ?? "—"}
                    </td>
                  )}
                  <td className="px-4 py-3 text-neutral-700 text-right tabular-nums">
                    {formatMoney(Number(r.costo_unitario ?? 0))}
                  </td>
                  <td className="px-4 py-3 text-neutral-700 text-right tabular-nums">
                    {formatMoney(Number(r.prezzo_vendita ?? 0))}
                  </td>
                  <td className="px-4 py-3 text-neutral-900 text-right tabular-nums">
                    {r.quantita_stimata}
                  </td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums font-medium ${
                      margine >= 0 ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {formatMoney(margine)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FtSubgroupPercentuale({
  eventoId,
  items,
  onRowClick,
}: {
  eventoId: string;
  items: FoodTruckEdit[];
  onRowClick: (f: FoodTruckEdit) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="mb-1.5 px-1">
        <span className="text-xs uppercase tracking-wide text-neutral-500 font-medium">
          A percentuale ({items.length})
        </span>
      </div>
      <div className="bg-white rounded-3xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200">
            <tr>
              <Th align="left">Nome</Th>
              <Th align="right">Incasso lordo stim.</Th>
              <Th align="right">% Matazz</Th>
              <Th align="right">Guadagno nostro</Th>
              <Th align="center">
                <span className="sr-only">Selezionata</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <FtRowPercentuale
                key={r.id}
                eventoId={eventoId}
                row={r}
                onClick={() => onRowClick(r)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FtSubgroupAcquisto({
  eventoId,
  items,
  onRowClick,
}: {
  eventoId: string;
  items: FoodTruckEdit[];
  onRowClick: (f: FoodTruckEdit) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="mb-1.5 px-1">
        <span className="text-xs uppercase tracking-wide text-neutral-500 font-medium">
          Acquisto e rivendita ({items.length})
        </span>
      </div>
      <div className="bg-white rounded-3xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200">
            <tr>
              <Th align="left">Nome</Th>
              <Th align="right">Costo unit.</Th>
              <Th align="right">Vendita unit.</Th>
              <Th align="right">Qty stim.</Th>
              <Th align="right">Margine</Th>
              <Th align="center">
                <span className="sr-only">Selezionata</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <FtRowAcquisto
                key={r.id}
                eventoId={eventoId}
                row={r}
                onClick={() => onRowClick(r)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FtRowPercentuale({
  eventoId,
  row,
  onClick,
}: {
  eventoId: string;
  row: FoodTruckEdit;
  onClick: () => void;
}) {
  const [pending, startTransition] = useTransition();
  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      await toggleFoodTruckSelezionata(eventoId, row.id, !row.selezionata);
    });
  }
  const guadagno = guadagnoFoodTruck(row);
  return (
    <tr
      onClick={onClick}
      className={`border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 cursor-pointer ${
        row.selezionata ? "bg-amber-50/40" : ""
      }`}
    >
      <td className="px-4 py-3 text-neutral-900 font-medium">{row.nome}</td>
      <td className="px-4 py-3 text-neutral-700 text-right tabular-nums">
        {formatMoney(Number(row.incasso_lordo_stimato))}
      </td>
      <td className="px-4 py-3 text-neutral-700 text-right tabular-nums">
        {Number(row.percentuale_matazz)}%
      </td>
      <td className="px-4 py-3 text-green-700 text-right tabular-nums font-medium">
        {formatMoney(guadagno)}
      </td>
      <td className="px-4 py-3 text-center">
        <SelToggle
          pending={pending}
          selected={row.selezionata}
          onClick={toggle}
        />
      </td>
    </tr>
  );
}

function FtRowAcquisto({
  eventoId,
  row,
  onClick,
}: {
  eventoId: string;
  row: FoodTruckEdit;
  onClick: () => void;
}) {
  const [pending, startTransition] = useTransition();
  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      await toggleFoodTruckSelezionata(eventoId, row.id, !row.selezionata);
    });
  }
  const guadagno = guadagnoFoodTruck(row);
  return (
    <tr
      onClick={onClick}
      className={`border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 cursor-pointer ${
        row.selezionata ? "bg-amber-50/40" : ""
      }`}
    >
      <td className="px-4 py-3 text-neutral-900 font-medium">{row.nome}</td>
      <td className="px-4 py-3 text-neutral-700 text-right tabular-nums">
        {formatMoney(Number(row.costo_unitario ?? 0))}
      </td>
      <td className="px-4 py-3 text-neutral-700 text-right tabular-nums">
        {formatMoney(Number(row.prezzo_vendita ?? 0))}
      </td>
      <td className="px-4 py-3 text-neutral-900 text-right tabular-nums">
        {Number(row.quantita_stimata ?? 0)}
      </td>
      <td
        className={`px-4 py-3 text-right tabular-nums font-medium ${
          guadagno >= 0 ? "text-green-700" : "text-red-700"
        }`}
      >
        {formatMoney(guadagno)}
      </td>
      <td className="px-4 py-3 text-center">
        <SelToggle
          pending={pending}
          selected={row.selezionata}
          onClick={toggle}
        />
      </td>
    </tr>
  );
}

function SelToggle({
  pending,
  selected,
  onClick,
}: {
  pending: boolean;
  selected: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={selected ? "Deseleziona" : "Seleziona"}
      title={selected ? "Deseleziona" : "Seleziona (entra nel budget)"}
      className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors disabled:opacity-50 ${
        selected
          ? "bg-green-100 text-green-700 hover:bg-green-200"
          : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
      }`}
    >
      {selected ? (
        <Check className="w-4 h-4" />
      ) : (
        <Circle className="w-4 h-4" />
      )}
    </button>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-3xl bg-white p-8 text-center">
      <p className="text-sm text-neutral-600">{text}</p>
    </div>
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
