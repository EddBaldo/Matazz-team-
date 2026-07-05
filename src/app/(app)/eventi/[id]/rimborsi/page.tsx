import { createServerClient } from "@/lib/supabase/server";
import { RimborsiClient, type RimborsoItem } from "./_components/RimborsiClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function RimborsiPage({ params }: Props) {
  const { id } = await params;
  const sb = createServerClient();

  const [
    artistiRes,
    personaleRes,
    materialiRes,
    merchandisingRes,
    barRes,
    foodTruckRes,
    vociExtraRes,
    rimborsiRes,
  ] = await Promise.all([
    sb
      .from("evento_artisti")
      .select(
        "id, artist_fee, costi_produzione, costi_trasporto, pagato_da, artista:artisti(nome, cognome)",
      )
      .eq("evento_id", id),
    sb
      .from("evento_personale")
      .select(
        "id, compenso, costi_trasporto, pagato_da, persona:personale_esterno(nome, cognome)",
      )
      .eq("evento_id", id),
    sb
      .from("evento_materiali")
      .select("id, articolo, quantita, prezzo_unitario, pagato_da")
      .eq("evento_id", id),
    sb
      .from("evento_merchandising")
      .select("id, articolo, costo_totale, pagato_da, inclusa_nel_budget")
      .eq("evento_id", id)
      .eq("inclusa_nel_budget", true),
    sb
      .from("evento_bar_costi_reali")
      .select("id, fonte, costo_reale, pagato_da")
      .eq("evento_id", id),
    sb
      .from("evento_food_truck")
      .select("id, nome, costo_unitario, quantita_acquistata, pagato_da")
      .eq("evento_id", id)
      .eq("modello", "Acquisto"),
    sb
      .from("evento_budget_extra")
      .select("id, voce, importo, pagato_da")
      .eq("evento_id", id)
      .eq("tipo", "Uscita"),
    sb
      .from("evento_rimborsi")
      .select("categoria, source_id, rimborsato")
      .eq("evento_id", id),
  ]);

  type RimborsoRow = { categoria: string; source_id: string; rimborsato: boolean };
  const rimborsiMap = new Map<string, boolean>();
  for (const r of (rimborsiRes.data ?? []) as RimborsoRow[]) {
    rimborsiMap.set(`${r.categoria}:${r.source_id}`, r.rimborsato);
  }

  function rimb(categoria: string, sourceId: string): boolean {
    return rimborsiMap.get(`${categoria}:${sourceId}`) ?? false;
  }

  const items: RimborsoItem[] = [];

  // Materiali
  type MaterialeDb = {
    id: string;
    articolo: string;
    quantita: number | null;
    prezzo_unitario: number | null;
    pagato_da: string | null;
  };
  for (const r of (materialiRes.data ?? []) as unknown as MaterialeDb[]) {
    const importo = Number(r.prezzo_unitario ?? 0) * Number(r.quantita ?? 1);
    if (importo === 0 && r.pagato_da == null) continue;
    items.push({
      categoria: "materiali",
      categoriaLabel: "Materiali",
      sourceId: r.id,
      descrizione: r.articolo,
      importo,
      pagatoDa: r.pagato_da,
      rimborsato: rimb("materiali", r.id),
    });
  }

  // Merchandising
  type MerchandisingDb = {
    id: string;
    articolo: string;
    costo_totale: number | null;
    pagato_da: string | null;
    inclusa_nel_budget: boolean;
  };
  for (const r of (merchandisingRes.data ?? []) as unknown as MerchandisingDb[]) {
    const importo = Number(r.costo_totale ?? 0);
    if (importo === 0 && r.pagato_da == null) continue;
    items.push({
      categoria: "merchandising",
      categoriaLabel: "Merchandising",
      sourceId: r.id,
      descrizione: r.articolo,
      importo,
      pagatoDa: r.pagato_da,
      rimborsato: rimb("merchandising", r.id),
    });
  }

  // Bar
  type BarDb = {
    id: string;
    fonte: string;
    costo_reale: number | null;
    pagato_da: string | null;
  };
  for (const r of (barRes.data ?? []) as unknown as BarDb[]) {
    const importo = Number(r.costo_reale ?? 0);
    if (importo === 0 && r.pagato_da == null) continue;
    items.push({
      categoria: "bar",
      categoriaLabel: "Bar",
      sourceId: r.id,
      descrizione: r.fonte,
      importo,
      pagatoDa: r.pagato_da,
      rimborsato: rimb("bar", r.id),
    });
  }

  // Food Truck (Acquisto)
  type FoodTruckDb = {
    id: string;
    nome: string | null;
    costo_unitario: number | null;
    quantita_acquistata: number | null;
    pagato_da: string | null;
  };
  for (const r of (foodTruckRes.data ?? []) as unknown as FoodTruckDb[]) {
    const importo =
      Number(r.costo_unitario ?? 0) * Number(r.quantita_acquistata ?? 0);
    if (importo === 0 && r.pagato_da == null) continue;
    items.push({
      categoria: "food_truck",
      categoriaLabel: "Food Truck",
      sourceId: r.id,
      descrizione: r.nome ?? "Food Truck",
      importo,
      pagatoDa: r.pagato_da,
      rimborsato: rimb("food_truck", r.id),
    });
  }

  // Artisti
  type ArtistaDb = {
    id: string;
    artist_fee: number | null;
    costi_produzione: number | null;
    costi_trasporto: number | null;
    pagato_da: string | null;
    artista: { nome: string; cognome: string } | null;
  };
  for (const r of (artistiRes.data ?? []) as unknown as ArtistaDb[]) {
    const importo =
      Number(r.artist_fee ?? 0) +
      Number(r.costi_produzione ?? 0) +
      Number(r.costi_trasporto ?? 0);
    if (importo === 0 && r.pagato_da == null) continue;
    const nome = r.artista
      ? `${r.artista.nome} ${r.artista.cognome}`.trim()
      : "Artista";
    items.push({
      categoria: "artisti",
      categoriaLabel: "Artisti",
      sourceId: r.id,
      descrizione: nome,
      importo,
      pagatoDa: r.pagato_da,
      rimborsato: rimb("artisti", r.id),
    });
  }

  // Personale
  type PersonaleDb = {
    id: string;
    compenso: number | null;
    costi_trasporto: number | null;
    pagato_da: string | null;
    persona: { nome: string; cognome: string } | null;
  };
  for (const r of (personaleRes.data ?? []) as unknown as PersonaleDb[]) {
    const importo =
      Number(r.compenso ?? 0) + Number(r.costi_trasporto ?? 0);
    if (importo === 0 && r.pagato_da == null) continue;
    const nome = r.persona
      ? `${r.persona.nome} ${r.persona.cognome}`.trim()
      : "Personale";
    items.push({
      categoria: "personale",
      categoriaLabel: "Personale",
      sourceId: r.id,
      descrizione: nome,
      importo,
      pagatoDa: r.pagato_da,
      rimborsato: rimb("personale", r.id),
    });
  }

  // Voci Extra (Uscite)
  type VoceExtraDb = {
    id: string;
    voce: string;
    importo: number | null;
    pagato_da: string | null;
  };
  for (const r of (vociExtraRes.data ?? []) as unknown as VoceExtraDb[]) {
    const importo = Number(r.importo ?? 0);
    if (importo === 0 && r.pagato_da == null) continue;
    items.push({
      categoria: "voci_extra",
      categoriaLabel: "Voci Extra",
      sourceId: r.id,
      descrizione: r.voce,
      importo,
      pagatoDa: r.pagato_da,
      rimborsato: rimb("voci_extra", r.id),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-semibold tracking-tight text-neutral-900">
          Rimborsi
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Tutte le spese dell&apos;evento, raccolte automaticamente dalle altre
          sezioni. Indicate chi ha pagato di tasca propria e spuntate la casella
          una volta che Matazz ha rimborsato.
        </p>
      </div>

      <RimborsiClient eventoId={id} items={items} />
    </div>
  );
}
