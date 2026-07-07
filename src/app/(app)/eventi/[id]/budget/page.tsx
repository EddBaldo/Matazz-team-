import { createServerClient } from "@/lib/supabase/server";
import { getSaldoConto } from "@/lib/conto";
import {
  BudgetClient,
  type BudgetLine,
} from "./_components/BudgetClient";

type Props = {
  params: Promise<{ id: string }>;
};

type EventoArtistaRow = {
  artist_fee: number | null;
  costi_produzione: number | null;
  costi_trasporto: number | null;
};
type EventoPersonaleRow = {
  compenso: number | null;
  costi_trasporto: number | null;
  confermato: boolean;
};
type EventoMaterialeRow = {
  quantita: number;
  prezzo_unitario: number | null;
  gia_disponibile: boolean;
};
type EventoMerchRow = {
  costo_totale: number;
  inclusa_nel_budget: boolean;
};
type BudgetExtraRow = { id: string; voce: string; importo: number; tipo: string };
type BarArticoloRow = {
  costo_unitario: number | null;
  prezzo_vendita: number | null;
  consumo_per_persona: number;
};
type CateringRow = {
  id: string;
  nome_fornitore: string;
  modello: string;
  prezzo_per_persona: number;
  numero_persone: number;
  prezzo_totale: number;
  selezionata: boolean;
};
type FoodTruckRow = {
  id: string;
  nome: string | null;
  modello: string | null;
  incasso_lordo_stimato: number | null;
  percentuale_matazz: number | null;
  costo_unitario: number | null;
  prezzo_vendita: number | null;
  consumo_per_persona: number;
  selezionata: boolean;
  quantita_acquistata: number | null;
};
type EventoStimeRow = {
  persone_stimati: number;
  bar_attivo: boolean;
  food_truck_attivo: boolean;
  incasso_reale_vendite: number | null;
  bar_costo_reale_nostri: number | null;
  bar_costo_reale_fornitori: number | null;
};
type EventoSponsorRow = { stato: string; importo: number };
type StimaRow = { chiave: string; importo: number };

export default async function EventoBudgetPage({ params }: Props) {
  const { id } = await params;
  const sb = createServerClient();

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
    stimeRes,
    barCostiRealiRes,
  ] = await Promise.all([
    sb
      .from("eventi")
      .select("persone_stimati, bar_attivo, food_truck_attivo, incasso_reale_vendite, bar_costo_reale_nostri, bar_costo_reale_fornitori")
      .eq("id", id)
      .maybeSingle(),
    sb
      .from("evento_artisti")
      .select("artist_fee, costi_produzione, costi_trasporto")
      .eq("evento_id", id),
    sb
      .from("evento_personale")
      .select("compenso, costi_trasporto, confermato")
      .eq("evento_id", id),
    sb
      .from("evento_materiali")
      .select("quantita, prezzo_unitario, gia_disponibile")
      .eq("evento_id", id),
    sb
      .from("evento_merchandising")
      .select("costo_totale, inclusa_nel_budget")
      .eq("evento_id", id),
    sb
      .from("evento_budget_extra")
      .select("id, voce, importo, tipo")
      .eq("evento_id", id)
      .order("voce"),
    sb
      .from("evento_bar_articoli")
      .select("costo_unitario, prezzo_vendita, consumo_per_persona")
      .eq("evento_id", id),
    sb
      .from("evento_catering")
      .select(
        "id, nome_fornitore, modello, prezzo_per_persona, numero_persone, prezzo_totale, selezionata",
      )
      .eq("evento_id", id),
    sb
      .from("evento_food_truck")
      .select(
        "id, nome, modello, incasso_lordo_stimato, percentuale_matazz, costo_unitario, prezzo_vendita, consumo_per_persona, selezionata, quantita_acquistata",
      )
      .eq("evento_id", id),
    sb
      .from("evento_sponsor")
      .select("stato, importo")
      .eq("evento_id", id),
    sb
      .from("evento_budget_stime")
      .select("chiave, importo")
      .eq("evento_id", id),
    // Graceful: table may not exist until migration 058 is applied
    sb.from("evento_bar_costi_reali").select("costo_reale").eq("evento_id", id),
  ]);

  const evento = (eventoRes.data ?? {
    persone_stimati: 0,
    bar_attivo: true,
    food_truck_attivo: true,
    incasso_reale_vendite: null,
    bar_costo_reale_nostri: null,
    bar_costo_reale_fornitori: null,
  }) as EventoStimeRow;
  const personeStimati = Number(evento.persone_stimati ?? 0);
  const barAttivo = evento.bar_attivo ?? true;
  const foodTruckAttivo = evento.food_truck_attivo ?? true;
  const incassoRealeVendite =
    evento.incasso_reale_vendite != null
      ? Number(evento.incasso_reale_vendite)
      : null;

  const artisti = (artistiRes.data ?? []) as EventoArtistaRow[];
  const personale = (personaleRes.data ?? []) as EventoPersonaleRow[];
  const materiali = (materialiRes.data ?? []) as EventoMaterialeRow[];
  const merch = (merchRes.data ?? []) as EventoMerchRow[];
  const budgetExtra = (budgetExtraRes.data ?? []) as BudgetExtraRow[];
  const bar = (barRes.data ?? []) as BarArticoloRow[];
  const catering = (cateringRes.data ?? []) as CateringRow[];
  const foodTruck = (foodTruckRes.data ?? []) as FoodTruckRow[];
  const sponsor = (sponsorRes.data ?? []) as EventoSponsorRow[];
  const stime = (stimeRes.data ?? []) as StimaRow[];

  const stimaMap = new Map<string, number>(
    stime.map((s) => [s.chiave, Number(s.importo)]),
  );
  const stimaOf = (chiave: string) => stimaMap.get(chiave) ?? 0;

  // Effettivi
  const totaleArtistiFee = artisti.reduce(
    (s, r) => s + Number(r.artist_fee ?? 0),
    0,
  );
  const totaleArtistiProd = artisti.reduce(
    (s, r) => s + Number(r.costi_produzione ?? 0),
    0,
  );
  const totaleTrasportiArtisti = artisti.reduce(
    (s, r) => s + Number(r.costi_trasporto ?? 0),
    0,
  );
  const totalePersonale = personale
    .filter((r) => r.confermato)
    .reduce((s, r) => s + Number(r.compenso ?? 0), 0);
  const totaleTrasportiPersonale = personale
    .filter((r) => r.confermato)
    .reduce((s, r) => s + Number(r.costi_trasporto ?? 0), 0);
  const totaleTrasporti =
    totaleTrasportiArtisti + totaleTrasportiPersonale;
  const totaleMateriali = materiali
    .filter((r) => !r.gia_disponibile)
    .reduce(
      (s, r) => s + Number(r.quantita) * Number(r.prezzo_unitario ?? 0),
      0,
    );
  const totaleMerchSpesa = merch
    .filter((r) => r.inclusa_nel_budget)
    .reduce((s, r) => s + Number(r.costo_totale), 0);
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
        (Number(r.incasso_lordo_stimato ?? 0) *
          Number(r.percentuale_matazz ?? 0)) /
          100,
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

  const usciteExtra = budgetExtra.filter((r) => r.tipo === "Uscita");
  const entrateExtra = budgetExtra.filter((r) => r.tipo === "Entrata");
  const voceExtraLines = (r: BudgetExtraRow): BudgetLine => ({
    chiave: `voce_extra_${r.id}`,
    label: r.voce,
    effettivo: Number(r.importo),
    stima: stimaOf(`voce_extra_${r.id}`),
  });

  const realeAttivo = incassoRealeVendite != null;

  // Try new table first; fall back to old single columns
  let barCostoReale: number | null = null;
  if (!barCostiRealiRes.error && barCostiRealiRes.data) {
    const withCosto = (barCostiRealiRes.data as { costo_reale: number | null }[]).filter(
      (r) => r.costo_reale != null,
    );
    if (withCosto.length > 0)
      barCostoReale = withCosto.reduce((s, r) => s + Number(r.costo_reale), 0);
  } else {
    const n = evento.bar_costo_reale_nostri != null ? Number(evento.bar_costo_reale_nostri) : null;
    const f = evento.bar_costo_reale_fornitori != null ? Number(evento.bar_costo_reale_fornitori) : null;
    if (n != null || f != null) barCostoReale = (n ?? 0) + (f ?? 0);
  }
  const barCostoEffettivo = barAttivo ? (barCostoReale ?? barCosto) : 0;

  const foodTruckAcquistoSel = foodTruck.filter(
    (r) => r.selezionata && r.modello === "Acquisto",
  );

  const uscite: BudgetLine[] = [
    {
      chiave: "artisti_fee",
      label: "Artisti — fee",
      effettivo: totaleArtistiFee,
      stima: stimaOf("artisti_fee"),
    },
    {
      chiave: "artisti_produzione",
      label: "Artisti — costi produzione",
      effettivo: totaleArtistiProd,
      stima: stimaOf("artisti_produzione"),
    },
    {
      chiave: "personale",
      label: "Personale (compensi confermati)",
      effettivo: totalePersonale,
      stima: stimaOf("personale"),
    },
    {
      chiave: "trasporti",
      label: "Trasporti (artisti + personale)",
      effettivo: totaleTrasporti,
      stima: stimaOf("trasporti"),
    },
    {
      chiave: "materiali",
      label: "Materiali (da comprare)",
      effettivo: totaleMateriali,
      stima: stimaOf("materiali"),
    },
    {
      chiave: "merchandising",
      label: "Merchandising (produzione)",
      effettivo: totaleMerchSpesa,
      stima: stimaOf("merchandising"),
    },
    {
      chiave: "bar_costo",
      label: barAttivo
        ? barCostoReale != null
          ? "Bar — costo merci (reale)"
          : "Bar — costo merci (stimato)"
        : "Bar — costo merci (escluso)",
      effettivo: barCostoEffettivo,
      stima: stimaOf("bar_costo"),
    },
    ...catering
      .filter((r) => r.selezionata)
      .map((r) => {
        const effettivo =
          r.modello === "Totale"
            ? Number(r.prezzo_totale)
            : Number(r.prezzo_per_persona) * Number(r.numero_persone);
        return {
          chiave: `catering_${r.id}`,
          label: `Cena — ${r.nome_fornitore}`,
          effettivo,
          stima: stimaOf(`catering_${r.id}`),
        };
      }),
    ...foodTruckAcquistoSel.map((r) => ({
      chiave: `food_truck_acq_${r.id}`,
      label: foodTruckAttivo
        ? `${r.nome ?? "Food truck"} — costo acquisto`
        : `${r.nome ?? "Food truck"} — costo acquisto (escluso)`,
      effettivo: foodTruckAttivo
        ? Number(r.costo_unitario ?? 0) * Number(r.quantita_acquistata ?? 0)
        : 0,
      stima: stimaOf(`food_truck_acq_${r.id}`),
    })),
    ...usciteExtra.map(voceExtraLines),
  ];

  const entrate: BudgetLine[] = [
    {
      chiave: "bar_ricavo",
      label: barAttivo ? "Bar — ricavo vendite (stimato)" : "Bar — ricavo vendite (escluso)",
      effettivo: barAttivo && !realeAttivo ? barRicavo : 0,
      stima: stimaOf("bar_ricavo"),
      effettivoIsOverridden: barAttivo,
    },
    {
      chiave: "food_truck",
      label: foodTruckAttivo
        ? "Food truck — percentuale (selezionati)"
        : "Food truck — percentuale (escluso)",
      effettivo: foodTruckAttivo ? totaleFoodTruckPerc : 0,
      stima: stimaOf("food_truck"),
    },
    {
      chiave: "food_truck_acquisto",
      label: foodTruckAttivo
        ? "Food truck — acquisto e rivendita (stimato)"
        : "Food truck — acquisto e rivendita (escluso)",
      effettivo: foodTruckAttivo && !realeAttivo ? totaleFoodTruckAcq : 0,
      stima: stimaOf("food_truck_acquisto"),
      effettivoIsOverridden: foodTruckAttivo,
    },
    {
      chiave: "sponsor",
      label: "Sponsor (confermati)",
      effettivo: totaleSponsor,
      stima: stimaOf("sponsor"),
    },
    {
      chiave: "merchandising_stima",
      label: "Merchandising (stima vendite)",
      effettivo: 0,
      stima: stimaOf("merchandising_stima"),
      effettivoIsOverridden: true,
    },
    {
      chiave: "incasso_reale_vendite",
      label: "Incasso reale vendite (bar + cibo + merch)",
      effettivo: incassoRealeVendite ?? 0,
      stima: 0,
      isIncassoReale: true,
    },
    ...entrateExtra.map(voceExtraLines),
  ];

  const saldoConto = await getSaldoConto();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
          Budget e Costi
        </h2>
        <p className="text-sm text-neutral-600 mt-1 leading-relaxed">
          Qui trovate il <strong>quadro economico dell&apos;evento</strong>: il budget che decidiamo di stanziare
          voce per voce, e i <strong>costi effettivi e le entrate</strong> che si aggiornano automaticamente
          man mano che riempite artisti, sponsor, food &amp; beverage, materiali e voci extra.
          Prima dell&apos;evento i numeri sono stime; una volta chiuso l&apos;evento i dati diventeranno reali e definitivi.
        </p>
      </div>

      <BudgetClient
        eventoId={id}
        uscite={uscite}
        entrate={entrate}
        saldoConto={saldoConto}
        incassoRealeVendite={incassoRealeVendite}
      />
    </div>
  );
}
