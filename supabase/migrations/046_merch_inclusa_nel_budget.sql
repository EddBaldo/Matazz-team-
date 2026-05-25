-- Merchandising: flag per decidere se l'articolo entra o no nel conteggio del budget.
-- Default true: gli articoli esistenti restano inclusi (nessuna sorpresa nei conti).

alter table evento_merchandising
  add column if not exists inclusa_nel_budget boolean not null default true;
