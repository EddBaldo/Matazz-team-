-- Catering: aggiunge il modello prezzo ("PerPersona" o "Totale")
-- e una colonna prezzo_totale per il caso flat.
-- numero_persone (già esistente) torna ad essere editabile manualmente.

alter table evento_catering
  add column if not exists modello text not null default 'PerPersona'
  check (modello in ('PerPersona', 'Totale'));

alter table evento_catering
  add column if not exists prezzo_totale numeric not null default 0;
