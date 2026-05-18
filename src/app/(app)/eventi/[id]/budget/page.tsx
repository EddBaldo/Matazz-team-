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
};
type EventoPersonaleRow = { compenso: number | null };
type EventoMaterialeRow = {
  quantita: number;
  prezzo_unitario: number | null;
  gia_disponibile: boolean;
};
type EventoMerchRow = {
  costo_totale: number;
};
type BudgetExtraRow = { importo: number; tipo: string };
type BarArticoloRow = {
  costo_unitario: number | null;
  prezzo_vendita: number | null;
  quantita_stimata: number;
};
type CateringRow = {
  prezzo_per_persona: number;
  numero_persone: number;
  selezionata: boolean;
};
type FoodTruckRow = {
  modello: string | null;
  incasso_lordo_stimato: number | null;
  percentuale_matazz: number | null;
  costo_unitario: number | null;
  prezzo_vendita: number | null;
  quantita_stimata: number | null;
  selezionata: boolean;
};
type EventoSponsorRow = { stato: string; importo: number };
type StimaRow = { chiave: string; importo: number };

export default async function EventoBudgetPage({ params }: Props) {
  const { id } = await params;
  const sb = createServerClient();

  const [
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
  ] = await Promise.all([
    sb
      .from("evento_artisti")
      .select("artist_fee, costi_produzione")
      .eq("evento_id", id),
    sb.from("evento_personale").select("compenso").eq("evento_id", id),
    sb
      .from("evento_materiali")
      .select("quantita, prezzo_unitario, gia_disponibile")
      .eq("evento_id", id),
    sb
      .from("evento_merchandising")
      .select("costo_totale")
      .eq("evento_id", id),
    sb
      .from("evento_budget_extra")
      .select("importo, tipo")
      .eq("evento_id", id),
    sb
      .from("evento_bar_articoli")
      .select("costo_unitario, prezzo_vendita, quantita_stimata")
      .eq("evento_id", id),
    sb
      .from("evento_catering")
      .select("prezzo_per_persona, numero_persone, selezionata")
      .eq("evento_id", id),
    sb
      .from("evento_food_truck")
      .select(
        "modello, incasso_lordo_stimato, percentuale_matazz, costo_unitario, prezzo_vendita, quantita_stimata, selezionata",
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
  ]);

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
  const totaleMerchSpesa = merch.reduce(
    (s, r) => s + Number(r.costo_totale),
    0,
  );
  const barRicavo = bar.reduce(
    (s, r) => s + Number(r.prezzo_vendita ?? 0) * Number(r.quantita_stimata),
    0,
  );
  const barCosto = bar.reduce(
    (s, r) => s + Number(r.costo_unitario ?? 0) * Number(r.quantita_stimata),
    0,
  );
  const totaleCatering = catering
    .filter((r) => r.selezionata)
    .reduce(
      (s, r) => s + Number(r.prezzo_per_persona) * Number(r.numero_persone),
      0,
    );
  const totaleFoodTruck = foodTruck
    .filter((r) => r.selezionata)
    .reduce((s, r) => {
      if (r.modello === "Acquisto") {
        const margine =
          Number(r.prezzo_vendita ?? 0) - Number(r.costo_unitario ?? 0);
        return s + margine * Number(r.quantita_stimata ?? 0);
      }
      return (
        s +
        (Number(r.incasso_lordo_stimato ?? 0) *
          Number(r.percentuale_matazz ?? 0)) /
          100
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
      label: "Personale (compensi)",
      effettivo: totalePersonale,
      stima: stimaOf("personale"),
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
      label: "Bar — costo merci",
      effettivo: barCosto,
      stima: stimaOf("bar_costo"),
    },
    {
      chiave: "catering",
      label: "Catering (selezionati)",
      effettivo: totaleCatering,
      stima: stimaOf("catering"),
    },
    {
      chiave: "voci_extra_uscite",
      label: "Voci extra",
      effettivo: totaleUsciteExtra,
      stima: stimaOf("voci_extra_uscite"),
    },
  ];

  const entrate: BudgetLine[] = [
    {
      chiave: "bar_ricavo",
      label: "Bar — ricavo vendite",
      effettivo: barRicavo,
      stima: stimaOf("bar_ricavo"),
    },
    {
      chiave: "food_truck",
      label: "Food truck (selezionati)",
      effettivo: totaleFoodTruck,
      stima: stimaOf("food_truck"),
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
    },
    {
      chiave: "voci_extra_entrate",
      label: "Voci extra",
      effettivo: totaleEntrateExtra,
      stima: stimaOf("voci_extra_entrate"),
    },
  ];

  const saldoConto = await getSaldoConto();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
          Budget e Costi
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Il quadro economico dell&apos;evento: budget previsto contro costi
          effettivi. Il saldo non parte da zero ma dal nostro conto attuale —
          così vedete subito dove ci troveremo dopo l&apos;evento. Il budget è
          la nostra previsione editabile a mano; i costi effettivi si
          aggiornano automaticamente man mano che riempite artisti, sponsor,
          food &amp; beverage, materiali e voci extra.
        </p>
      </div>

      <BudgetClient
        eventoId={id}
        uscite={uscite}
        entrate={entrate}
        saldoConto={saldoConto}
      />
    </div>
  );
}
