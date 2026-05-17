-- Sostituisce i compiti di esempio della tabella di marcia con il piano
-- editoriale/comunicazione "Volto" per l'evento Zahn der Zeit.
-- Idempotente: cancella i vecchi titoli e inserisce solo i nuovi se mancano.

do $$
declare
  target_id uuid;
  ev_count int;
  t_edu uuid;
  -- titoli vecchi da rimuovere
  old_titles text[] := array[
    'Stampare locandine A3 e flyer',
    'Conferma definitiva contratti artisti',
    'Preparare borse welcome staff',
    'Briefing tecnici audio',
    'Conferma menu catering finale',
    'Caricare furgone allestimento',
    'Ritiro stampe e cartellonistica',
    'Allestimento palco e quinte',
    'Installazione luci e soundcheck',
    'Briefing staff completo',
    'Accoglienza artisti per cena',
    'Apertura cassa bar e cambio fondi',
    'Vernissage e welcome ospiti',
    'Foto e video evento',
    'Check sicurezza accessi',
    'Coordinamento performance sera',
    'Chiusura mostra e ringraziamenti',
    'Smontaggio palco e impianto',
    'Smontaggio luci',
    'Resi magazzino e inventario',
    'Fatturazione sponsor confermati',
    'Turni bar'
  ];
begin
  select count(*) into ev_count from eventi;
  if ev_count = 0 then
    return;
  end if;

  -- Prendi l'evento "Zahn der Zeit" se esiste, altrimenti il primo evento
  select id into target_id from eventi
   where nome ilike 'Zahn der Zeit' limit 1;
  if target_id is null then
    select id into target_id from eventi limit 1;
  end if;

  select id into t_edu from team_matazz where nome = 'Edu';

  -- Cancella i vecchi compiti di esempio (e i relativi compiti_sub via cascade)
  delete from compiti
   where evento_id = target_id
     and titolo = any(old_titles);

  -- Inserisci i nuovi compiti Volto, saltando quelli già presenti per titolo
  insert into compiti
    (evento_id, titolo,                                                                                                    data,         data_fine,     ora,  categoria, assegnato_a_id, descrizione, fatto, creato_da_id)
  select target_id, v.titolo, v.data::date, v.data_fine::date, null::time, 'Volto', null::uuid, null::text, false, t_edu
  from (values
    -- Singoli
    ('save the date',                                                                                                       '2026-05-08', null),
    ('Flyer 4x5',                                                                                                            '2026-05-18', null),
    ('Post concetto 4x5',                                                                                                    '2026-05-26', null),
    ('Reel flyer animato 9x16',                                                                                              '2026-06-02', null),
    ('Stroria con flyer evento 9x16?',                                                                                       '2026-06-06', null),
    ('Reel artisti 9x16',                                                                                                    '2026-06-10', null),
    ('Carosello artisti 4x5',                                                                                                '2026-06-18', null),
    ('Carosello con programma singole giornate',                                                                             '2026-06-22', null),
    ('Post con info mappa',                                                                                                  '2026-06-23', null),
    -- Multi-giorno
    ('Stampa flyer?',                                                                                                        '2026-05-22', '2026-05-23'),
    ('Scrivere a ZH turismo!!!',                                                                                             '2026-06-19', '2026-06-21'),
    ('stories dietro le quinte',                                                                                             '2026-06-22', '2026-06-25'),
    ('1. stories foto eventi / 2. stories con programma giornaliero / 3. reel recap giornaliero',                            '2026-06-26', '2026-06-28')
  ) as v(titolo, data, data_fine)
  where not exists (
    select 1 from compiti c
    where c.evento_id = target_id
      and c.titolo = v.titolo
  );
end $$;
