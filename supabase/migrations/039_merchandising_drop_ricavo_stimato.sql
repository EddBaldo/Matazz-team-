-- La stima ricavi del merch diventa unica a livello evento, salvata in
-- evento_budget_stime con chiave 'merchandising_stima'.
-- Non serve più la colonna per riga.

alter table evento_merchandising drop column if exists ricavo_stimato;
