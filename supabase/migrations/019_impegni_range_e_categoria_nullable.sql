-- Impegni più flessibili:
-- - data_fine opzionale → un impegno può durare più giorni nel calendario globale
-- - categoria nullable → la "tabella di marcia" di un evento crea voci senza team

alter table compiti
  add column data_fine date;

alter table compiti
  alter column categoria drop not null;
