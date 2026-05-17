-- Conto Matazz: traccia dei movimenti del conto/cassa.
-- Importo positivo = entrata, importo negativo = uscita.
-- Il saldo corrente è la somma di tutti gli importi.

create table if not exists conto_movimenti (
  id uuid primary key default gen_random_uuid(),
  data date not null default current_date,
  descrizione text not null,
  importo numeric(12, 2) not null,
  creato_da_id uuid references team_matazz(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists conto_movimenti_data_idx
  on conto_movimenti (data desc);

alter table conto_movimenti enable row level security;
