-- Chi ha pagato di tasca propria (materiali, voci extra, merchandising)
alter table evento_materiali add column if not exists pagato_da text;
alter table evento_budget_extra add column if not exists pagato_da text;
alter table evento_merchandising add column if not exists pagato_da text;
