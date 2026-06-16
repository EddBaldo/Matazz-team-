-- Rinomina la colonna ingombro in costi_trasporto su evento_artisti.
-- I dati esistenti restano: la colonna cambia solo nome.

alter table evento_artisti
  rename column ingombro to costi_trasporto;
