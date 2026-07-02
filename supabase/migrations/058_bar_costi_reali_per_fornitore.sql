-- food_truck_costo_reale_acquisto (from planned 057, safe to re-run)
alter table eventi add column if not exists food_truck_costo_reale_acquisto numeric;

-- Per-fonte bar cost tracking (replaces bar_costo_reale_nostri/fornitori single-value columns)
create table if not exists evento_bar_costi_reali (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventi(id) on delete cascade,
  fonte text not null,
  costo_reale numeric,
  pagato_da text,
  unique(evento_id, fonte)
);
