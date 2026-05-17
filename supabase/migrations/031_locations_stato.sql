-- Aggiunge il campo "stato" (paese) alle location, per raggrupparle nella vista scouting.
-- Default "Svizzera" — la maggior parte delle location attuali è in CH.

alter table locations
  add column if not exists stato text not null default 'Svizzera';

-- Backfill esplicito (per le righe esistenti il default è già stato applicato dall'ALTER,
-- ma teniamo l'update per essere idempotenti e chiari).
update locations
set stato = 'Svizzera'
where stato is null or trim(stato) = '';
