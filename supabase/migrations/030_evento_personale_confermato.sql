-- Aggiunge stato "confermato" al personale di un evento, analogo agli artisti.
-- Default false: una persona aggiunta è "da confermare" finché non confermata.

alter table evento_personale
  add column if not exists confermato boolean not null default false;
