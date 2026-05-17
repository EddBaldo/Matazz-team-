-- Stime di budget per evento: una stima per ogni voce di breakdown.
-- L'effettivo viene calcolato a runtime dalle altre tabelle. La stima è una
-- previsione editabile dall'utente per pianificare in anticipo.

create table if not exists evento_budget_stime (
  evento_id uuid not null references eventi(id) on delete cascade,
  chiave text not null,
  importo numeric not null default 0,
  updated_at timestamptz not null default now(),
  primary key (evento_id, chiave)
);

alter table evento_budget_stime enable row level security;
