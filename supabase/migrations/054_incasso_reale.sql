-- Incasso reale post-evento (bar + cibo rivenduto + merch)
alter table eventi add column if not exists incasso_reale_vendite numeric;

-- Quantità acquistata per food truck modello "Acquisto e rivendita"
alter table evento_food_truck add column if not exists quantita_acquistata numeric;
