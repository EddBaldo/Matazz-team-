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
