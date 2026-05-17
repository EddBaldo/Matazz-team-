-- Ridisegno tab Materiali: aggiungo campi descrittivi e checkbox "preso".
-- Mantengo gia_disponibile/inventario_id come retrocompatibilità (usati nel calcolo budget),
-- ma il form UI non li espone più: per dire "da inventario" si scrive nel campo testo.

alter table evento_materiali
  add column a_cosa_serve text,
  add column dove_lo_prendiamo text,
  add column preso boolean not null default false;
