"use client";

import { useState, useTransition } from "react";
import { Plus, Check, Circle, ExternalLink } from "lucide-react";
import { formatMoney } from "@/lib/format";
import {
  MACRO_TIPI_ARTE,
  MACRO_EMOJI,
  macroFromTipoArte,
  type MacroTipoArte,
} from "@/lib/artisti";
import {
  toggleConfermaR,
  toggleDocMandatiR,
  toggleEventoArtistaBoolR,
} from "../actions";
import {
  AggiungiArtistaModal,
  type ArtistaRubrica,
} from "./AggiungiArtistaModal";
import {
  ModificaArtistaModal,
  type EventoArtistaEdit,
  type TeamMember,
} from "./ModificaArtistaModal";

export type ArtistaRow = EventoArtistaEdit & {
  artistaNome: string;
  artistaCognome: string;
  artistaTipoArte: string;
  chiContattoNome: string | null;
};

type Props = {
  eventoId: string;
  rows: ArtistaRow[];
  rubrica: ArtistaRubrica[];
  team: TeamMember[];
};


export function ArtistiPageClient({ eventoId, rows, rubrica, team }: Props) {
  const [editing, setEditing] = useState<EventoArtistaEdit | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const confermati = rows.filter((r) => r.confermato);
  const daConfermare = rows.filter((r) => !r.confermato);

  const grouped = new Map<MacroTipoArte, ArtistaRow[]>();
  for (const r of confermati) {
    const macro = macroFromTipoArte(r.artistaTipoArte);
    const bucket = grouped.get(macro) ?? [];
    bucket.push(r);
    grouped.set(macro, bucket);
  }
  for (const bucket of grouped.values()) {
    bucket.sort((a, b) =>
      `${a.artistaNome} ${a.artistaCognome}`.localeCompare(
        `${b.artistaNome} ${b.artistaCognome}`,
        "it",
      ),
    );
  }
  daConfermare.sort((a, b) =>
    `${a.artistaNome} ${a.artistaCognome}`.localeCompare(
      `${b.artistaNome} ${b.artistaCognome}`,
      "it",
    ),
  );

  return (
    <>
      <div className="flex items-center justify-end gap-2 flex-wrap">
        <a
          href="https://drive.google.com/drive/u/0/folders/1RlUrxRrUEDyvflQVbYjefuio-eXkUVzT"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-300 bg-amber-50 text-amber-800 text-sm font-medium hover:bg-amber-100"
        >
          <ExternalLink className="w-4 h-4" />
          Documenti su Drive
        </a>
        <a
          href="https://miro.com/welcomeonboard/VGJ3SmtkeWZ1dGJ3YUJKWCtzYm4zYmtCQnU2aVJEbXFqUTFVUE9hclZ0K1pJeWdDZGVvakNid2FXWDV5NVRSMisxNmczdVN0Qi9BYVNEQTV4UXQzdHZjY1V3N29Xb1dwYzJCRENtV1lPSzdHQTRkMi9nZkRxZU9oNWRqQldiMXVhWWluRVAxeXRuUUgwWDl3Mk1qRGVRPT0hdjE=?share_link_id=417633812068"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-300 bg-amber-50 text-amber-800 text-sm font-medium hover:bg-amber-100"
        >
          <ExternalLink className="w-4 h-4" />
          Cura spazi
        </a>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
        >
          <Plus className="w-4 h-4" />
          Aggiungi artista
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center">
          <p className="text-neutral-600">Nessun artista ancora.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {MACRO_TIPI_ARTE.map((macro) => {
            const bucket = grouped.get(macro);
            if (!bucket || bucket.length === 0) return null;
            return (
              <section key={macro}>
                <h3 className="text-base font-semibold text-neutral-900 mb-2 flex items-baseline gap-2">
                  <span aria-hidden>{MACRO_EMOJI[macro]}</span>
                  <span>{macro}</span>
                  <span className="text-sm text-neutral-500 font-normal">
                    ({bucket.length})
                  </span>
                </h3>
                <ArtistiTable
                  eventoId={eventoId}
                  rows={bucket}
                  onRowClick={(r) => setEditing(r)}
                />
              </section>
            );
          })}

          {daConfermare.length > 0 && (
            <section>
              <h3 className="text-base font-semibold text-neutral-900 mb-2 flex items-baseline gap-2">
                <span aria-hidden>⏳</span>
                <span>Da confermare</span>
                <span className="text-sm text-neutral-500 font-normal">
                  ({daConfermare.length})
                </span>
              </h3>
              <ArtistiTable
                eventoId={eventoId}
                rows={daConfermare}
                onRowClick={(r) => setEditing(r)}
              />
            </section>
          )}
        </div>
      )}

      <AggiungiArtistaModal
        eventoId={eventoId}
        open={addOpen}
        rubrica={rubrica}
        onClose={() => setAddOpen(false)}
      />

      <ModificaArtistaModal
        eventoId={eventoId}
        team={team}
        artista={editing}
        onClose={() => setEditing(null)}
      />
    </>
  );
}

function ArtistiTable({
  eventoId,
  rows,
  onRowClick,
}: {
  eventoId: string;
  rows: ArtistaRow[];
  onRowClick: (r: ArtistaRow) => void;
}) {
  return (
    <div className="bg-white rounded-3xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-neutral-200">
          <tr>
            <Th align="left">Nome</Th>
            <Th align="left">Tipo arte</Th>
            <Th align="left">Contatto</Th>
            <Th align="left">Doc mandati</Th>
            <Th align="left">Doc info</Th>
            <Th align="left">Doc proposal</Th>
            <Th align="right">Fee</Th>
            <Th align="right">Costi prod.</Th>
            <Th align="left">Ingombro</Th>
            <Th align="center">Alloggio</Th>
            <Th align="center">Cena</Th>
            <Th align="center">
              <span className="sr-only">Conferma</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <ArtistaRowItem
              key={r.id}
              eventoId={eventoId}
              row={r}
              onClick={() => onRowClick(r)}
            />
          ))}
        </tbody>
      </table>
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

function ArtistaRowItem({
  eventoId,
  row,
  onClick,
}: {
  eventoId: string;
  row: ArtistaRow;
  onClick: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      await toggleConfermaR(eventoId, row.id, !row.confermato);
    });
  }

  return (
    <tr
      onClick={onClick}
      className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 cursor-pointer"
    >
      <td className="px-4 py-3 text-neutral-900 font-medium">
        <div>
          {row.artistaNome} {row.artistaCognome}
        </div>
        {row.artistaMembriExtra && (
          <div>+ {row.artistaMembriExtra}</div>
        )}
      </td>
      <td className="px-4 py-3 text-neutral-700">{row.artistaTipoArte}</td>
      <td className="px-4 py-3 text-neutral-700">
        {row.chiContattoNome ?? "—"}
      </td>
      <td className="px-4 py-3">
        <ToggleBadge
          on={row.doc_mandati === "Sì"}
          onClick={async () => {
            await toggleDocMandatiR(
              eventoId,
              row.id,
              row.doc_mandati === "Sì" ? "Non ancora" : "Sì",
            );
          }}
          labelOn="Sì"
          labelOff="Non ancora"
        />
      </td>
      <td className="px-4 py-3">
        <ToggleBadge
          on={row.doc_info_artisti}
          onClick={async () => {
            await toggleEventoArtistaBoolR(
              eventoId,
              row.id,
              "doc_info_artisti",
              !row.doc_info_artisti,
            );
          }}
        />
      </td>
      <td className="px-4 py-3">
        <ToggleBadge
          on={row.doc_proposal}
          onClick={async () => {
            await toggleEventoArtistaBoolR(
              eventoId,
              row.id,
              "doc_proposal",
              !row.doc_proposal,
            );
          }}
        />
      </td>
      <td className="px-4 py-3 text-neutral-900 text-right tabular-nums">
        {row.artist_fee != null ? formatMoney(Number(row.artist_fee)) : "—"}
      </td>
      <td className="px-4 py-3 text-neutral-700 text-right tabular-nums">
        {row.costi_produzione != null
          ? formatMoney(Number(row.costi_produzione))
          : "—"}
      </td>
      <td className="px-4 py-3 text-neutral-700">{row.ingombro ?? "—"}</td>
      <td className="px-4 py-3 text-center">
        <ToggleBadge
          on={row.necessita_alloggio}
          onClick={async () => {
            await toggleEventoArtistaBoolR(
              eventoId,
              row.id,
              "necessita_alloggio",
              !row.necessita_alloggio,
            );
          }}
        />
      </td>
      <td className="px-4 py-3 text-center">
        <ToggleBadge
          on={row.presente_cena}
          onClick={async () => {
            await toggleEventoArtistaBoolR(
              eventoId,
              row.id,
              "presente_cena",
              !row.presente_cena,
            );
          }}
        />
      </td>
      <td className="px-4 py-3 text-center">
        <button
          type="button"
          onClick={handleToggle}
          disabled={pending}
          aria-label={row.confermato ? "Sposta in da confermare" : "Conferma"}
          title={row.confermato ? "Sposta in da confermare" : "Conferma"}
          className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors disabled:opacity-50 ${
            row.confermato
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
          }`}
        >
          {row.confermato ? (
            <Check className="w-4 h-4" />
          ) : (
            <Circle className="w-4 h-4" />
          )}
        </button>
      </td>
    </tr>
  );
}

function ToggleBadge({
  on,
  onClick,
  labelOn = "Sì",
  labelOff = "No",
}: {
  on: boolean;
  onClick: () => Promise<void> | void;
  labelOn?: string;
  labelOff?: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        startTransition(async () => {
          await onClick();
        });
      }}
      disabled={pending}
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer ${
        on
          ? "bg-green-100 text-green-800 hover:bg-green-200"
          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
      }`}
    >
      {on ? labelOn : labelOff}
    </button>
  );
}
