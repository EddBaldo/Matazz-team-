-- Compiti "turni": un compito padre contiene N sotto-turni con orario+persona.
-- Caso d'uso: programmare i turni del personale bar di una giornata in un'unica
-- voce, senza intasare il calendario con 5 pallini separati.

alter table compiti
  add column if not exists tipo text not null default 'singolo';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'compiti_tipo_check'
  ) then
    alter table compiti add constraint compiti_tipo_check
      check (tipo in ('singolo', 'turni'));
  end if;
end $$;

create table if not exists compiti_sub (
  id uuid primary key default gen_random_uuid(),
  compito_id uuid not null references compiti(id) on delete cascade,
  personale_id uuid references personale_esterno(id) on delete set null,
  nome_libero text,
  ora_inizio time,
  ora_fine time,
  note text,
  ordine int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists compiti_sub_compito_idx
  on compiti_sub (compito_id, ordine);

alter table compiti_sub enable row level security;
