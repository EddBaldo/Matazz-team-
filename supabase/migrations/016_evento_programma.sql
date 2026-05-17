-- Tabella delle voci di programma di un evento (timeline giorno per giorno).
-- Ogni voce è una riga indipendente: data + ora_inizio + (ora_fine opzionale) + titolo + descrizione.

create table if not exists evento_programma (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventi(id) on delete cascade,
  data date not null,
  ora_inizio time,
  ora_fine time,
  titolo text not null,
  descrizione text,
  creato_da_id uuid references team_matazz(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists evento_programma_evento_idx
  on evento_programma (evento_id, data, ora_inizio);

alter table evento_programma enable row level security;

-- Seed iniziale (idempotente) per l'evento di test
do $$
declare
  target_id uuid;
  ev_count int;
  t_edu uuid;
begin
  select count(*) into ev_count from eventi;
  if ev_count <> 1 then
    -- skip seed se eventi != 1 (utente specifico già configurato)
    return;
  end if;
  select id into target_id from eventi limit 1;
  select id into t_edu from team_matazz where nome = 'Edu';

  if not exists (select 1 from evento_programma where evento_id = target_id) then
    insert into evento_programma (evento_id, data, ora_inizio, ora_fine, titolo, descrizione, creato_da_id) values
      (target_id, '2026-06-25', '18:30', null,    'Cena artisti',          'Cena con gli artisti e preview privata della mostra.', t_edu),
      (target_id, '2026-06-26', '14:00', '21:30', 'Apertura ufficiale',    'Vernissage. Nella mattinata: ritratti artisti e documentazione opere.', t_edu),
      (target_id, '2026-06-27', '11:00', '00:00', 'Mostra aperta',         'Mostra aperta tutto il giorno. La sera: performance musicali.', t_edu),
      (target_id, '2026-06-28', '14:00', '18:00', 'Ultimo giorno mostra',  'Chiusura della mostra.', t_edu);
  end if;
end $$;
