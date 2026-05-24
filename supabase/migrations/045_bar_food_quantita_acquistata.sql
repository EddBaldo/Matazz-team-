-- Bar + Food Truck Acquisto: separa "quante ne compriamo" dalla "stima vendite".
-- - quantita_acquistata: numero di pezzi che acquistiamo davvero (drive il costo).
-- - consumo_per_persona: stima di quanti ne consuma in media una persona
--   (drive il ricavo: persone × consumo × prezzo_vendita).
-- Le vecchie colonne (quota_stimata, quantita_stimata, bevande_per_persona)
-- restano in DB ma non sono più usate dal codice — possono essere droppate in seguito.

alter table evento_bar_articoli
  add column if not exists quantita_acquistata integer not null default 0;

alter table evento_bar_articoli
  add column if not exists consumo_per_persona numeric not null default 0;

alter table evento_food_truck
  add column if not exists quantita_acquistata integer not null default 0;

alter table evento_food_truck
  add column if not exists consumo_per_persona numeric not null default 0;
