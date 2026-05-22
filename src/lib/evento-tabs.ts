export type EventoTab = { label: string; segment: string };

export const EVENTO_TABS: readonly EventoTab[] = [
  { label: "Info", segment: "" },
  { label: "Programma", segment: "/programma" },
  { label: "Artisti", segment: "/artisti" },
  { label: "Food & Beverage", segment: "/food-beverage" },
  { label: "Cena", segment: "/cena" },
  { label: "Sponsor", segment: "/sponsor" },
  { label: "Personale", segment: "/personale" },
  { label: "Tabella di marcia", segment: "/compiti" },
  { label: "Materiali", segment: "/materiali" },
  { label: "Merchandising", segment: "/merchandising" },
  { label: "Voci extra", segment: "/voci-extra" },
  { label: "Budget e Costi", segment: "/budget" },
];

export function extractEventoId(pathname: string): string | null {
  const match = pathname.match(/^\/eventi\/([^/]+)/);
  if (!match) return null;
  const segment = match[1];
  if (segment === "nuovo") return null;
  return segment;
}
