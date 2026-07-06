"use client";

import { useState, useTransition } from "react";
import { Plus, Check, Circle, Power } from "lucide-react";
import { formatMoney, fmtOrDash } from "@/lib/format";
import {
  aggiornaStimePersoneR,
  upsertBarCostoRealeR,
  toggleBarAttivoR,
  toggleFoodTruckAttivoR,
  toggleFoodTruckSelezionata,
} from "../actions";
import { BarModal, type BarEdit } from "./BarModal";
import { FoodTruckModal, type FoodTruckEdit } from "./FoodTruckModal";

type BarCostoRealeEntry = { costo_reale: number | null; pagato_da: string | null };

type Props = {
  eventoId: string;
  personeStimati: number;
  barAttivo: boolean;
  foodTruckAttivo: boolean;
  bar: BarEdit[];
  foodTruck: FoodTruckEdit[];
  barCostiReali: Record<string, BarCostoRealeEntry>;
};

type BarModalState = { kind: "add" } | { kind: "edit"; bar: BarEdit } | null;
type FtModalState = { kind: "add" } | { kind: "edit"; ft: FoodTruckEdit } | null;

function calcTotals(items: BarEdit[], persone: number) {
  const ricavo = items.reduce(
    (s, r) => s + Number(r.prezzo_vendita ?? 0) * Math.round(persone * Number(r.consumo_per_persona ?? 0)),
    0,
  );
  const costo = items.reduce(
    (s, r) => s + Number(r.costo_unitario ?? 0) * Math.round(persone * Number(r.consumo_per_persona ?? 0)),
    0,
  );
  return { ricavo, costo, margine: ricavo - costo };
}

function guadagnoFoodTruck(ft: FoodTruckEdit, persone: number): number {
  if (ft.modello === "Acquisto") {
    const qtyVend = Math.round(persone * Number(ft.consumo_per_persona ?? 0));
    return (Number(ft.prezzo_vendita ?? 0) - Number(ft.costo_unitario ?? 0)) * qtyVend;
  }
  return (Number(ft.incasso_lordo_stimato) * Number(ft.percentuale_matazz)) / 100;
}

function calcFtTotals(items: FoodTruckEdit[], persone: number) {
  let costo = 0, ricavo = 0;
  for (const r of items) {
    if (r.modello === "Acquisto") {
      const qty = Math.round(persone * Number(r.consumo_per_persona ?? 0));
      costo += Number(r.costo_unitario ?? 0) * qty;
      ricavo += Number(r.prezzo_vendita ?? 0) * qty;
    } else {
      ricavo += (Number(r.incasso_lordo_stimato) * Number(r.percentuale_matazz)) / 100;
    }
  }
  return { costo, ricavo, margine: ricavo - costo };
}

export function FoodBeverageClient({
  eventoId,
  personeStimati,
  barAttivo,
  foodTruckAttivo,
  bar,
  foodTruck,
  barCostiReali,
}: Props) {
  const [barModal, setBarModal] = useState<BarModalState>(null);
  const [ftModal, setFtModal] = useState<FtModalState>(null);

  const barNoi = bar.filter((b) => b.fonte === "Noi");
  const barFornitore = bar.filter((b) => b.fonte === "Fornitore");
  const uniqueFornitori = [
    ...new Set(barFornitore.map((b) => b.fornitore ?? "").filter(Boolean)),
  ];
  const barFornitoreNoNome = barFornitore.filter((b) => !b.fornitore);

  const tBarTotale = calcTotals(bar, personeStimati);
  const mediaConsumoBar = bar.reduce((s, r) => s + Number(r.consumo_per_persona ?? 0), 0);
  const barCostoRealeEntries = Object.values(barCostiReali).filter(e => e.costo_reale != null);
  const totaleCostoRealeBar = barCostoRealeEntries.reduce((s, e) => s + (e.costo_reale ?? 0), 0);

  const ftPercentuale = foodTruck.filter((f) => f.modello === "Percentuale");
  const ftAcquisto = foodTruck.filter((f) => f.modello === "Acquisto");
  const ftTotaleSel = foodTruck
    .filter((r) => r.selezionata)
    .reduce((s, r) => s + guadagnoFoodTruck(r, personeStimati), 0);
  const tFtTotale = calcFtTotals(foodTruck.filter((r) => r.selezionata), personeStimati);
  const ftCostoReale = ftAcquisto.reduce(
    (s, r) => s + Number(r.quantita_acquistata ?? 0) * Number(r.costo_unitario ?? 0),
    0,
  );

  return (
    <>
      <PersoneAtteseEditor eventoId={eventoId} personeStimati={personeStimati} />

      {/* ---- BAR ---- */}
      <section className={`space-y-4 ${barAttivo ? "" : "opacity-60"}`}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-neutral-900 flex items-center gap-2 flex-wrap">
              <span aria-hidden>🍻</span>
              <span>Bar</span>
              <span className="text-sm text-neutral-500 font-normal">({bar.length})</span>
              <SezioneToggle eventoId={eventoId} attivo={barAttivo} kind="bar" />
              {!barAttivo && (
                <span className="text-sm text-amber-700 font-medium">escluso dal budget</span>
              )}
            </h3>
            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center gap-3 rounded-2xl bg-neutral-50 border border-neutral-200 px-4 py-2 text-sm flex-wrap">
                <StimaBadge />
                <span className="text-neutral-700">
                  Costo{" "}
                  <strong className="text-neutral-900">{formatMoney(tBarTotale.costo)}</strong>
                </span>
                <span className="text-neutral-300">·</span>
                <span className="text-neutral-700">
                  Ricavo{" "}
                  <strong className="text-neutral-900">{formatMoney(tBarTotale.ricavo)}</strong>
                </span>
                <span className="text-neutral-300">·</span>
                <span className={tBarTotale.margine >= 0 ? "text-green-700" : "text-red-700"}>
                  Margine <strong>{formatMoney(tBarTotale.margine)}</strong>
                </span>
              </div>
              {barCostoRealeEntries.length > 0 && (
                <div className="inline-flex items-center gap-3 rounded-2xl bg-neutral-50 border border-neutral-200 px-4 py-2 text-sm flex-wrap">
                  <CostoRealeBadge />
                  <span className="text-neutral-700">
                    Costo{" "}
                    <strong className="text-amber-700">{formatMoney(totaleCostoRealeBar)}</strong>
                  </span>
                </div>
              )}
            </div>
            {bar.length > 0 && (
              <p className="text-xs text-neutral-500">
                Media consumo:{" "}
                <strong className="text-neutral-700">{mediaConsumoBar.toFixed(1)}</strong>{" "}
                bevande/persona
              </p>
            )}
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
          <div className="space-y-5">
            {barNoi.length > 0 && (
              <BarSubgroup
                label="Nostra spesa"
                fonte="Nostri"
                eventoId={eventoId}
                items={barNoi}
                persone={personeStimati}
                entry={barCostiReali["Nostri"] ?? null}
                onRowClick={(b) => setBarModal({ kind: "edit", bar: b })}
              />
            )}
            {uniqueFornitori.map((fornitore) => (
              <BarSubgroup
                key={fornitore}
                label={fornitore}
                fonte={fornitore}
                eventoId={eventoId}
                items={barFornitore.filter((b) => (b.fornitore ?? "") === fornitore)}
                persone={personeStimati}
                entry={barCostiReali[fornitore] ?? null}
                onRowClick={(b) => setBarModal({ kind: "edit", bar: b })}
              />
            ))}
            {barFornitoreNoNome.length > 0 && (
              <BarSubgroup
                label="Fornitori (senza nome)"
                fonte="Fornitori"
                eventoId={eventoId}
                items={barFornitoreNoNome}
                persone={personeStimati}
                entry={barCostiReali["Fornitori"] ?? null}
                showFornitore
                onRowClick={(b) => setBarModal({ kind: "edit", bar: b })}
              />
            )}
          </div>
        )}
      </section>

      {/* ---- FOOD TRUCK ---- */}
      <section className={`space-y-3 ${foodTruckAttivo ? "" : "opacity-60"}`}>
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-neutral-900 flex items-center gap-2 flex-wrap">
              <span aria-hidden>🚚</span>
              <span>Food truck</span>
              <span className="text-sm text-neutral-500 font-normal">({foodTruck.length})</span>
              <SezioneToggle eventoId={eventoId} attivo={foodTruckAttivo} kind="food_truck" />
              {!foodTruckAttivo && (
                <span className="text-sm text-amber-700 font-medium">escluso dal budget</span>
              )}
            </h3>
            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center gap-3 rounded-2xl bg-neutral-50 border border-neutral-200 px-4 py-2 text-sm flex-wrap">
                <StimaBadge />
                <span className="text-neutral-700">
                  Costo{" "}
                  <strong className="text-neutral-900">{formatMoney(tFtTotale.costo)}</strong>
                </span>
                <span className="text-neutral-300">·</span>
                <span className="text-neutral-700">
                  Ricavo{" "}
                  <strong className="text-neutral-900">{formatMoney(tFtTotale.ricavo)}</strong>
                </span>
                <span className="text-neutral-300">·</span>
                <span className={tFtTotale.margine >= 0 ? "text-green-700" : "text-red-700"}>
                  Margine <strong>{formatMoney(tFtTotale.margine)}</strong>
                </span>
              </div>
              {ftCostoReale > 0 && (
                <div className="inline-flex items-center gap-3 rounded-2xl bg-neutral-50 border border-neutral-200 px-4 py-2 text-sm flex-wrap">
                  <CostoRealeBadge />
                  <span className="text-neutral-700">
                    Costo acquisto{" "}
                    <strong className="text-amber-700">{formatMoney(ftCostoReale)}</strong>
                  </span>
                </div>
              )}
            </div>
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
          </>
        )}
      </section>

      <BarModal eventoId={eventoId} mode={barModal} onClose={() => setBarModal(null)} />
      <FoodTruckModal eventoId={eventoId} mode={ftModal} onClose={() => setFtModal(null)} />
    </>
  );
}

// ---- PersoneAtteseEditor ----

function PersoneAtteseEditor({
  eventoId,
  personeStimati,
}: {
  eventoId: string;
  personeStimati: number;
}) {
  const [persone, setPersone] = useState(String(personeStimati));
  const [pending, startTransition] = useTransition();
  const [savedFlash, setSavedFlash] = useState(false);

  function save() {
    startTransition(async () => {
      const res = await aggiornaStimePersoneR(eventoId, persone);
      if (res.ok) {
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1500);
      }
    });
  }

  return (
    <section className="bg-white rounded-3xl p-4 flex items-center gap-3 flex-wrap">
      <label className="flex items-center gap-2">
        <span className="text-sm font-medium text-neutral-800">Persone attese</span>
        <input
          type="number"
          min="0"
          step="1"
          value={persone}
          onChange={(e) => setPersone(e.target.value)}
          onBlur={save}
          disabled={pending}
          className="w-28 px-2 py-1 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </label>
      <span className="text-sm text-neutral-500">
        Usato per stimare le vendite (bar e food truck acquisto).
      </span>
      {savedFlash && <span className="text-xs text-green-700">Salvato ✓</span>}
    </section>
  );
}

// ---- BarSubgroup ----

function BarSubgroup({
  label,
  fonte,
  eventoId,
  items,
  persone,
  entry,
  showFornitore = false,
  onRowClick,
}: {
  label: string;
  fonte: string;
  eventoId: string;
  items: BarEdit[];
  persone: number;
  entry: BarCostoRealeEntry | null;
  showFornitore?: boolean;
  onRowClick: (b: BarEdit) => void;
}) {
  if (items.length === 0) return null;
  const t = calcTotals(items, persone);

  return (
    <div className="rounded-3xl border border-neutral-200 overflow-hidden">
      {/* Header: label + costo reale sulla stessa riga */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-neutral-50 border-b border-neutral-200 flex-wrap">
        <span className="text-sm font-bold text-neutral-800">
          {label}{" "}
          <span className="text-neutral-400 font-normal text-xs">({items.length})</span>
        </span>
        <CostoRealeCard
          fonte={fonte}
          eventoId={eventoId}
          costoStimato={t.costo}
          costoReale={entry?.costo_reale ?? null}
          pagatoDa={entry?.pagato_da ?? null}
        />
      </div>
      {/* Tabella */}
      <div className="bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-100">
            <tr>
              <Th align="left">Articolo</Th>
              {showFornitore && <Th align="left">Fornitore</Th>}
              <Th align="right">Costo unit.</Th>
              <Th align="right">Vendita unit.</Th>
              <Th align="right">Consumo/p</Th>
              <Th align="right">Stim. vendute</Th>
              <Th align="right">Margine stim.</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => {
              const qty = Math.round(persone * Number(r.consumo_per_persona ?? 0));
              const margine =
                (Number(r.prezzo_vendita ?? 0) - Number(r.costo_unitario ?? 0)) * qty;
              return (
                <tr
                  key={r.id}
                  onClick={() => onRowClick(r)}
                  className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 cursor-pointer"
                >
                  <td className="px-4 py-3 text-neutral-900 font-medium">{r.articolo}</td>
                  {showFornitore && (
                    <td className="px-4 py-3 text-neutral-700">{r.fornitore ?? "—"}</td>
                  )}
                  <td className="px-4 py-3 text-neutral-700 text-right tabular-nums">
                    {fmtOrDash(Number(r.costo_unitario ?? 0))}
                  </td>
                  <td className="px-4 py-3 text-neutral-700 text-right tabular-nums">
                    {fmtOrDash(Number(r.prezzo_vendita ?? 0))}
                  </td>
                  <td className="px-4 py-3 text-neutral-700 text-right tabular-nums">
                    {Number(r.consumo_per_persona ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-neutral-900 text-right tabular-nums">{qty}</td>
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
      {/* Footer: stima in fondo */}
      <div className="flex items-center justify-end gap-3 px-4 py-2.5 bg-neutral-50 border-t border-neutral-100 text-xs">
        <StimaBadge />
        <span className="text-neutral-600">
          costo <strong className="text-neutral-700">{formatMoney(t.costo)}</strong>
        </span>
        <span className="text-neutral-300">·</span>
        <span className={t.margine >= 0 ? "text-green-600" : "text-red-600"}>
          margine <strong>{formatMoney(t.margine)}</strong>
        </span>
      </div>
    </div>
  );
}

// ---- CostoRealeCard ----

function CostoRealeCard({
  fonte,
  eventoId,
  costoStimato,
  costoReale: initCostoReale,
  pagatoDa: initPagatoDa,
}: {
  fonte: string;
  eventoId: string;
  costoStimato: number;
  costoReale: number | null;
  pagatoDa: string | null;
}) {
  const [mode, setMode] = useState<"display" | "edit">(
    initCostoReale == null ? "edit" : "display",
  );
  const [localCosto, setLocalCosto] = useState(
    initCostoReale != null ? String(initCostoReale) : "",
  );
  const [localPagato, setLocalPagato] = useState(initPagatoDa ?? "");
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState<{
    costo: number | null;
    pagato: string | null;
  }>({ costo: initCostoReale, pagato: initPagatoDa });

  function save() {
    const costoVal =
      localCosto.trim() === "" ? null : Number(localCosto.trim());
    if (costoVal !== null && !Number.isFinite(costoVal)) return;
    const pagatoVal = localPagato.trim() || null;
    startTransition(async () => {
      const res = await upsertBarCostoRealeR(eventoId, fonte, costoVal, pagatoVal);
      if (res.ok) {
        setCurrent({ costo: costoVal, pagato: pagatoVal });
        if (costoVal != null) setMode("display");
      }
    });
  }

  function startEdit() {
    setLocalCosto(current.costo != null ? String(current.costo) : "");
    setLocalPagato(current.pagato ?? "");
    setMode("edit");
  }

  if (mode === "display" && current.costo != null) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <CostoRealeBadge />
        <span className="text-amber-700 font-bold text-sm tabular-nums">
          {formatMoney(current.costo)}
        </span>
        {current.pagato && (
          <span className="text-xs text-neutral-500">
            · <strong className="text-neutral-700">{current.pagato}</strong>
          </span>
        )}
        <button
          type="button"
          onClick={startEdit}
          className="text-xs text-neutral-400 hover:text-neutral-700 underline"
        >
          Modifica
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <CostoRealeBadge />
      <span className="text-neutral-300">|</span>
      <div className="inline-flex items-center gap-1">
        <span className="text-xs text-neutral-400">CHF</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={localCosto}
          placeholder="—"
          onChange={(e) => setLocalCosto(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); }}
          disabled={pending}
          className="w-24 px-2 py-0.5 rounded-lg text-xs tabular-nums text-right border border-neutral-200 bg-white hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-red-400"
        />
      </div>
      <div className="inline-flex items-center gap-1">
        <span className="text-xs text-neutral-400">da</span>
        <input
          type="text"
          value={localPagato}
          placeholder="—"
          onChange={(e) => setLocalPagato(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); }}
          disabled={pending}
          className="w-28 px-2 py-0.5 rounded-lg text-xs border border-neutral-200 bg-white hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-red-400"
        />
      </div>
      <div className="inline-flex items-center gap-1.5">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="px-2.5 py-0.5 rounded-full bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 disabled:opacity-50"
        >
          Salva
        </button>
        {current.costo != null && (
          <button
            type="button"
            onClick={() => setMode("display")}
            disabled={pending}
            className="text-xs text-neutral-400 hover:text-neutral-600"
          >
            Annulla
          </button>
        )}
      </div>
    </div>
  );
}

// ---- Food Truck subgroups ----

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
    <div className="space-y-2">
      <div className="px-1">
        <span className="text-xs uppercase tracking-wide text-neutral-500 font-semibold">
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
                <span className="sr-only">Sel.</span>
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
    <div className="space-y-2">
      <div className="flex items-baseline justify-between px-1">
        <span className="text-xs uppercase tracking-wide text-neutral-500 font-semibold">
          Acquisto e rivendita ({items.length})
        </span>
        <span className="text-xs text-neutral-400">{persone} persone</span>
      </div>
      <div className="bg-white rounded-3xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200">
            <tr>
              <Th align="left">Nome</Th>
              <Th align="right">Costo unit.</Th>
              <Th align="right">Vendita unit.</Th>
              <Th align="right">Consumo/p</Th>
              <Th align="right">Qtà acquistata</Th>
              <Th align="right">Spesa acquisto</Th>
              <Th align="right">Stim. vendute</Th>
              <Th align="right">Guadagno stim.</Th>
              <Th align="left">Chi ha pagato</Th>
              <Th align="center">
                <span className="sr-only">Sel.</span>
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
      className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 cursor-pointer"
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
        <SelToggle pending={pending} selected={row.selezionata} onClick={toggle} />
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
  const qtyVend = Math.round(persone * Number(row.consumo_per_persona ?? 0));
  const qtaAcq = Number(row.quantita_acquistata ?? 0);
  const costoAcquisto = Number(row.costo_unitario ?? 0) * qtaAcq;
  const guadagno = guadagnoFoodTruck(row, persone);
  return (
    <tr
      onClick={onClick}
      className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 cursor-pointer"
    >
      <td className="px-4 py-3 text-neutral-900 font-medium">{row.nome}</td>
      <td className="px-4 py-3 text-neutral-700 text-right tabular-nums">
        {formatMoney(Number(row.costo_unitario ?? 0))}
      </td>
      <td className="px-4 py-3 text-neutral-700 text-right tabular-nums">
        {formatMoney(Number(row.prezzo_vendita ?? 0))}
      </td>
      <td className="px-4 py-3 text-neutral-700 text-right tabular-nums">
        {Number(row.consumo_per_persona ?? 0)}
      </td>
      <td className="px-4 py-3 text-neutral-700 text-right tabular-nums">
        {qtaAcq > 0 ? qtaAcq : "—"}
      </td>
      <td className="px-4 py-3 text-red-700 text-right tabular-nums font-medium">
        {qtaAcq > 0 ? formatMoney(costoAcquisto) : "—"}
      </td>
      <td className="px-4 py-3 text-neutral-900 text-right tabular-nums">{qtyVend}</td>
      <td
        className={`px-4 py-3 text-right tabular-nums font-medium ${
          guadagno >= 0 ? "text-green-700" : "text-red-700"
        }`}
      >
        {formatMoney(guadagno)}
      </td>
      <td className="px-4 py-3 text-neutral-600 text-sm">
        {row.pagato_da ?? <span className="text-neutral-300">—</span>}
      </td>
      <td className="px-4 py-3 text-center">
        <SelToggle pending={pending} selected={row.selezionata} onClick={toggle} />
      </td>
    </tr>
  );
}

// ---- Utility components ----

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
      {selected ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
    </button>
  );
}

function SezioneToggle({
  eventoId,
  attivo,
  kind,
}: {
  eventoId: string;
  attivo: boolean;
  kind: "bar" | "food_truck";
}) {
  const [pending, startTransition] = useTransition();
  function onClick(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      if (kind === "bar") await toggleBarAttivoR(eventoId, !attivo);
      else await toggleFoodTruckAttivoR(eventoId, !attivo);
    });
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      title={attivo ? "Clicca per escludere dal budget" : "Clicca per riattivare"}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
        attivo
          ? "bg-green-100 text-green-800 hover:bg-green-200"
          : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
      }`}
    >
      <Power className="w-3.5 h-3.5" />
      {attivo ? "attivo" : "spento"}
    </button>
  );
}

function StimaBadge() {
  return (
    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 shrink-0">
      Stima
    </span>
  );
}

function CostoRealeBadge() {
  return (
    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 shrink-0">
      Costo reale
    </span>
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
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return (
    <th
      className={`px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-neutral-500 ${cls}`}
    >
      {children}
    </th>
  );
}
