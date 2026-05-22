-- Cena dell'evento: gestione degli invitati.
-- - Aggiunge un flag "presente_cena" su artisti e personale dell'evento.
-- - Aggiunge una tabella per ospiti extra (Family & Friends) con un nome per riga.

alter table evento_artisti
  add column if not exists presente_cena boolean not null default false;

alter table evento_personale
  add column if not exists presente_cena boolean not null default false;

create table if not exists evento_cena_ospiti (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventi(id) on delete cascade,
  nome text not null,
  note text,
  creato_da_id uuid references team_matazz(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists evento_cena_ospiti_evento_id_idx
  on evento_cena_ospiti (evento_id);

alter table evento_cena_ospiti enable row level security;
