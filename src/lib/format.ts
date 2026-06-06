export function formatDateIT(
  date: string | Date | null | undefined,
): string {
  if (!date) return "";
  if (date instanceof Date) {
    return formatDateFromYMD(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
    );
  }
  // Le date Postgres arrivano come "YYYY-MM-DD" — parse manuale per non shiftare per timezone.
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!match) return date;
  return formatDateFromYMD(Number(match[1]), Number(match[2]), Number(match[3]));
}

function formatDateFromYMD(y: number, m: number, d: number): string {
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

export function formatMoney(n: number | null | undefined): string {
  if (n == null) return "";
  const fixed = Math.abs(n).toFixed(2);
  const [intPart, decPart] = fixed.split(".");
  const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  const sign = n < 0 ? "-" : "";
  return `CHF ${sign}${withSep}.${decPart}`;
}

export function formatTime(t: string | null | undefined): string {
  if (!t) return "";
  // Postgres time arriva come "HH:MM:SS"; mostriamo solo HH:MM
  return t.slice(0, 5);
}
