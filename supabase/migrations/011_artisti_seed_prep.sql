-- Preparazione per seed massivo di artisti:
-- - ingombro_mq (numeric) → ingombro (text) per testo libero ("un arco", "10x5 m", ecc)
-- - dedupe artisti + unique (nome, cognome)
-- - dedupe evento_artisti + unique (evento_id, artista_id)

alter table evento_artisti rename column ingombro_mq to ingombro;
alter table evento_artisti
  alter column ingombro type text using ingombro::text;
update evento_artisti
  set ingombro = null
  where ingombro = '0' or ingombro = '0.0' or trim(ingombro) = '';

-- Dedupe artisti (per i raris casi di duplicati storici)
delete from artisti
where id not in (
  select min(id::text)::uuid from artisti group by nome, cognome
);

alter table artisti
  add constraint artisti_nome_cognome_unique unique (nome, cognome);

-- Dedupe evento_artisti
delete from evento_artisti
where id not in (
  select min(id::text)::uuid from evento_artisti
  group by evento_id, artista_id
);

alter table evento_artisti
  add constraint evento_artisti_unique unique (evento_id, artista_id);
