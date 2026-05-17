export const TIPI_SPONSOR = [
  "Fondazione",
  "Banca",
  "Food & Beverage",
  "Privato",
  "Altro",
] as const;

export type TipoSponsor = (typeof TIPI_SPONSOR)[number];
