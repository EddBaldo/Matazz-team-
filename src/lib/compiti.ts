export const CATEGORIE_COMPITI = [
  "Curatelazz",
  "Volto",
  "Logistica",
  "Matazz Family",
  "Amministrazz",
  "Personale",
] as const;

export type CategoriaCompito = (typeof CATEGORIE_COMPITI)[number];

// Classe Tailwind per il badge inline (sfondo chiaro + testo scuro)
export const CATEGORIA_BADGE: Record<string, string> = {
  Curatelazz: "bg-green-100 text-green-800",
  Volto: "bg-orange-100 text-orange-800",
  Logistica: "bg-blue-100 text-blue-800",
  "Matazz Family": "bg-red-100 text-red-800",
  Amministrazz: "bg-purple-100 text-purple-800",
  Personale: "bg-[#efe2cf] text-[#5e3717]",
};

// Classe Tailwind per il pallino colorato (calendario, filtri)
export const CATEGORIA_DOT: Record<string, string> = {
  Curatelazz: "bg-green-500",
  Volto: "bg-orange-500",
  Logistica: "bg-blue-500",
  "Matazz Family": "bg-red-500",
  Amministrazz: "bg-purple-500",
  Personale: "bg-[#5e3717]",
};
