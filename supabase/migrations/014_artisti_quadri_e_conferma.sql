-- Step A: aggiungere 'Quadri' al tipo_arte ammesso.
-- Step B: campo confermato su evento_artisti (default false),
-- backfill = true per artisti con doc_mandati='Sì' (criterio iniziale).

-- Il check inline ha nome auto-generato. Lo rimuovo e ricreo con i tipi nuovi.
alter table artisti drop constraint if exists artisti_tipo_arte_check;
alter table artisti
  add constraint artisti_tipo_arte_check
  check (tipo_arte in (
    'Installazione',
    'Installazione-Sonora',
    'Installazione-Performance',
    'Video',
    'Danza',
    'Performance Musica',
    'Musica Sera',
    'Quadri'
  ));

alter table evento_artisti
  add column confermato boolean not null default false;

update evento_artisti
  set confermato = true
  where doc_mandati = 'Sì';
