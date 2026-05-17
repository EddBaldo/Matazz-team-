-- Rimuovi duplicati sponsor (mantieni il primo creato per ogni nome) e
-- aggiungi un UNIQUE constraint sul nome così non si possono più creare
-- doppioni (né a mano né rilanciando la migration di seed).

with primi as (
  select distinct on (nome) id
  from sponsor
  order by nome, created_at asc
)
delete from sponsor where id not in (select id from primi);

alter table sponsor
  add constraint sponsor_nome_unique unique (nome);
