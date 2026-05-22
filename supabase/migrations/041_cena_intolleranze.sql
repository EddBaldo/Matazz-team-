-- Intolleranze cibo per la cena.
-- - Aggiunge un campo intolleranze su evento_personale (allineato ad evento_artisti).
-- - Rinomina note → intolleranze_cibo su evento_cena_ospiti (il campo nasce ora,
--   nessun dato significativo da migrare).

alter table evento_personale
  add column if not exists intolleranze_cibo text;

alter table evento_cena_ospiti
  rename column note to intolleranze_cibo;
