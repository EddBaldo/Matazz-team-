export const STATI_SPONSOR = [
  "Da contattare",
  "Contattato",
  "Confermato",
  "Rifiutato",
] as const;

export type StatoSponsor = (typeof STATI_SPONSOR)[number];
