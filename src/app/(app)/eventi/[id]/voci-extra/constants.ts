export const TIPI_VOCE = ["Uscita", "Entrata"] as const;
export type TipoVoce = (typeof TIPI_VOCE)[number];

export const CATEGORIE_SUGGERITE = [
  "Affitto location",
  "SIAE",
  "Assicurazione",
  "Trasporti",
  "Catering",
  "Pubblicità",
  "Permessi",
] as const;
