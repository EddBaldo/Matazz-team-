-- Artisti collettivi / duo: un singolo "artista" può rappresentare più persone.
-- - membri_extra: testo libero per elencare gli altri nomi (es. "Andrea Sassi")
-- - numero_persone: quanti sono in totale (drive il conteggio degli ospiti cena).
-- Default 1 così gli artisti già esistenti restano "uno".

alter table artisti
  add column if not exists membri_extra text;

alter table artisti
  add column if not exists numero_persone integer not null default 1
  check (numero_persone >= 1);
