-- Introduce il concetto di "giornata" come entità che possiede le voci di programma.
-- Una voce a 00:30 logicamente parte del sabato (post-mezzanotte) deve restare
-- nella giornata di sabato. La data viene tolta dalla voce e spostata sulla giornata.

create table if not exists evento_giornate (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventi(id) on delete cascade,
  data date not null,
  descrizione text,
  creato_da_id uuid references team_matazz(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (evento_id, data)
);

create index if not exists evento_giornate_evento_idx
  on evento_giornate (evento_id, data);

alter table evento_giornate enable row level security;

-- Aggiunge giornata_id alle voci di programma (nullable per il backfill)
alter table evento_programma
  add column if not exists giornata_id uuid references evento_giornate(id) on delete cascade;

-- Backfill: per ogni (evento_id, data) distinto crea la giornata se non esiste
insert into evento_giornate (evento_id, data, creato_da_id)
select distinct
  p.evento_id,
  p.data,
  (select creato_da_id from evento_programma where evento_id = p.evento_id and data = p.data limit 1)
from evento_programma p
where p.giornata_id is null
  and not exists (
    select 1 from evento_giornate g
    where g.evento_id = p.evento_id and g.data = p.data
  );

-- Collega le voci esistenti alla giornata corrispondente
update evento_programma p
set giornata_id = g.id
from evento_giornate g
where p.evento_id = g.evento_id
  and p.data = g.data
  and p.giornata_id is null;

-- Ora giornata_id è obbligatorio
alter table evento_programma alter column giornata_id set not null;

-- La data non sta più sulla voce: vive sulla giornata
drop index if exists evento_programma_evento_idx;
alter table evento_programma drop column if exists data;

create index if not exists evento_programma_giornata_idx
  on evento_programma (giornata_id, ora_inizio);
