-- Catering: sostituisce il singolo campo "importo" con prezzo_per_persona +
-- numero_persone. Importo totale = prezzo_per_persona × numero_persone
-- (calcolato al volo). Migrazione: i record esistenti diventano "1 persona
-- al prezzo dell'importo" per non perdere il valore.

alter table evento_catering
  add column if not exists prezzo_per_persona numeric not null default 0;
alter table evento_catering
  add column if not exists numero_persone integer not null default 0;

update evento_catering
set prezzo_per_persona = importo,
    numero_persone = 1
where importo > 0
  and prezzo_per_persona = 0
  and numero_persone = 0;

alter table evento_catering drop column if exists importo;
