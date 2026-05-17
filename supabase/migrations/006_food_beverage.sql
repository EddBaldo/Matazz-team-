-- Food & Beverage: nuove 3 tabelle per gestire Bar interno, offerte di Catering
-- (cena, ecc.) e offerte di Food truck (con percentuale che spetta a Matazz).
-- evento_catering e evento_food_truck hanno il flag "selezionata": solo le
-- righe selezionate entrano nel calcolo del Budget. Il Bar entra sempre.

create table if not exists evento_bar_articoli (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventi(id) on delete cascade,
  articolo text not null,
  costo_unitario numeric not null default 0,
  prezzo_vendita numeric not null default 0,
  quantita_stimata integer not null default 0,
  note text,
  creato_da_id uuid references team_matazz(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists evento_catering (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventi(id) on delete cascade,
  nome_fornitore text not null,
  descrizione text,
  importo numeric not null default 0,
  selezionata boolean not null default false,
  note text,
  creato_da_id uuid references team_matazz(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists evento_food_truck (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventi(id) on delete cascade,
  nome text not null,
  incasso_lordo_stimato numeric not null default 0,
  percentuale_matazz numeric not null default 0,
  selezionata boolean not null default false,
  note text,
  creato_da_id uuid references team_matazz(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table evento_bar_articoli enable row level security;
alter table evento_catering enable row level security;
alter table evento_food_truck enable row level security;
