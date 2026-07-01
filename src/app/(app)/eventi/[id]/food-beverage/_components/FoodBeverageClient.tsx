"use client";

import { useState, useTransition } from "react";
import { Plus, Check, Circle, Power } from "lucide-react";
import { formatMoney } from "@/lib/format";
import {
  aggiornaStimePersoneR,
  aggiornaBarCostoRealeR,
  aggiornaBarPagatoDaR,
  aggiornaFoodTruckCostoRealeR,
  toggleBarAttivoR,
  toggleFoodTruckAttivoR,
  toggleFoodTruckSelezionata,
} from "../actions";
import { BarModal, type BarEdit } from "./BarModal";
import { FoodTruckModal, type FoodTruckEdit } from "./FoodTruckModal";

type Props = {
  eventoId: string;
  personeStimati: number;
  barAttivo: boolean;
  foodTruckAttivo: boolean;
  bar: BarEdit[];
  foodTruck: FoodTruckEdit[];
  barCostoRealeNostri: number | null;
  barCostoRealeFornitori: number | null;
  barPagatoDaNostri: string | null;
  barPagatoDaFornitori: string | null;
  foodTruckCostoRealeAcquisto: number | null;
};

type BarModalState = { kind: "add" } | { kind: "edit"; bar: BarEdit } | null;
type FtModalState =
  | { kind: "add" }
  | { kind: "edit"; ft: FoodTruckEdit }
  | null;

function qtyVendutaBar(b: BarEdit, persone: number): number {
  return Math.round(persone * Number(b.consumo_per_persona ?? 0));
}

function qtyVendutaFood(f: FoodTruckEdit, persone: number): number {
  return Math.round(persone * Number(f.consumo_per_persona ?? 0));
}

function guadagnoFoodTruck(ft: FoodTruckEdit, persone: number): number {
  if (ft.modello === "Acquisto") {
    const qtyVend = qtyVendutaFood(ft, persone);
    const margine =
      Number(ft.prezzo_vendita ?? 0) - Number(ft.costo_unitario ?? 0);
    return margine * qtyVend;
  }
  return (
    (Number(ft.incasso_lordo_stimato) * Number(ft.percentuale_matazz)) / 100
  );
}

export function FoodBeverageClient({
  eventoId,
  personeStimati,
  barAttivo,
  foodTruckAttivo,
  bar,
  foodTruck,
  barCostoRealeNostri,
  barCostoRealeFornitori,
  barPagatoDaNostri,
  barPagatoDaFornitori,
  foodTruckCostoRealeAcquisto,
}: Props) {
  const [barModal, setBarModal] = useState<BarModalState>(null);
  const [ftModal, setFtModal] = useState<FtModalState>(null);

  const barNoi = bar.filter((b) => b.fonte === "Noi");
  const barFornitore = bar.filter((b) => b.fonte === "Fornitore");

  function barTotals(items: BarEdit[]) {
    const ricavo = items.reduce(
      (s, r) =>
        s +
        Number(r.prezzo_vendita ?? 0) * qtyVendutaBar(r, personeStimati),
      0,
    );
    const costo = items.reduce(
      (s, r) =>
        s +
        Number(r.costo_unitario ?? 0) * qtyVendutaBar(r, personeStimati),
      0,
    );
    return { ricavo, costo, margine: ricavo - costo };
  }

  const tNoi = barTotals(barNoi);
  const tForn = barTotals(barFornitore);
  const tBarTotale = barTotals(bar);

  const mediaConsumoBar = bar.reduce(
    (s, r) => s + Number(r.consumo_per_persona ?? 0),
    0,
  );

  const ftPercentuale = foodTruck.filter((f) => f.modello === "Percentuale");
  const ftAcquisto = foodTruck.filter((f) => f.modello === "Acquisto");

  const ftTotaleSel = foodTruck
    .filter((r) => r.selezionata)
    .reduce((s, r) => s + guadagnoFoodTruck(r, personeStimati), 0);

  return (
    <>
      <PersoneAtteseEditor
        eventoId={eventoId}
        personeStimati={personeStimati}
      />

      {/* --- BAR --- */}
      <section className={`space-y-3 ${barAttivo ? "" : "opacity-60"}`}>
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2 flex-wrap">
              <span aria-hidden>🍻</span>
              <span>Bar</span>
              <span className="text-sm text-neutral-500 font-normal">
                ({bar.length})
              </span>
              <SezioneToggle
                eventoId={eventoId}
                attivo={barAttivo}
                kind="bar"
              />
              {!barAttivo && (
                <span className="text-sm text-amber-700 font-medium">
                  escluso dal budget
                </span>
              )}
            </h3>
            <div className="inline-flex items-center gap-3 rounded-2xl bg-neutral-50 border border-neutral-200 px-4 py-2 text-sm">
              <span className="text-neutral-700">
                Costo{" "}
                <strong className="text-neutral-900">
                  {formatMoney(tBarTotale.costo)}
                </strong>
              </span>
              <span className="text-neutral-300">·</span>
              <span className="text-neutral-700">
                Ricavo{" "}
                <strong className="text-neutral-900">
                  {formatMoney(tBarTotale.ricavo)}
                </strong>
              </span>
              <span className="text-neutral-300">·</span>
              <span
                className={
                  tBarTotale.margine >= 0
                    ? "text-green-700"
                    : "text-red-700"
                }
              >
                Margine{" "}
                <strong>{formatMoney(tBarTotale.margine)}</strong>
              </span>
            </div>
            {bar.length > 0 && (
              <p className="text-xs text-neutral-500">
                Media consumo:{" "}
                <strong className="text-neutral-700">
                  {mediaConsumoBar.toFixed(1)}
                </strong>{" "}
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
          <>
            <BarSubgroup
              label="Nostri"
              fonte="Nostri"
              eventoId={eventoId}
              items={barNoi}
              persone={personeStimati}
              totals={tNoi}
              costoReale={barCostoRealeNostri}
              pagatoDa={barPagatoDaNostri}
              onRowClick={(b) => setBarModal({ kind: "edit", bar: b })}
            />
            <BarSubgroup
              label="Fornitori"
              fonte="Fornitori"
              eventoId={eventoId}
              items={barFornitore}
              persone={personeStimati}
              totals={tForn}
              costoReale={barCostoRealeFornitori}
              pagatoDa={barPagatoDaFornitori}
              showFornitore
              onRowClick={(b) => setBarModal({ kind: "edit", bar: b })}
            />
          </>
        )}
      </section>

      {/* --- FOOD TRUCK --- */}
      <section className={`space-y-3 ${foodTruckAttivo ? "" : "opacity-60"}`}>
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2 flex-wrap">
              <span aria-hidden>🚚</span>
              <span>Food truck</span>
              <span className="text-sm text-neutral-500 font-normal">
                ({foodTruck.length})
              </span>
              <SezioneToggle
                eventoId={eventoId}
                attivo={foodTruckAttivo}
                kind="food_truck"
              />
              {!foodTruckAttivo && (
                <span className="text-sm text-amber-700 font-medium">
                  escluso dal budget
                </span>
              )}
            </h3>
            <div className="inline-flex items-center gap-2 rounded-2xl bg-neutral-50 border border-neutral-200 px-4 py-2 text-sm">
              <span className="text-neutral-700">
                Guadagno nostro selezionato:
              </span>
              <strong className="text-green-700">
                {formatMoney(ftTotaleSel)}
              </strong>
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
              costoRealeAcquisto={foodTruckCostoRealeAcquisto}
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
        <span className="text-sm font-medium text-neutral-800">
          Persone attese
        </span>
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
        È il numero usato per stimare le vendite (bar e food truck acquisto).
      </span>
      {savedFlash && (
        <span className="text-xs text-green-700">Salvato ✓</span>
      )}
    </section>
  );
}

function BarSubgroup({
  label,
  fonte,
  eventoId,
  items,
  persone,
  totals: t,
  costoReale,
  pagatoDa,
  showFornitore,
  onRowClick,
}: {
  label: string;
  fonte: "Nostri" | "Fornitori";
  eventoId: string;
  items: BarEdit[];
  persone: number;
  totals: { ricavo: number; costo: number; margine: number };
  costoReale: number | null;
  pagatoDa: string | null;
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
      <BarCostoRealeRow
        eventoId={eventoId}
        fonte={fonte}
        costoStimato={t.costo}
        costoReale={costoReale}
        pagatoDa={pagatoDa}
      />
      <div className="bg-white rounded-3xl overflow-hidden mt-2">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200">
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
              const qtyVend = qtyVendutaBar(r, persone);
              const ricavo = Number(r.prezzo_vendita ?? 0) * qtyVend;
              const costo = Number(r.costo_unitario ?? 0) * qtyVend;
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
                    {Number(r.consumo_per_persona ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-neutral-900 text-right tabular-nums">
                    {qtyVend}
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

function CostoRealeRow({
  eventoId,
  label,
  costoStimato,
  costoReale,
  onSave,
  extra,
}: {
  eventoId: string;
  label: string;
  costoStimato: number;
  costoReale: number | null;
  onSave: (val: number | null) => Promise<{ ok: boolean }>;
  extra?: React.ReactNode;
}) {
  const [local, setLocal] = useState<string>(
    costoReale != null ? String(costoReale) : "",
  );
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function commit() {
    const trimmed = local.trim();
    const val = trimmed === "" ? null : Number(trimmed);
    if (val !== null && !Number.isFinite(val)) return;
    startTransition(async () => {
      const res = await onSave(val);
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }
    });
  }

  return (
    <div className="inline-flex items-center gap-3 rounded-2xl bg-neutral-50 border border-neutral-200 px-4 py-2 text-sm flex-wrap mb-2">
      <span className="text-neutral-700 font-medium">{label}</span>
      <span className="text-neutral-300">·</span>
      <span className="text-neutral-500">
        stima{" "}
        <strong className="text-neutral-700">{formatMoney(costoStimato)}</strong>
      </span>
      {costoReale != null && (
        <>
          <span className="text-neutral-300">·</span>
          <span
            className={`font-medium ${
              costoReale > costoStimato ? "text-red-700" : "text-green-700"
            }`}
          >
            {costoReale > costoStimato ? "↑" : "↓"} reale{" "}
            <strong>{formatMoney(costoReale)}</strong>
          </span>
        </>
      )}
      <span className="text-neutral-300">·</span>
      <div className="inline-flex items-center gap-1.5">
        <span className="text-neutral-500 text-xs">inserisci reale CHF</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={local}
          placeholder="—"
          onChange={(e) => setLocal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          disabled={pending}
          className={`w-28 px-2 py-1 rounded-lg text-sm tabular-nums text-right border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
            saved
              ? "border-green-400 bg-green-50"
              : local.trim()
                ? "border-amber-400 bg-amber-50"
                : "border-neutral-200 bg-white hover:border-neutral-300"
          }`}
        />
      </div>
      {extra}
    </div>
  );
}

function BarCostoRealeRow({
  eventoId,
  fonte,
  costoStimato,
  costoReale,
  pagatoDa,
}: {
  eventoId: string;
  fonte: "Nostri" | "Fornitori";
  costoStimato: number;
  costoReale: number | null;
  pagatoDa: string | null;
}) {
  const [localPagato, setLocalPagato] = useState<string>(pagatoDa ?? "");
  const [pending, startTransition] = useTransition();

  function commitPagato() {
    const val = localPagato.trim() || null;
    startTransition(async () => {
      await aggiornaBarPagatoDaR(eventoId, fonte, val);
    });
  }

  return (
    <CostoRealeRow
      eventoId={eventoId}
      label="Costo reale post-evento"
      costoStimato={costoStimato}
      costoReale={costoReale}
      onSave={(val) => aggiornaBarCostoRealeR(eventoId, fonte, val)}
      extra={
        <>
          <span className="text-neutral-300">·</span>
          <div className="inline-flex items-center gap-1.5">
            <span className="text-neutral-500 text-xs">Pagato da</span>
            <input
              type="text"
              value={localPagato}
              placeholder="—"
              onChange={(e) => setLocalPagato(e.target.value)}
              onBlur={commitPagato}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              disabled={pending}
              className={`w-32 px-2 py-1 rounded-lg text-sm border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                localPagato.trim()
                  ? "border-amber-400 bg-amber-50"
                  : "border-neutral-200 bg-white hover:border-neutral-300"
              }`}
            />
          </div>
        </>
      }
    />
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
  costoRealeAcquisto,
  onRowClick,
}: {
  eventoId: string;
  items: FoodTruckEdit[];
  persone: number;
  costoRealeAcquisto: number | null;
  onRowClick: (f: FoodTruckEdit) => void;
}) {
  if (items.length === 0) return null;

  const costoStimatoTotale = items.reduce((s, r) => {
    const qtaAcq = Number(r.quantita_acquistata ?? 0);
    return s + Number(r.costo_unitario ?? 0) * qtaAcq;
  }, 0);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5 px-1">
        <span className="text-xs uppercase tracking-wide text-neutral-500 font-medium">
          Acquisto e rivendita ({items.length})
        </span>
        <span className="text-xs text-neutral-500">{persone} persone</span>
      </div>
      <CostoRealeRow
        eventoId={eventoId}
        label="Costo acquisto reale"
        costoStimato={costoStimatoTotale}
        costoReale={costoRealeAcquisto}
        onSave={(val) => aggiornaFoodTruckCostoRealeR(eventoId, val)}
      />
      <div className="bg-white rounded-3xl overflow-x-auto mt-2">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200">
            <tr>
              <Th align="left">Nome</Th>
              <Th align="right">Costo unit.</Th>
              <Th align="right">Vendita unit.</Th>
              <Th align="right">Consumo/p</Th>
              <Th align="right">Stim. vendute</Th>
              <Th align="right">Guadagno stim.</Th>
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
  const qtyVend = qtyVendutaFood(row, persone);
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
        {Number(row.consumo_per_persona ?? 0)}
      </td>
      <td className="px-4 py-3 text-neutral-900 text-right tabular-nums">
        {qtyVend}
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
      if (kind === "bar") {
        await toggleBarAttivoR(eventoId, !attivo);
      } else {
        await toggleFoodTruckAttivoR(eventoId, !attivo);
      }
    });
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      title={
        attivo
          ? "Sezione attiva — clicca per escluderla dal budget"
          : "Sezione disattivata — clicca per riattivarla"
      }
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
