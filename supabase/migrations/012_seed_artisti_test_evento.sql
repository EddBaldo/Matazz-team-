-- Seed di 20 artisti collegati a "il" tuo evento di test.
-- Idempotente: upsert su (nome, cognome) per artisti, on conflict do nothing
-- su (evento_id, artista_id) per evento_artisti.
-- Funziona solo se hai esattamente 1 evento. Se ne hai più, lo script fallisce
-- con messaggio chiaro — in quel caso modifica la SELECT iniziale (target_id).

do $$
declare
  target_id uuid;
  ev_count int;
  t_edu uuid;
  t_pie uuid;
  t_gio uuid;
  t_manu uuid;
  art_id uuid;
begin
  select count(*) into ev_count from eventi;
  if ev_count = 0 then
    raise exception 'Nessun evento trovato. Crea prima un evento.';
  end if;
  if ev_count > 1 then
    raise exception 'Trovati % eventi. Specifica quale modificando lo script.', ev_count;
  end if;
  select id into target_id from eventi limit 1;

  select id into t_edu from team_matazz where nome = 'Edu';
  select id into t_pie from team_matazz where nome = 'Pie';
  select id into t_gio from team_matazz where nome = 'Gio';
  select id into t_manu from team_matazz where nome = 'Manu';

  -- 1. Xenia Landolf
  insert into artisti (nome, cognome, tipo_arte, residenza, link, creato_da_id)
  values ('Xenia', 'Landolf', 'Installazione', 'Zurigo, Svizzera', 'https://www.instagram.com/xeldaliv', t_edu)
  on conflict (nome, cognome) do update set
    tipo_arte = excluded.tipo_arte, residenza = excluded.residenza, link = excluded.link
  returning id into art_id;
  insert into evento_artisti (evento_id, artista_id, chi_contatto_id, doc_mandati, doc_info_artisti, necessita_alloggio, ingombro, commenti, creato_da_id)
  values (target_id, art_id, t_edu, 'Sì', true, false, 'un Arco', 'Vorrebbe l''arco vicino al Dark side', t_edu)
  on conflict (evento_id, artista_id) do nothing;

  -- 2. Noël Hochuli
  insert into artisti (nome, cognome, tipo_arte, residenza, link, creato_da_id)
  values ('Noël', 'Hochuli', 'Installazione', 'Zurigo, Svizzera', 'https://www.instagram.com/noelhochul', t_edu)
  on conflict (nome, cognome) do update set
    tipo_arte = excluded.tipo_arte, residenza = excluded.residenza, link = excluded.link
  returning id into art_id;
  insert into evento_artisti (evento_id, artista_id, chi_contatto_id, doc_mandati, doc_info_artisti, necessita_alloggio, creato_da_id)
  values (target_id, art_id, t_edu, 'Sì', true, false, t_edu)
  on conflict (evento_id, artista_id) do nothing;

  -- 3. Elio Mueller
  insert into artisti (nome, cognome, tipo_arte, residenza, link, creato_da_id)
  values ('Elio', 'Mueller', 'Installazione', 'Zurigo, Svizzera', 'https://www.instagram.com/333lio_mu3ll3r/', t_edu)
  on conflict (nome, cognome) do update set
    tipo_arte = excluded.tipo_arte, residenza = excluded.residenza, link = excluded.link
  returning id into art_id;
  insert into evento_artisti (evento_id, artista_id, chi_contatto_id, doc_mandati, necessita_alloggio, creato_da_id)
  values (target_id, art_id, t_edu, 'Sì', false, t_edu)
  on conflict (evento_id, artista_id) do nothing;

  -- 4. Oliver Kümmerli
  insert into artisti (nome, cognome, tipo_arte, residenza, link, creato_da_id)
  values ('Oliver', 'Kümmerli', 'Installazione', 'Zurigo, Svizzera', 'https://oliver-kuemmerli.kleio.com', t_edu)
  on conflict (nome, cognome) do update set
    tipo_arte = excluded.tipo_arte, residenza = excluded.residenza, link = excluded.link
  returning id into art_id;
  insert into evento_artisti (evento_id, artista_id, chi_contatto_id, doc_mandati, necessita_alloggio, creato_da_id)
  values (target_id, art_id, t_edu, 'Sì', false, t_edu)
  on conflict (evento_id, artista_id) do nothing;

  -- 5. Eugenio Thiella
  insert into artisti (nome, cognome, tipo_arte, residenza, link, creato_da_id)
  values ('Eugenio', 'Thiella', 'Installazione', 'Zurigo, Svizzera', 'https://www.instagram.com/eugenio.thiella/', t_pie)
  on conflict (nome, cognome) do update set
    tipo_arte = excluded.tipo_arte, residenza = excluded.residenza, link = excluded.link
  returning id into art_id;
  insert into evento_artisti (evento_id, artista_id, chi_contatto_id, doc_mandati, necessita_alloggio, creato_da_id)
  values (target_id, art_id, t_pie, 'Sì', false, t_edu)
  on conflict (evento_id, artista_id) do nothing;

  -- 6. Noah Ismael Wyss
  insert into artisti (nome, cognome, tipo_arte, residenza, link, creato_da_id)
  values ('Noah Ismael', 'Wyss', 'Installazione', 'Basel, Svizzera', 'https://www.instagram.com/p/CuRMTrhNWSG/', t_edu)
  on conflict (nome, cognome) do update set
    tipo_arte = excluded.tipo_arte, residenza = excluded.residenza, link = excluded.link
  returning id into art_id;
  insert into evento_artisti (evento_id, artista_id, chi_contatto_id, doc_mandati, necessita_alloggio, creato_da_id)
  values (target_id, art_id, t_edu, 'Non ancora', false, t_edu)
  on conflict (evento_id, artista_id) do nothing;

  -- 7. Acqua Forte (cognome vuoto)
  insert into artisti (nome, cognome, tipo_arte, residenza, creato_da_id)
  values ('Acqua Forte', '', 'Installazione', 'Milano, Italia', t_pie)
  on conflict (nome, cognome) do update set
    tipo_arte = excluded.tipo_arte, residenza = excluded.residenza
  returning id into art_id;
  insert into evento_artisti (evento_id, artista_id, chi_contatto_id, doc_mandati, necessita_alloggio, creato_da_id)
  values (target_id, art_id, t_pie, 'Non ancora', true, t_edu)
  on conflict (evento_id, artista_id) do nothing;

  -- 8. Davide (cognome vuoto)
  insert into artisti (nome, cognome, tipo_arte, creato_da_id)
  values ('Davide', '', 'Installazione', t_gio)
  on conflict (nome, cognome) do update set tipo_arte = excluded.tipo_arte
  returning id into art_id;
  insert into evento_artisti (evento_id, artista_id, chi_contatto_id, doc_mandati, necessita_alloggio, creato_da_id)
  values (target_id, art_id, t_gio, 'Non ancora', false, t_edu)
  on conflict (evento_id, artista_id) do nothing;

  -- 9. Valentina Bubola
  insert into artisti (nome, cognome, tipo_arte, residenza, link, creato_da_id)
  values ('Valentina', 'Bubola', 'Installazione-Sonora', 'Zurigo, Svizzera', 'https://www.instagram.com/reel/DS2tJUEDGNC/', t_edu)
  on conflict (nome, cognome) do update set
    tipo_arte = excluded.tipo_arte, residenza = excluded.residenza, link = excluded.link
  returning id into art_id;
  insert into evento_artisti (evento_id, artista_id, chi_contatto_id, doc_mandati, necessita_alloggio, intolleranze_cibo, creato_da_id)
  values (target_id, art_id, t_edu, 'Sì', false, 'Ceci, Titrí, Vegetariana', t_edu)
  on conflict (evento_id, artista_id) do nothing;

  -- 10. Gian Kaegi
  insert into artisti (nome, cognome, tipo_arte, residenza, link, creato_da_id)
  values ('Gian', 'Kaegi', 'Installazione-Performance', 'Zurigo, Svizzera', 'https://giankaegi.com/', t_edu)
  on conflict (nome, cognome) do update set
    tipo_arte = excluded.tipo_arte, residenza = excluded.residenza, link = excluded.link
  returning id into art_id;
  insert into evento_artisti (evento_id, artista_id, chi_contatto_id, doc_mandati, necessita_alloggio, creato_da_id)
  values (target_id, art_id, t_edu, 'Sì', false, t_edu)
  on conflict (evento_id, artista_id) do nothing;

  -- 11. Carlotta Donadeo
  insert into artisti (nome, cognome, tipo_arte, link, creato_da_id)
  values ('Carlotta', 'Donadeo', 'Installazione-Performance', 'https://www.instagram.com/acquaforte.xyz/', t_manu)
  on conflict (nome, cognome) do update set
    tipo_arte = excluded.tipo_arte, link = excluded.link
  returning id into art_id;
  insert into evento_artisti (evento_id, artista_id, chi_contatto_id, doc_mandati, necessita_alloggio, creato_da_id)
  values (target_id, art_id, t_manu, 'Sì', true, t_edu)
  on conflict (evento_id, artista_id) do nothing;

  -- 12. Irene Tabanelli
  insert into artisti (nome, cognome, tipo_arte, residenza, link, creato_da_id)
  values ('Irene', 'Tabanelli', 'Installazione-Performance', 'Italia', 'https://www.instagram.com/irene.tabanelli/', t_pie)
  on conflict (nome, cognome) do update set
    tipo_arte = excluded.tipo_arte, residenza = excluded.residenza, link = excluded.link
  returning id into art_id;
  insert into evento_artisti (evento_id, artista_id, chi_contatto_id, doc_mandati, necessita_alloggio, creato_da_id)
  values (target_id, art_id, t_pie, 'Sì', false, t_edu)
  on conflict (evento_id, artista_id) do nothing;

  -- 13. Thomas Imbach
  insert into artisti (nome, cognome, tipo_arte, residenza, link, creato_da_id)
  values ('Thomas', 'Imbach', 'Video', 'Zurigo, Svizzera', 'https://www.nemesis-film.ch', t_edu)
  on conflict (nome, cognome) do update set
    tipo_arte = excluded.tipo_arte, residenza = excluded.residenza, link = excluded.link
  returning id into art_id;
  insert into evento_artisti (evento_id, artista_id, chi_contatto_id, doc_mandati, necessita_alloggio, creato_da_id)
  values (target_id, art_id, t_edu, 'Non ancora', false, t_edu)
  on conflict (evento_id, artista_id) do nothing;

  -- 14. Julián RL
  insert into artisti (nome, cognome, tipo_arte, residenza, link, creato_da_id)
  values ('Julián', 'RL', 'Video', 'Colombia', 'https://www.instagram.com/julianrlphoto/reels/', t_manu)
  on conflict (nome, cognome) do update set
    tipo_arte = excluded.tipo_arte, residenza = excluded.residenza, link = excluded.link
  returning id into art_id;
  insert into evento_artisti (evento_id, artista_id, chi_contatto_id, doc_mandati, necessita_alloggio, creato_da_id)
  values (target_id, art_id, t_manu, 'Sì', false, t_edu)
  on conflict (evento_id, artista_id) do nothing;

  -- 15. Ex-anima (cognome vuoto)
  insert into artisti (nome, cognome, tipo_arte, residenza, creato_da_id)
  values ('Ex-anima', '', 'Video', 'Lugano, Svizzera', t_pie)
  on conflict (nome, cognome) do update set
    tipo_arte = excluded.tipo_arte, residenza = excluded.residenza
  returning id into art_id;
  insert into evento_artisti (evento_id, artista_id, chi_contatto_id, doc_mandati, necessita_alloggio, creato_da_id)
  values (target_id, art_id, t_pie, 'Non ancora', true, t_edu)
  on conflict (evento_id, artista_id) do nothing;

  -- 16. Manning Dong
  insert into artisti (nome, cognome, tipo_arte, residenza, link, creato_da_id)
  values ('Manning', 'Dong', 'Danza', 'Zurigo, Svizzera', 'https://www.tanzwerk101.ch/de/lehrperson/manning-dong', t_edu)
  on conflict (nome, cognome) do update set
    tipo_arte = excluded.tipo_arte, residenza = excluded.residenza, link = excluded.link
  returning id into art_id;
  insert into evento_artisti (evento_id, artista_id, chi_contatto_id, doc_mandati, necessita_alloggio, commenti, creato_da_id)
  values (target_id, art_id, t_edu, 'Non ancora', false, 'Valutare Budget Prima', t_edu)
  on conflict (evento_id, artista_id) do nothing;

  -- 17. Linxi Chen
  insert into artisti (nome, cognome, tipo_arte, residenza, link, creato_da_id)
  values ('Linxi', 'Chen', 'Performance Musica', 'Zurigo, Svizzera', 'https://ioic.ch/zh/artist/982', t_edu)
  on conflict (nome, cognome) do update set
    tipo_arte = excluded.tipo_arte, residenza = excluded.residenza, link = excluded.link
  returning id into art_id;
  insert into evento_artisti (evento_id, artista_id, chi_contatto_id, doc_mandati, necessita_alloggio, commenti, creato_da_id)
  values (target_id, art_id, t_edu, 'Non ancora', false, 'Valutare Budget Prima', t_edu)
  on conflict (evento_id, artista_id) do nothing;

  -- 18. Iokoi (cognome vuoto)
  insert into artisti (nome, cognome, tipo_arte, residenza, link, creato_da_id)
  values ('Iokoi', '', 'Performance Musica', 'Zurigo, Svizzera', 'https://iokoi.net/', t_edu)
  on conflict (nome, cognome) do update set
    tipo_arte = excluded.tipo_arte, residenza = excluded.residenza, link = excluded.link
  returning id into art_id;
  insert into evento_artisti (evento_id, artista_id, chi_contatto_id, doc_mandati, necessita_alloggio, creato_da_id)
  values (target_id, art_id, t_edu, 'Non ancora', false, t_edu)
  on conflict (evento_id, artista_id) do nothing;

  -- 19. Dana (cognome vuoto)
  insert into artisti (nome, cognome, tipo_arte, residenza, creato_da_id)
  values ('Dana', '', 'Performance Musica', 'Zurigo, Svizzera', t_edu)
  on conflict (nome, cognome) do update set
    tipo_arte = excluded.tipo_arte, residenza = excluded.residenza
  returning id into art_id;
  insert into evento_artisti (evento_id, artista_id, chi_contatto_id, doc_mandati, necessita_alloggio, creato_da_id)
  values (target_id, art_id, t_edu, 'Non ancora', false, t_edu)
  on conflict (evento_id, artista_id) do nothing;

  -- 20. Yeelen (cognome vuoto)
  insert into artisti (nome, cognome, tipo_arte, residenza, creato_da_id)
  values ('Yeelen', '', 'Musica Sera', 'Lugano, Svizzera', t_pie)
  on conflict (nome, cognome) do update set
    tipo_arte = excluded.tipo_arte, residenza = excluded.residenza
  returning id into art_id;
  insert into evento_artisti (evento_id, artista_id, chi_contatto_id, doc_mandati, necessita_alloggio, creato_da_id)
  values (target_id, art_id, t_pie, 'Non ancora', false, t_edu)
  on conflict (evento_id, artista_id) do nothing;
end $$;
