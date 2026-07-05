-- pagato_da for artisti and personale (who on the team covered expenses)
alter table evento_artisti add column if not exists pagato_da text;
alter table evento_personale add column if not exists pagato_da text;

-- Reimbursement tracking: one row per expense item, tracks whether it's been reimbursed
create table if not exists evento_rimborsi (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventi(id) on delete cascade,
  categoria text not null,
  source_id text not null,
  rimborsato boolean not null default false,
  updated_at timestamptz not null default now(),
  unique(evento_id, categoria, source_id)
);
