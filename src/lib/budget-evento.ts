import type { createServerClient } from "@/lib/supabase/server";

export type BudgetTotali = {
  entrate: number;
  uscite: number;
  saldo: number;
};

type Sb = ReturnType<typeof createServerClient>;

export async function calcolaBudgetEvento(
  sb: Sb,
  eventoId: string,
): Promise<BudgetTotali> {
  const [
    eventoRes,
    artistiRes,
    personaleRes,
    materialiRes,
    budgetExtraRes,
    barRes,
    cateringRes,
    foodTruckRes,
    sponsorRes,
  ] = await Promise.all([
    sb
      .from("eventi")
      .select("persone_stimati")
      .eq("id", eventoId)
      .maybeSingle(),
    sb
      .from("evento_artisti")
      .select("artist_fee, costi_produzione")
      .eq("evento_id", eventoId),
    sb.from("evento_personale").select("compenso").eq("evento_id", eventoId),
    sb
      .from("evento_materiali")
      .select("quantita, prezzo_unitario, gia_disponibile")
      .eq("evento_id", eventoId),
    sb
      .from("evento_budget_extra")
      .select("importo, tipo")
      .eq("evento_id", eventoId),
    sb
      .from("evento_bar_articoli")
      .select("costo_unitario, prezzo_vendita, consumo_per_persona")
      .eq("evento_id", eventoId),
    sb
      .from("evento_catering")
      .select(
        "modello, prezzo_per_persona, numero_persone, prezzo_totale, selezionata",
      )
      .eq("evento_id", eventoId),
    sb
      .from("evento_food_truck")
      .select(
        "modello, incasso_lordo_stimato, percentuale_matazz, costo_unitario, prezzo_vendita, consumo_per_persona, selezionata",
      )
      .eq("evento_id", eventoId),
    sb
      .from("evento_sponsor")
      .select("stato, importo")
      .eq("evento_id", eventoId),
  ]);

  const artisti = (artistiRes.data ?? []) as {
    artist_fee: number | null;
    costi_produzione: number | null;
  }[];
  const personale = (personaleRes.data ?? []) as {
    compenso: number | null;
  }[];
  const materiali = (materialiRes.data ?? []) as {
    quantita: number;
    prezzo_unitario: number | null;
    gia_disponibile: boolean;
  }[];
  const budgetExtra = (budgetExtraRes.data ?? []) as {
    importo: number;
    tipo: string;
  }[];
  const evento = (eventoRes.data ?? {
    persone_stimati: 0,
  }) as { persone_stimati: number };
  const personeStimati = Number(evento.persone_stimati ?? 0);

  const bar = (barRes.data ?? []) as {
    costo_unitario: number | null;
    prezzo_vendita: number | null;
    consumo_per_persona: number;
  }[];
  const catering = (cateringRes.data ?? []) as {
    modello: string;
    prezzo_per_persona: number;
    numero_persone: number;
    prezzo_totale: number;
    selezionata: boolean;
  }[];
  const foodTruck = (foodTruckRes.data ?? []) as {
    modello: string;
    incasso_lordo_stimato: number;
    percentuale_matazz: number;
    costo_unitario: number | null;
    prezzo_vendita: number | null;
    consumo_per_persona: number;
    selezionata: boolean;
  }[];
  const sponsor = (sponsorRes.data ?? []) as {
    stato: string;
    importo: number;
  }[];

  const totaleArtisti = artisti.reduce(
    (s, r) => s + Number(r.artist_fee ?? 0) + Number(r.costi_produzione ?? 0),
    0,
  );
  const totalePersonale = personale.reduce(
    (s, r) => s + Number(r.compenso ?? 0),
    0,
  );
  const totaleMateriali = materiali
    .filter((r) => !r.gia_disponibile)
    .reduce(
      (s, r) => s + Number(r.quantita) * Number(r.prezzo_unitario ?? 0),
      0,
    );
  const barRicavo = bar.reduce(
    (s, r) =>
      s +
      Number(r.prezzo_vendita ?? 0) *
        (personeStimati * Number(r.consumo_per_persona ?? 0)),
    0,
  );
  const barCosto = bar.reduce(
    (s, r) =>
      s +
      Number(r.costo_unitario ?? 0) *
        (personeStimati * Number(r.consumo_per_persona ?? 0)),
    0,
  );
  const totaleCatering = catering
    .filter((r) => r.selezionata)
    .reduce((s, r) => {
      if (r.modello === "Totale") return s + Number(r.prezzo_totale);
      return s + Number(r.prezzo_per_persona) * Number(r.numero_persone);
    }, 0);
  const totaleFoodTruck = foodTruck
    .filter((r) => r.selezionata)
    .reduce((s, r) => {
      if (r.modello === "Acquisto") {
        const qtyVend =
          personeStimati * Number(r.consumo_per_persona ?? 0);
        const margine =
          Number(r.prezzo_vendita ?? 0) - Number(r.costo_unitario ?? 0);
        return s + margine * qtyVend;
      }
      return (
        s +
        (Number(r.incasso_lordo_stimato) * Number(r.percentuale_matazz)) / 100
      );
    }, 0);
  const totaleSponsor = sponsor
    .filter((r) => r.stato === "Confermato")
    .reduce((s, r) => s + Number(r.importo), 0);
  const totaleUsciteExtra = budgetExtra
    .filter((r) => r.tipo === "Uscita")
    .reduce((s, r) => s + Number(r.importo), 0);
  const totaleEntrateExtra = budgetExtra
    .filter((r) => r.tipo === "Entrata")
    .reduce((s, r) => s + Number(r.importo), 0);

  const uscite =
    totaleArtisti +
    totalePersonale +
    totaleMateriali +
    barCosto +
    totaleCatering +
    totaleUsciteExtra;
  const entrate =
    barRicavo + totaleFoodTruck + totaleSponsor + totaleEntrateExtra;

  return { entrate, uscite, saldo: entrate - uscite };
}
