-- Stime di vendita per Bar e Food Truck (Acquisto).
-- - persone_stimati e bevande_per_persona vivono sull'evento (uniche per tutta la F&B).
-- - Ogni articolo bar e food acquisto ha una quota % della folla che lo consuma.
-- - La quantità stimata viene calcolata al volo:
--     bar:           persone × bevande_per_persona × quota / 100
--     food acquisto: persone × quota / 100

alter table eventi
  add column if not exists persone_stimati integer not null default 0;

alter table eventi
  add column if not exists bevande_per_persona numeric not null default 0;

alter table evento_bar_articoli
  add column if not exists quota_stimata numeric not null default 0;

alter table evento_food_truck
  add column if not exists quota_stimata numeric not null default 0;
