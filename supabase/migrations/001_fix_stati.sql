-- Riduce gli stati validi degli eventi a "In pianificazione" e "Concluso"
-- (rimuovi "In corso" e "Annullato" dal CHECK constraint).
--
-- ATTENZIONE: la migration fallisce se ci sono eventi esistenti con stato
-- "In corso" o "Annullato". Eliminarli prima dall'UI (o aggiornarli a uno
-- dei due valori validi) e poi lanciare questo script.

alter table eventi drop constraint if exists eventi_stato_check;
alter table eventi
  add constraint eventi_stato_check
  check (stato in ('In pianificazione', 'Concluso'));
