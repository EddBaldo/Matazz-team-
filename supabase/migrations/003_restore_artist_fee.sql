-- Ripristina la colonna artist_fee su evento_artisti.
-- Necessaria perché era stata droppata erroneamente nella migration 002
-- precedente (rimossa in seguito a una decisione di tenere il campo).
-- Idempotente: usa IF NOT EXISTS.

alter table evento_artisti
  add column if not exists artist_fee numeric not null default 0;
