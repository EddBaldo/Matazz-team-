-- Semplifica evento_merchandising:
-- - 'costo_unitario' diventa 'costo_totale' (spesso compriamo a stock,
--   non per pezzo; più semplice tracciare il totale).
-- - aggiunge 'ricavo_stimato' per stimare quanto incassiamo vendendoli;
--   entra come voce di entrata nel Budget.

alter table evento_merchandising
  rename column costo_unitario to costo_totale;

alter table evento_merchandising
  add column if not exists ricavo_stimato numeric(10, 2) not null default 0;
