"use client";

import { useState, useTransition } from "react";
import { Plus, Check, Circle, Pencil, RefreshCw } from "lucide-react";
import { formatMoney } from "@/lib/format";
import {
  allineaCateringPersoneR,
  toggleCateringSelezionata,
} from "../actions";
import { CateringModal, type CateringEdit } from "./CateringModal";
import { OspitiModal, type OspiteCena } from "./OspitiModal";

export type OspitoCenaItem = {
  id: string;
  nome: string;
  intolleranze_cibo: string | null;
};

type Props = {
  eventoId: string;
  catering: CateringEdit[];
  ospiti: OspiteCena[];
  artistiCena: OspitoCenaItem[];
  personaleCena: OspitoCenaItem[];
};

type CatModalState =
  | { kind: "add" }
  | { kind: "edit"; catering: CateringEdit }
  | null;

function totaleOfferta(c: CateringEdit): number {
  if (c.modello === "Totale") return Number(c.prezzo_totale);
  return Number(c.prezzo_per_persona) * Number(c.numero_persone);
}

export function CenaClient({
  eventoId,
  catering,
  ospiti,
  artistiCena,
  personaleCena,
}: Props) {
  const [catModal, setCatModal] = useState<CatModalState>(null);
  const [ospitiOpen, setOspitiOpen] = useState(false);
  const [aligning, startAligning] = useTransition();

  const familyItems: OspitoCenaItem[] = ospiti.map((o) => ({
    id: o.id,
    nome: o.nome,
    intolleranze_cibo: o.intolleranze_cibo,
  }));

  const numeroArtisti = artistiCena.length;
  const numeroPersonale = personaleCena.length;
  const numeroFamily = familyItems.length;
  const totaleOspiti = numeroArtisti + numeroPersonale + numeroFamily;

  const catTotaleSel = catering
    .filter((r) => r.selezionata)
    .reduce((s, r) => s + totaleOfferta(r), 0);

  function handleAlignClick() {
    const cateringPerPersona = catering.filter((c) => c.modello === "PerPersona");
    if (cateringPerPersona.length === 0) {
      alert("Nessuna offerta 'Per persona' da aggiornare.");
      return;
    }
    if (
      !confirm(
        `Aggiornare il numero di persone di ${cateringPerPersona.length} ${
          cateringPerPersona.length === 1 ? "offerta" : "offerte"
        } a ${totaleOspiti}?`,
      )
    )
      return;
    startAligning(async () => {
      await allineaCateringPersoneR(eventoId);
    });
  }

  return (
    <>
      {/* --- OFFERTE CENA --- */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 flex items-baseline gap-2">
              <span aria-hidden>🍝</span>
              <span>Offerte cena</span>
              <span className="text-sm text-neutral-500 font-normal">
                ({catering.length})
              </span>
            </h3>
            <p className="text-sm text-neutral-600 mt-0.5">
              Selezionato: <strong>{formatMoney(catTotaleSel)}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCatModal({ kind: "add" })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
          >
            <Plus className="w-4 h-4" />
            Aggiungi offerta
          </button>
        </div>

        {catering.length === 0 ? (
          <EmptyBox text="Nessuna offerta cena. Aggiungi la prima." />
        ) : (
          <div className="bg-white rounded-3xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200">
                <tr>
                  <Th align="left">Chef</Th>
                  <Th align="left">Descrizione</Th>
                  <Th align="right">CHF/persona</Th>
                  <Th align="right">Persone</Th>
                  <Th align="right">Totale</Th>
                  <Th align="center">
                    <span className="sr-only">Selezionata</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {catering.map((r) => (
                  <CateringRow
                    key={r.id}
                    eventoId={eventoId}
                    row={r}
                    onClick={() =>
                      setCatModal({ kind: "edit", catering: r })
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* --- OSPITI CENA --- */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 flex items-baseline gap-2">
              <span aria-hidden>👥</span>
              <span>Ospiti cena</span>
            </h3>
            <p className="text-sm text-neutral-600 mt-0.5">
              Totale: <strong className="text-neutral-900">{totaleOspiti}</strong>
              <span className="text-neutral-500">
                {" "}
                ({numeroArtisti} artisti · {numeroPersonale} personale ·{" "}
                {numeroFamily} family)
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleAlignClick}
            disabled={aligning || catering.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-300 bg-white text-neutral-900 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
            title="Imposta il numero di persone di tutte le offerte 'Per persona' al totale ospiti"
          >
            <RefreshCw className={`w-4 h-4 ${aligning ? "animate-spin" : ""}`} />
            Aggiorna offerte col totale
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <OspitiColumn title="Artisti" items={artistiCena} />
          <OspitiColumn title="Personale" items={personaleCena} />
          <OspitiColumn
            title="Family & Friends"
            items={familyItems}
            actionLabel="Modifica"
            onAction={() => setOspitiOpen(true)}
          />
        </div>
      </section>

      <CateringModal
        eventoId={eventoId}
        mode={catModal}
        onClose={() => setCatModal(null)}
      />
      <OspitiModal
        eventoId={eventoId}
        open={ospitiOpen}
        ospiti={ospiti}
        onClose={() => setOspitiOpen(false)}
      />
    </>
  );
}

function OspitiColumn({
  title,
  items,
  actionLabel,
  onAction,
}: {
  title: string;
  items: OspitoCenaItem[];
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="bg-white rounded-3xl p-4 flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="text-sm font-semibold text-neutral-900 flex items-baseline gap-1.5">
          <span>{title}</span>
          <span className="text-xs text-neutral-500 font-normal">
            ({items.length})
          </span>
        </h4>
        {onAction && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900"
          >
            <Pencil className="w-3.5 h-3.5" />
            {actionLabel}
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-neutral-500">—</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((i) => (
            <li key={i.id} className="text-sm">
              <span className="text-neutral-900">{i.nome}</span>
              {i.intolleranze_cibo && (
                <span className="text-neutral-500 italic">
                  {" — "}
                  {i.intolleranze_cibo}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CateringRow({
  eventoId,
  row,
  onClick,
}: {
  eventoId: string;
  row: CateringEdit;
  onClick: () => void;
}) {
  const [pending, startTransition] = useTransition();
  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      await toggleCateringSelezionata(eventoId, row.id, !row.selezionata);
    });
  }
  const isTotale = row.modello === "Totale";
  const totale = totaleOfferta(row);
  return (
    <tr
      onClick={onClick}
      className={`border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 cursor-pointer ${
        row.selezionata ? "bg-amber-50/40" : ""
      }`}
    >
      <td className="px-4 py-3 text-neutral-900 font-medium">
        {row.nome_fornitore}
      </td>
      <td className="px-4 py-3 text-neutral-700">
        {row.descrizione ?? "—"}
      </td>
      <td className="px-4 py-3 text-neutral-700 text-right tabular-nums">
        {isTotale ? "—" : formatMoney(Number(row.prezzo_per_persona))}
      </td>
      <td className="px-4 py-3 text-neutral-700 text-right tabular-nums">
        {isTotale ? "—" : row.numero_persone}
      </td>
      <td className="px-4 py-3 text-neutral-900 text-right tabular-nums font-medium">
        {formatMoney(totale)}
        {isTotale && (
          <span className="block text-[10px] uppercase tracking-wide text-neutral-400 font-normal">
            flat
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          aria-label={row.selezionata ? "Deseleziona" : "Seleziona"}
          title={
            row.selezionata
              ? "Deseleziona"
              : "Seleziona (entra nel budget)"
          }
          className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors disabled:opacity-50 ${
            row.selezionata
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
          }`}
        >
          {row.selezionata ? (
            <Check className="w-4 h-4" />
          ) : (
            <Circle className="w-4 h-4" />
          )}
        </button>
      </td>
    </tr>
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
