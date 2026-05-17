-- Seed di esempio per la tabella di marcia dell'evento test.
-- Inserisce compiti realistici assegnati ai membri del team, distribuiti
-- nelle settimane precedenti, durante e dopo l'evento.
-- Idempotente: gira solo se l'evento test esiste e non ha ancora compiti.

do $$
declare
  target_id uuid;
  ev_count int;
  t_edu uuid; t_gio uuid; t_pie uuid; t_pino uuid; t_briz uuid;
  t_maru uuid; t_vane uuid; t_tommy uuid; t_manu uuid;
begin
  select count(*) into ev_count from eventi;
  if ev_count <> 1 then
    return;
  end if;
  select id into target_id from eventi limit 1;

  select id into t_edu  from team_matazz where nome = 'Edu';
  select id into t_gio  from team_matazz where nome = 'Gio';
  select id into t_pie  from team_matazz where nome = 'Pie';
  select id into t_pino from team_matazz where nome = 'Pino';
  select id into t_briz from team_matazz where nome = 'Briz';
  select id into t_maru from team_matazz where nome = 'Maru';
  select id into t_vane from team_matazz where nome = 'Vane';
  select id into t_tommy from team_matazz where nome = 'Tommy';
  select id into t_manu from team_matazz where nome = 'Manu';

  if exists (select 1 from compiti where evento_id = target_id) then
    return;
  end if;

  insert into compiti
    (evento_id, titolo,                              data,         data_fine, ora,    categoria,        assegnato_a_id, descrizione, fatto, creato_da_id)
  values
    -- Pre-evento (settimane prima)
    (target_id, 'Stampare locandine A3 e flyer',     '2026-06-15', null,      '14:00', 'Curatelazz',    t_gio,  'Tipografia Sole, 200 A3 + 500 flyer.',                              true,  t_edu),
    (target_id, 'Conferma definitiva contratti artisti', '2026-06-18', null,   '10:00', 'Amministrazz', t_edu,  'Inviare ultima versione e raccogliere firme.',                       false, t_edu),
    (target_id, 'Preparare borse welcome staff',     '2026-06-20', null,      null,    'Volto',         t_pie,  'Lanyard + maglietta + bottiglia + welcome kit.',                     false, t_edu),
    (target_id, 'Briefing tecnici audio',            '2026-06-22', null,      '11:00', 'Matazz Family', t_pino, 'Call con tecnici per piano scena e patch.',                          false, t_edu),
    (target_id, 'Conferma menu catering finale',     '2026-06-23', null,      null,    'Logistica',     t_maru, 'Numeri persone + intolleranze.',                                     false, t_edu),

    -- Vigilia (giorno prima)
    (target_id, 'Caricare furgone allestimento',     '2026-06-24', null,      '17:00', 'Logistica',     t_tommy,'Ritiro materiali magazzino + carico furgone.',                       false, t_edu),
    (target_id, 'Ritiro stampe e cartellonistica',   '2026-06-24', null,      '15:00', 'Logistica',     t_manu, 'Passare in tipografia, controllare prima del ritiro.',               false, t_edu),

    -- Primo giorno (giovedì 25 — cena artisti)
    (target_id, 'Allestimento palco e quinte',       '2026-06-25', null,      '09:00', 'Logistica',     t_briz, 'Squadra di 4 persone, ~5h.',                                          false, t_edu),
    (target_id, 'Installazione luci e soundcheck',   '2026-06-25', null,      '14:00', 'Logistica',     t_vane, 'Linecheck + soundcheck con prima band.',                              false, t_edu),
    (target_id, 'Briefing staff completo',           '2026-06-25', null,      '17:30', 'Matazz Family', t_pino, 'Tutto lo staff, divisione turni e radio.',                            false, t_edu),
    (target_id, 'Accoglienza artisti per cena',      '2026-06-25', null,      '18:30', 'Curatelazz',    t_edu,  'Ritrovo cena artisti + welcome.',                                     false, t_edu),

    -- Vernissage (venerdì 26)
    (target_id, 'Apertura cassa bar e cambio fondi', '2026-06-26', null,      '13:30', 'Logistica',     t_maru, 'Cambio + fondo cassa 500 CHF.',                                       false, t_edu),
    (target_id, 'Vernissage e welcome ospiti',       '2026-06-26', null,      '14:00', 'Curatelazz',    t_gio,  'Apertura ufficiale mostra.',                                          false, t_edu),
    (target_id, 'Foto e video evento',               '2026-06-26', '2026-06-28', null, 'Volto',         t_pie,  'Copertura ai 3 giorni, attenzione a vernissage.',                     false, t_edu),

    -- Sabato 27
    (target_id, 'Check sicurezza accessi',           '2026-06-27', null,      '12:00', 'Logistica',     t_edu,  'Recinzioni, estintori, uscite.',                                      false, t_edu),
    (target_id, 'Coordinamento performance sera',    '2026-06-27', null,      '20:00', 'Curatelazz',    t_gio,  'Tempi e cambi palco performance musicali.',                           false, t_edu),

    -- Ultimo giorno (domenica 28)
    (target_id, 'Chiusura mostra e ringraziamenti',  '2026-06-28', null,      '17:30', 'Curatelazz',    t_gio,  'Saluti finali pubblico e artisti.',                                   false, t_edu),
    (target_id, 'Smontaggio palco e impianto',       '2026-06-28', null,      '18:00', 'Logistica',     t_briz, 'Squadra completa, ~3h.',                                              false, t_edu),
    (target_id, 'Smontaggio luci',                   '2026-06-28', null,      '18:00', 'Logistica',     t_vane, null,                                                                  false, t_edu),

    -- Post-evento
    (target_id, 'Resi magazzino e inventario',       '2026-06-29', null,      '09:00', 'Amministrazz',  t_edu,  'Verifica ammanchi/rotture, inventario aggiornato.',                   false, t_edu),
    (target_id, 'Fatturazione sponsor confermati',   '2026-07-02', null,      null,    'Amministrazz',  t_edu,  'Emissione fatture entro 7 giorni dall''evento.',                      false, t_edu);

end $$;
