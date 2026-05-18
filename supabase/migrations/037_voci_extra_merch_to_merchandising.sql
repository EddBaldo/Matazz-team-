-- Sposta da evento_budget_extra → evento_merchandising le righe che riguardano
-- merch (heuristica su voce/categoria). Importo viene messo come costo
-- unitario con quantità = 1; poi modificabile a mano dalla pagina.

insert into evento_merchandising (evento_id, articolo, quantita, costo_unitario, note, created_at)
select
  evento_id,
  voce,
  1,
  abs(importo),
  note,
  now()
from evento_budget_extra
where tipo = 'Uscita'
  and (
    lower(voce) like '%merch%'
    or lower(coalesce(categoria, '')) like '%merch%'
  );

delete from evento_budget_extra
where tipo = 'Uscita'
  and (
    lower(voce) like '%merch%'
    or lower(coalesce(categoria, '')) like '%merch%'
  );
