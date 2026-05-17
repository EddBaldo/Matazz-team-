export const CATEGORIE_PERSONALE = [
  "Fotografi/Videomaker",
  "Bar",
  "Tecnici audio",
  "Allestimento",
  "Altro",
] as const;

export type CategoriaPersonale = (typeof CATEGORIE_PERSONALE)[number];

export const CATEGORIA_PERSONALE_EMOJI: Record<CategoriaPersonale, string> = {
  "Fotografi/Videomaker": "📸",
  Bar: "🍷",
  "Tecnici audio": "🎚️",
  Allestimento: "🛠️",
  Altro: "✨",
};
