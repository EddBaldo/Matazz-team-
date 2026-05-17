-- Aggiunge il link opzionale ai movimenti del conto: un movimento può
-- essere collegato a un evento (es. saldo automatico alla conclusione).
-- Permette di rimuovere quel movimento se l'evento viene riaperto.

alter table conto_movimenti
  add column if not exists evento_id uuid
    references eventi(id) on delete set null;

create index if not exists conto_movimenti_evento_idx
  on conto_movimenti (evento_id);
