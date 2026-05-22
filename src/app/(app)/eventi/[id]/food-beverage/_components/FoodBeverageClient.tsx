"use client";

import { useState, useTransition } from "react";
import { Plus, Check, Circle } from "lucide-react";
import { formatMoney } from "@/lib/format";
import {
  aggiornaStimePersoneR,
  toggleFoodTruckSelezionata,
} from "../actions";
import { BarModal, type BarEdit } from "./BarModal";
import { FoodTruckModal, type FoodTruckEdit } from "./FoodTruckModal";

type Props = {
  eventoId: string;
  personeStimati: number;
  bevandePerPersona: number;
  bar: BarEdit[];
  foodTruck: FoodTruckEdit[];
};

type BarModalState = { kind: "add" } | { kind: "edit"; bar: BarEdit } | null;
type FtModalState =
  | { kind: "add" }
  | { kind: "edit"; ft: FoodTruckEdit }
  | null;

function qtyBar(b: BarEdit, totaleBevande: number): number {
  return Math.round((totaleBevande * Number(b.quota_stimata ?? 0)) / 100);
}

function qtyFoodAcquisto(f: FoodTruckEdit, persone: number): number {
  return Math.round((persone * Number(f.quota_stimata ?? 0)) / 100);
}

function guadagnoFoodTruck(ft: FoodTruckEdit, persone: number): number {
  if (ft.modello === "Acquisto") {
    const qty = qtyFoodAcquisto(ft, persone);
    return (
      (Number(ft.prezzo_vendita ?? 0) - Number(ft.costo_unitario ?? 0)) * qty
    );
  }
  return (
    (Number(ft.incasso_lordo_stimato) * Number(ft.percentuale_matazz)) / 100
  );
}

export function FoodBeverageClient({
  eventoId,
  personeStimati,
  bevandePerPersona,
  bar,
  foodTruck,
}: Props) {
  const [barModal, setBarModal] = useState<BarModalState>(null);
  const [ftModal, setFtModal] = useState<FtModalState>(null);

  const totaleBevande = Math.round(personeStimati * bevandePerPersona);

  const barNoi = bar.filter((b) => b.fonte === "Noi");
  const barFornitore = bar.filter((b) => b.fonte === "Fornitore");

  function barTotals(items: BarEdit[]) {
    const ricavo = items.reduce(
      (s, r) =>
        s + Number(r.prezzo_vendita ?? 0) * qtyBar(r, totaleBevande),
      0,
    );
    const costo = items.reduce(
      (s, r) =>
        s + Number(r.costo_unitario ?? 0) * qtyBar(r, totaleBevande),
      0,
    );
    return { ricavo, costo, margine: ricavo - costo };
  }

  const tNoi = barTotals(barNoi);
  const tForn = barTotals(barFornitore);
  const tBarTotale = barTotals(bar);

  const sommaQuoteBar = bar.reduce(
    (s, r) => s + Number(r.quota_stimata ?? 0),
    0,
  );

  const ftPercentuale = foodTruck.filter((f) => f.modello === "Percentuale");
  const ftAcquisto = foodTruck.filter((f) => f.modello === "Acquisto");

  const sommaQuoteAcquisto = ftAcquisto.reduce(
    (s, r) => s + Number(r.quota_stimata ?? 0),
    0,
  );

  const ftTotaleSel = foodTruck
    .filter((r) => r.selezionata)
    .reduce((s, r) => s + guadagnoFoodTruck(r, personeStimati), 0);

  return (
    <>
      <StimePersoneEditor
        eventoId={eventoId}
        personeStimati={personeStimati}
        bevandePerPersona={bevandePerPersona}
        totaleBevande={totaleBevande}
      />

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
              totaleBevande={totaleBevande}
              totals={tNoi}
              onRowClick={(b) => setBarModal({ kind: "edit", bar: b })}
            />
            <BarSubgroup
              label="Fornitori"
              items={barFornitore}
              totaleBevande={totaleBevande}
              totals={tForn}
              showFornitore
              onRowClick={(b) => setBarModal({ kind: "edit", bar: b })}
            />
            <QuoteIndicator label="bar" somma={sommaQuoteBar} />
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
              persone={personeStimati}
              onRowClick={(f) => setFtModal({ kind: "edit", ft: f })}
            />
            <FtSubgroupAcquisto
              eventoId={eventoId}
              items={ftAcquisto}
              persone={personeStimati}
              onRowClick={(f) => setFtModal({ kind: "edit", ft: f })}
            />
            {ftAcquisto.length > 0 && (
              <QuoteIndicator
                label="acquisto"
                somma={sommaQuoteAcquisto}
              />
            )}
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

function StimePersoneEditor({
  eventoId,
  personeStimati,
  bevandePerPersona,
  totaleBevande,
}: {
  eventoId: string;
  personeStimati: number;
  bevandePerPersona: number;
  totaleBevande: number;
}) {
  const [persone, setPersone] = useState(String(personeStimati));
  const [bev, setBev] = useState(String(bevandePerPersona));
  const [pending, startTransition] = useTransition();
  const [savedFlash, setSavedFlash] = useState(false);

  function save() {
    startTransition(async () => {
      const res = await aggiornaStimePersoneR(eventoId, persone, bev);
      if (res.ok) {
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1500);
      }
    });
  }

  return (
    <section className="bg-white rounded-3xl p-4 flex items-center gap-4 flex-wrap">
      <label className="flex items-center gap-2">
        <span className="text-sm text-neutral-700">Persone attese</span>
        <input
          type="number"
          min="0"
          step="1"
          value={persone}
          onChange={(e) => setPersone(e.target.value)}
          onBlur={save}
          disabled={pending}
          className="w-24 px-2 py-1 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </label>
      <span className="text-neutral-400">×</span>
      <label className="flex items-center gap-2">
        <span className="text-sm text-neutral-700">Bevande/persona</span>
        <input
          type="number"
          min="0"
          step="0.1"
          value={bev}
          onChange={(e) => setBev(e.target.value)}
          onBlur={save}
          disabled={pending}
          className="w-20 px-2 py-1 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </label>
      <span className="text-neutral-400">=</span>
      <span className="text-sm">
        <strong className="text-neutral-900 tabular-nums">
          {totaleBevande}
        </strong>{" "}
        <span className="text-neutral-600">bevande totali</span>
      </span>
      {savedFlash && (
        <span className="text-xs text-green-700">Salvato ✓</span>
      )}
    </section>
  );
}

function QuoteIndicator({
  label,
  somma,
}: {
  label: string;
  somma: number;
}) {
  const diff = somma - 100;
  let color = "text-green-700";
  let suffix: string | null = null;
  if (Math.abs(diff) > 0.5) {
    color = diff > 0 ? "text-orange-700" : "text-amber-700";
    suffix = diff > 0 ? `(+${diff.toFixed(0)}%)` : `(${diff.toFixed(0)}%)`;
  }
  return (
    <p className="text-xs text-neutral-500 px-1">
      Somma quote {label}:{" "}
      <strong className={`${color} tabular-nums`}>{somma.toFixed(0)}%</strong>
      {suffix && <span className={`ml-1 ${color}`}>{suffix}</span>}
    </p>
  );
}

function BarSubgroup({
  label,
  items,
  totaleBevande,
  totals: t,
  showFornitore,
  onRowClick,
}: {
  label: string;
  items: BarEdit[];
  totaleBevande: number;
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
              <Th align="right">Quota %</Th>
              <Th align="right">Qty stim.</Th>
              <Th align="right">Margine</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => {
              const qty = qtyBar(r, totaleBevande);
              const ricavo = Number(r.prezzo_vendita ?? 0) * qty;
              const costo = Number(r.costo_unitario ?? 0) * qty;
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
                  <td className="px-4 py-3 text-neutral-700 text-right tabular-nums">
                    {Number(r.quota_stimata ?? 0)}%
                  </td>
                  <td className="px-4 py-3 text-neutral-900 text-right tabular-nums">
                    {qty}
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
  persone,
  onRowClick,
}: {
  eventoId: string;
  items: FoodTruckEdit[];
  persone: number;
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
                persone={persone}
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
  persone,
  onRowClick,
}: {
  eventoId: string;
  items: FoodTruckEdit[];
  persone: number;
  onRowClick: (f: FoodTruckEdit) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5 px-1">
        <span className="text-xs uppercase tracking-wide text-neutral-500 font-medium">
          Acquisto e rivendita ({items.length})
        </span>
        <span className="text-xs text-neutral-500">{persone} persone</span>
      </div>
      <div className="bg-white rounded-3xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200">
            <tr>
              <Th align="left">Nome</Th>
              <Th align="right">Costo unit.</Th>
              <Th align="right">Vendita unit.</Th>
              <Th align="right">Quota %</Th>
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
                persone={persone}
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
  persone,
  onClick,
}: {
  eventoId: string;
  row: FoodTruckEdit;
  persone: number;
  onClick: () => void;
}) {
  const [pending, startTransition] = useTransition();
  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      await toggleFoodTruckSelezionata(eventoId, row.id, !row.selezionata);
    });
  }
  const guadagno = guadagnoFoodTruck(row, persone);
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
  persone,
  onClick,
}: {
  eventoId: string;
  row: FoodTruckEdit;
  persone: number;
  onClick: () => void;
}) {
  const [pending, startTransition] = useTransition();
  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      await toggleFoodTruckSelezionata(eventoId, row.id, !row.selezionata);
    });
  }
  const qty = qtyFoodAcquisto(row, persone);
  const guadagno = guadagnoFoodTruck(row, persone);
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
      <td className="px-4 py-3 text-neutral-700 text-right tabular-nums">
        {Number(row.quota_stimata ?? 0)}%
      </td>
      <td className="px-4 py-3 text-neutral-900 text-right tabular-nums">
        {qty}
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
