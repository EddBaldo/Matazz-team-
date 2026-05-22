"use client";

import { useState, useTransition } from "react";
import { Plus, Check, Circle, Pencil } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { toggleCateringSelezionata } from "../actions";
import { CateringModal, type CateringEdit } from "./CateringModal";
import { OspitiModal, type OspiteCena } from "./OspitiModal";

type Props = {
  eventoId: string;
  catering: CateringEdit[];
  ospiti: OspiteCena[];
  numeroArtistiCena: number;
  numeroPersonaleCena: number;
};

type CatModalState =
  | { kind: "add" }
  | { kind: "edit"; catering: CateringEdit }
  | null;

export function CenaClient({
  eventoId,
  catering,
  ospiti,
  numeroArtistiCena,
  numeroPersonaleCena,
}: Props) {
  const [catModal, setCatModal] = useState<CatModalState>(null);
  const [ospitiOpen, setOspitiOpen] = useState(false);

  const numeroFamily = ospiti.length;
  const totaleOspiti =
    numeroArtistiCena + numeroPersonaleCena + numeroFamily;

  const catTotaleSel = catering
    .filter((r) => r.selezionata)
    .reduce(
      (s, r) => s + Number(r.prezzo_per_persona) * totaleOspiti,
      0,
    );

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
              <span className="text-neutral-500">
                {" "}
                ({totaleOspiti} {totaleOspiti === 1 ? "ospite" : "ospiti"})
              </span>
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
                    persone={totaleOspiti}
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
        <div>
          <h3 className="text-base font-semibold text-neutral-900 flex items-baseline gap-2">
            <span aria-hidden>👥</span>
            <span>Ospiti cena</span>
            <span className="text-sm text-neutral-500 font-normal">
              ({totaleOspiti})
            </span>
          </h3>
          <p className="text-sm text-neutral-600 mt-0.5">
            Il numero di persone presenti alla cena. Per artisti e personale si
            aggiorna dai loro pulsanti &ldquo;Cena&rdquo; nelle relative pagine.
          </p>
        </div>

        <div className="bg-white rounded-3xl overflow-hidden">
          <ul className="divide-y divide-neutral-100">
            <OspitoRow label="Artisti" count={numeroArtistiCena} />
            <OspitoRow label="Personale" count={numeroPersonaleCena} />
            <FamilyRow
              count={numeroFamily}
              ospiti={ospiti}
              onEdit={() => setOspitiOpen(true)}
            />
            <li className="flex items-center justify-between px-4 py-3 bg-neutral-50">
              <span className="text-sm font-semibold text-neutral-900">
                Totale ospiti
              </span>
              <span className="text-sm font-semibold text-neutral-900 tabular-nums">
                {totaleOspiti}
              </span>
            </li>
          </ul>
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

function OspitoRow({ label, count }: { label: string; count: number }) {
  return (
    <li className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-neutral-900">{label}</span>
      <span className="text-sm text-neutral-900 tabular-nums font-medium">
        {count}
      </span>
    </li>
  );
}

function FamilyRow({
  count,
  ospiti,
  onEdit,
}: {
  count: number;
  ospiti: OspiteCena[];
  onEdit: () => void;
}) {
  const anteprima = ospiti
    .slice(0, 3)
    .map((o) => o.nome)
    .join(", ");
  const altri = ospiti.length - 3;
  return (
    <li className="px-4 py-3 hover:bg-neutral-50">
      <button
        type="button"
        onClick={onEdit}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div className="min-w-0">
          <span className="text-sm text-neutral-900">Family &amp; Friends</span>
          {ospiti.length > 0 && (
            <p className="text-xs text-neutral-500 truncate">
              {anteprima}
              {altri > 0 ? ` +${altri}` : ""}
            </p>
          )}
        </div>
        <span className="shrink-0 inline-flex items-center gap-2">
          <span className="text-sm text-neutral-900 tabular-nums font-medium">
            {count}
          </span>
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100">
            <Pencil className="w-3.5 h-3.5" />
          </span>
        </span>
      </button>
    </li>
  );
}

function CateringRow({
  eventoId,
  row,
  persone,
  onClick,
}: {
  eventoId: string;
  row: CateringEdit;
  persone: number;
  onClick: () => void;
}) {
  const [pending, startTransition] = useTransition();
  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      await toggleCateringSelezionata(eventoId, row.id, !row.selezionata);
    });
  }
  const totale = Number(row.prezzo_per_persona) * persone;
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
        {formatMoney(Number(row.prezzo_per_persona))}
      </td>
      <td className="px-4 py-3 text-neutral-900 text-right tabular-nums font-medium">
        {formatMoney(totale)}
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
