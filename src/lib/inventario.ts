export const CONDIZIONI = [
  "Ottimo",
  "Buono",
  "Da riparare",
  "Da buttare",
] as const;

export type Condizione = (typeof CONDIZIONI)[number];

export const CONDIZIONE_BADGE: Record<string, string> = {
  Ottimo: "bg-green-100 text-green-800",
  Buono: "bg-amber-100 text-amber-800",
  "Da riparare": "bg-orange-100 text-orange-800",
  "Da buttare": "bg-red-100 text-red-800",
};

export const CONDIZIONE_EMOJI: Record<string, string> = {
  Ottimo: "🟢",
  Buono: "🟡",
  "Da riparare": "🟠",
  "Da buttare": "🔴",
};

export const CATEGORIE_INVENTARIO = [
  "Merch",
  "Attrezzatura",
  "Scenografia",
  "Archivio",
  "Altro",
] as const;

export type CategoriaInventario = (typeof CATEGORIE_INVENTARIO)[number];

export const CATEGORIA_INVENTARIO_EMOJI: Record<CategoriaInventario, string> = {
  Merch: "👕",
  Attrezzatura: "🔧",
  Scenografia: "🎭",
  Archivio: "📦",
  Altro: "📌",
};

export const CATEGORIA_INVENTARIO_DESCRIZIONE: Record<
  CategoriaInventario,
  string
> = {
  Merch: "Capi, gadget, stampe avanzati dai vecchi eventi.",
  Attrezzatura: "Cavi, scotch, viti, prolunghe, attrezzi per allestire.",
  Scenografia: "Luci, teli, pannelli, oggetti decorativi riutilizzabili.",
  Archivio: "Flyer, manifesti, memorabilia dei vecchi eventi.",
  Altro: "Tutto quello che non rientra nelle altre categorie.",
};
