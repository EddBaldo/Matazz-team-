-- Categoria per raggruppare lo staff nelle viste a livello evento.
-- 4 categorie operative + "Altro" per i casi fuori scaletta.
-- Nullable per non rompere i record esistenti — i form la rendono obbligatoria
-- in inserimento/modifica.

alter table personale_esterno
  add column categoria text
  check (categoria in (
    'Fotografi/Videomaker',
    'Bar',
    'Tecnici audio',
    'Allestimento',
    'Altro'
  ));
