-- Aggiunge "Collaborazione" come tipo_arte: collettivi / artisti con cui
-- collaboriamo in modo diverso dal solito (es. partnership, residenze, ecc).

alter table artisti
  drop constraint if exists artisti_tipo_arte_check;

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
    'Live Music',
    'Collaborazione'
  ));
