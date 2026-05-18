-- Merchandising per evento: articoli che produciamo per venderli (T-shirt,
-- poster, sticker, totebag…). Per ora tracciamo solo il costo di produzione
-- (entra come uscita nel Budget). Eventuali ricavi possono essere aggiunti
-- come voce extra entrata.

create table if not exists evento_merchandising (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventi(id) on delete cascade,
  articolo text not null,
  quantita integer not null default 1,
  costo_unitario numeric(10, 2) not null default 0,
  note text,
  creato_da_id uuid references team_matazz(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists evento_merchandising_evento_id_idx
  on evento_merchandising (evento_id);

alter table evento_merchandising enable row level security;
