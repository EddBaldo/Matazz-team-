-- Costo reale post-evento bar (separato per nostri/fornitori)
alter table eventi add column if not exists bar_costo_reale_nostri numeric;
alter table eventi add column if not exists bar_costo_reale_fornitori numeric;
