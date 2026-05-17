-- Esempio: turni bar per il sabato dell'evento test.
-- Crea un compito di tipo "turni" categoria Personale con 5 sotto-turni.
-- Idempotente: gira solo se l'evento esiste, e se non c'è già "Turni bar".

do $$
declare
  target_id uuid;
  ev_count int;
  t_edu uuid;
  new_id uuid;
begin
  select count(*) into ev_count from eventi;
  if ev_count <> 1 then
    return;
  end if;
  select id into target_id from eventi limit 1;
  select id into t_edu from team_matazz where nome = 'Edu';

  if exists (
    select 1 from compiti
    where evento_id = target_id and titolo = 'Turni bar'
  ) then
    return;
  end if;

  insert into compiti
    (evento_id, titolo, data, tipo, categoria, descrizione, creato_da_id)
  values
    (target_id, 'Turni bar', '2026-06-27', 'turni', 'Personale',
     'Copertura cassa e servizio bar per la giornata di sabato.', t_edu)
  returning id into new_id;

  insert into compiti_sub (compito_id, nome_libero, ora_inizio, ora_fine, note, ordine)
  values
    (new_id, 'Marta R.',    '14:00', '18:30', 'Apertura e cambio',           0),
    (new_id, 'Davide L.',   '14:00', '20:00', 'Bar 1',                        1),
    (new_id, 'Giulia P.',   '18:00', '23:00', 'Bar 2 + supporto cassa',       2),
    (new_id, 'Alessio M.',  '20:00', '01:00', 'Cassa serale',                 3),
    (new_id, 'Beatrice S.', '22:00', '02:00', 'Chiusura + pulizia',           4);
end $$;
