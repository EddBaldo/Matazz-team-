-- Esclusioni del team Matazz dalla cena di un evento.
-- Default: tutti i membri di team_matazz partecipano alla cena.
-- Se un membro NON viene, salviamo una riga qui — così non dobbiamo
-- pre-popolare nulla quando creiamo l'evento.

create table if not exists evento_team_cena_esclusi (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventi(id) on delete cascade,
  team_matazz_id uuid not null references team_matazz(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (evento_id, team_matazz_id)
);

create index if not exists evento_team_cena_esclusi_evento_id_idx
  on evento_team_cena_esclusi (evento_id);

alter table evento_team_cena_esclusi enable row level security;
