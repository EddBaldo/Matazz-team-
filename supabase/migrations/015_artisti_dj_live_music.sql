-- Aggiunge 'DJ' e 'Live Music' come tipi_arte sotto la macro "Musica sera".
-- "Musica Sera" come tipo resta valido per non rompere i record esistenti.

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
    'Quadri',
    'DJ',
    'Live Music'
  ));
