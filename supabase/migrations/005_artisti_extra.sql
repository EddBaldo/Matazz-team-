-- Rubrica artisti: aggiunge link_opera e residenza.
-- Nuova tabella artisti_eventi_interesse (relazione many-to-many separata
-- da evento_artisti — qui sono solo "candidature / suggerimenti", non
-- partecipazioni effettive).

alter table artisti
  add column if not exists link_opera text;

alter table artisti
  add column if not exists residenza text;

create table if not exists artisti_eventi_interesse (
  id uuid primary key default gen_random_uuid(),
  artista_id uuid not null references artisti(id) on delete cascade,
  evento_id uuid not null references eventi(id) on delete cascade,
  creato_da_id uuid references team_matazz(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (artista_id, evento_id)
);

alter table artisti_eventi_interesse enable row level security;
