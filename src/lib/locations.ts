export const STATI_LOCATION = [
  "Svizzera",
  "Italia",
  "Francia",
  "Germania",
  "Austria",
  "Altro",
] as const;

export type StatoLocation = (typeof STATI_LOCATION)[number];

export const STATO_EMOJI: Record<string, string> = {
  Svizzera: "🇨🇭",
  Italia: "🇮🇹",
  Francia: "🇫🇷",
  Germania: "🇩🇪",
  Austria: "🇦🇹",
  Altro: "🌍",
};

export function normalizeStato(s: string | null | undefined): string {
  if (!s) return "Svizzera";
  const t = s.trim();
  return t.length > 0 ? t : "Svizzera";
}
