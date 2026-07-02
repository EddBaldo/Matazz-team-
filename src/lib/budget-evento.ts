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
    merchRes,
    budgetExtraRes,
    barRes,
    cateringRes,
    foodTruckRes,
    sponsorRes,
    barCostiRealiRes,
    ftCostoRealeRes,
  ] = await Promise.all([
    sb
      .from("eventi")
      .select("persone_stimati, bar_attivo, food_truck_attivo, incasso_reale_vendite, bar_costo_reale_nostri, bar_costo_reale_fornitori")
      .eq("id", eventoId)
      .maybeSingle(),
    sb
      .from("evento_artisti")
      .select("artist_fee, costi_produzione, costi_trasporto")
      .eq("evento_id", eventoId),
    sb
      .from("evento_personale")
      .select("compenso, costi_trasporto, confermato")
      .eq("evento_id", eventoId),
    sb
      .from("evento_materiali")
      .select("quantita, prezzo_unitario, gia_disponibile")
      .eq("evento_id", eventoId),
    sb
      .from("evento_merchandising")
      .select("costo_totale, inclusa_nel_budget")
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
        "modello, incasso_lordo_stimato, percentuale_matazz, costo_unitario, prezzo_vendita, consumo_per_persona, selezionata, quantita_acquistata",
      )
      .eq("evento_id", eventoId),
    sb
      .from("evento_sponsor")
      .select("stato, importo")
      .eq("evento_id", eventoId),
    sb.from("evento_bar_costi_reali").select("costo_reale").eq("evento_id", eventoId),
    sb.from("eventi").select("food_truck_costo_reale_acquisto").eq("id", eventoId).maybeSingle(),
  ]);

  const artisti = (artistiRes.data ?? []) as {
    artist_fee: number | null;
    costi_produzione: number | null;
    costi_trasporto: number | null;
  }[];
  const personale = (personaleRes.data ?? []) as {
    compenso: number | null;
    costi_trasporto: number | null;
    confermato: boolean;
  }[];
  const materiali = (materialiRes.data ?? []) as {
    quantita: number;
    prezzo_unitario: number | null;
    gia_disponibile: boolean;
  }[];
  const merch = (merchRes.data ?? []) as {
    costo_totale: number;
    inclusa_nel_budget: boolean;
  }[];
  const budgetExtra = (budgetExtraRes.data ?? []) as {
    importo: number;
    tipo: string;
  }[];
  const evento = (eventoRes.data ?? {
    persone_stimati: 0,
    bar_attivo: true,
    food_truck_attivo: true,
    incasso_reale_vendite: null,
    bar_costo_reale_nostri: null,
    bar_costo_reale_fornitori: null,
    food_truck_costo_reale_acquisto: null,
  }) as {
    persone_stimati: number;
    bar_attivo: boolean;
    food_truck_attivo: boolean;
    incasso_reale_vendite: number | null;
    bar_costo_reale_nostri: number | null;
    bar_costo_reale_fornitori: number | null;
    food_truck_costo_reale_acquisto: number | null;
  };
  const personeStimati = Number(evento.persone_stimati ?? 0);
  const barAttivo = evento.bar_attivo ?? true;
  const foodTruckAttivo = evento.food_truck_attivo ?? true;
  const incassoRealeVendite =
    evento.incasso_reale_vendite != null
      ? Number(evento.incasso_reale_vendite)
      : null;

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
    quantita_acquistata: number | null;
  }[];
  const sponsor = (sponsorRes.data ?? []) as {
    stato: string;
    importo: number;
  }[];

  const totaleArtisti = artisti.reduce(
    (s, r) => s + Number(r.artist_fee ?? 0) + Number(r.costi_produzione ?? 0),
    0,
  );
  const totalePersonale = personale
    .filter((r) => r.confermato)
    .reduce((s, r) => s + Number(r.compenso ?? 0), 0);
  const totaleTrasporti =
    artisti.reduce((s, r) => s + Number(r.costi_trasporto ?? 0), 0) +
    personale
      .filter((r) => r.confermato)
      .reduce((s, r) => s + Number(r.costi_trasporto ?? 0), 0);
  const totaleMateriali = materiali
    .filter((r) => !r.gia_disponibile)
    .reduce(
      (s, r) => s + Number(r.quantita) * Number(r.prezzo_unitario ?? 0),
      0,
    );
  const totaleMerch = merch
    .filter((r) => r.inclusa_nel_budget)
    .reduce((s, r) => s + Number(r.costo_totale ?? 0), 0);
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
  const totaleFoodTruckPerc = foodTruck
    .filter((r) => r.selezionata && r.modello === "Percentuale")
    .reduce(
      (s, r) =>
        s +
        (Number(r.incasso_lordo_stimato) * Number(r.percentuale_matazz)) / 100,
      0,
    );
  const totaleFoodTruckAcq = foodTruck
    .filter((r) => r.selezionata && r.modello === "Acquisto")
    .reduce((s, r) => {
      const qtyVend = personeStimati * Number(r.consumo_per_persona ?? 0);
      const margine =
        Number(r.prezzo_vendita ?? 0) - Number(r.costo_unitario ?? 0);
      return s + margine * qtyVend;
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

  const barCostoRealeN = evento.bar_costo_reale_nostri != null ? Number(evento.bar_costo_reale_nostri) : null;
  const barCostoRealeF = evento.bar_costo_reale_fornitori != null ? Number(evento.bar_costo_reale_fornitori) : null;
  const barCostoReale = (barCostoRealeN != null || barCostoRealeF != null)
    ? (barCostoRealeN ?? 0) + (barCostoRealeF ?? 0)
    : null;
  // Try new table first; fall back to old single columns
  let barCostoRealeFromTable: number | null = null;
  if (!barCostiRealiRes.error && barCostiRealiRes.data) {
    const withCosto = (barCostiRealiRes.data as { costo_reale: number | null }[]).filter(
      (r) => r.costo_reale != null,
    );
    if (withCosto.length > 0)
      barCostoRealeFromTable = withCosto.reduce((s, r) => s + Number(r.costo_reale), 0);
  } else {
    if (barCostoReale != null) barCostoRealeFromTable = barCostoReale;
  }
  const barCostoBudget = barAttivo ? (barCostoRealeFromTable ?? barCosto) : 0;

  const foodTruckCostoRealeAcq =
    !ftCostoRealeRes.error && ftCostoRealeRes.data
      ? ((ftCostoRealeRes.data as { food_truck_costo_reale_acquisto: number | null })
          .food_truck_costo_reale_acquisto ?? null)
      : null;
  const realeAttivo = incassoRealeVendite != null;
  const barRicavoBudget = barAttivo && !realeAttivo ? barRicavo : 0;
  const foodTruckAcqBudget = foodTruckAttivo && !realeAttivo ? totaleFoodTruckAcq : 0;
  const foodTruckPercBudget = foodTruckAttivo ? totaleFoodTruckPerc : 0;

  const totaleFoodTruckCostoAcqStimato = foodTruck
    .filter((r) => r.selezionata && r.modello === "Acquisto")
    .reduce((s, r) => s + Number(r.costo_unitario ?? 0) * Number(r.quantita_acquistata ?? 0), 0);
  const foodTruckCostoAcqBudget = foodTruckAttivo
    ? (foodTruckCostoRealeAcq ?? totaleFoodTruckCostoAcqStimato)
    : 0;

  const uscite =
    totaleArtisti +
    totalePersonale +
    totaleTrasporti +
    totaleMateriali +
    totaleMerch +
    barCostoBudget +
    totaleCatering +
    foodTruckCostoAcqBudget +
    totaleUsciteExtra;
  const entrate =
    barRicavoBudget +
    foodTruckPercBudget +
    foodTruckAcqBudget +
    (incassoRealeVendite ?? 0) +
    totaleSponsor +
    totaleEntrateExtra;

  return { entrate, uscite, saldo: entrate - uscite };
}
