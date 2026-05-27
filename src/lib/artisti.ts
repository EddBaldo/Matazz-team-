export const TIPI_ARTE = [
  "Installazione",
  "Installazione-Sonora",
  "Installazione-Performance",
  "Video",
  "Danza",
  "Performance Musica",
  "Musica Sera",
  "Quadri",
  "DJ",
  "Live Music",
  "Collaborazione",
] as const;

export type TipoArte = (typeof TIPI_ARTE)[number];

export const MACRO_TIPI_ARTE = [
  "Arti visive",
  "Arti digitali",
  "Performance",
  "Musica sera",
  "Collaborazioni",
] as const;

export type MacroTipoArte = (typeof MACRO_TIPI_ARTE)[number];

export const MACRO_EMOJI: Record<MacroTipoArte, string> = {
  "Arti visive": "🎨",
  "Arti digitali": "💻",
  Performance: "💃",
  "Musica sera": "🎵",
  Collaborazioni: "🤝",
};

export function macroFromTipoArte(tipo: string): MacroTipoArte {
  if (tipo === "Quadri") return "Arti visive";
  if (tipo === "Installazione") return "Arti visive";
  if (tipo === "Installazione-Sonora") return "Arti visive";
  if (tipo === "Video") return "Arti digitali";
  if (tipo === "Danza") return "Performance";
  if (tipo === "Installazione-Performance") return "Performance";
  if (tipo === "Performance Musica") return "Performance";
  if (tipo === "Musica Sera") return "Musica sera";
  if (tipo === "DJ") return "Musica sera";
  if (tipo === "Live Music") return "Musica sera";
  if (tipo === "Collaborazione") return "Collaborazioni";
  return "Arti visive";
}
