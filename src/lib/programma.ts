export type Giornata = {
  id: string;
  data: string;
  descrizione: string | null;
};

export type VoceProgramma = {
  id: string;
  giornata_id: string;
  ora_inizio: string | null;
  ora_fine: string | null;
  titolo: string;
  descrizione: string | null;
};

export function formatGiorno(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("it-CH", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatGiornoBreve(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("it-CH", {
    day: "numeric",
    month: "short",
  });
}

export function formatOra(t: string | null): string {
  if (!t) return "";
  return t.slice(0, 5);
}

export function formatRangeOra(
  inizio: string | null,
  fine: string | null,
): string {
  const i = formatOra(inizio);
  const f = formatOra(fine);
  if (i && f) return `${i} – ${f}`;
  if (i) return i;
  return "";
}

// Ordine "logico" entro una giornata: orari < 06:00 sono trattati come
// post-mezzanotte (quindi più tardi di 23:30). Voci senza orario in coda.
export function logicalTimeRank(t: string | null): number {
  if (!t) return Number.POSITIVE_INFINITY;
  const [h, m] = t.split(":").map(Number);
  const minutes = h * 60 + m;
  return minutes < 6 * 60 ? minutes + 24 * 60 : minutes;
}

export function ordinaVoci<T extends Pick<VoceProgramma, "ora_inizio">>(
  rows: T[],
): T[] {
  return [...rows].sort(
    (a, b) => logicalTimeRank(a.ora_inizio) - logicalTimeRank(b.ora_inizio),
  );
}

// Calcola l'orario "logico" di chiusura di una giornata: massimo tra
// ora_fine ?? ora_inizio, considerando i post-mezzanotte come più tardi.
export function calcolaOraFineLogica<
  T extends Pick<VoceProgramma, "ora_inizio" | "ora_fine">,
>(voci: T[]): string | null {
  let bestT: string | null = null;
  let bestRank = -1;
  for (const v of voci) {
    const t = v.ora_fine ?? v.ora_inizio;
    if (!t) continue;
    const r = logicalTimeRank(t);
    if (r > bestRank) {
      bestRank = r;
      bestT = t;
    }
  }
  return bestT;
}

export function calcolaOraInizioMin<
  T extends Pick<VoceProgramma, "ora_inizio">,
>(voci: T[]): string | null {
  let bestT: string | null = null;
  let bestRank = Number.POSITIVE_INFINITY;
  for (const v of voci) {
    if (!v.ora_inizio) continue;
    const r = logicalTimeRank(v.ora_inizio);
    if (r < bestRank) {
      bestRank = r;
      bestT = v.ora_inizio;
    }
  }
  return bestT;
}
