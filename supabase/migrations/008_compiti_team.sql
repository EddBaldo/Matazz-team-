-- Trasforma evento_compiti in "compiti" generico (con evento_id nullable per
-- supportare meeting di team non legati a evento). Aggiorna le categorie alle
-- 5 squadre Matazz: Curatelazz, Volto, Logistica, Matazz Family, Amministrazz.

alter table evento_compiti
  drop constraint if exists evento_compiti_categoria_check;

update evento_compiti
set categoria = case
  when categoria = 'Comunicazione' then 'Volto'
  when categoria = 'Organizzazione generale' then 'Amministrazz'
  when categoria = 'Settimana evento' then 'Curatelazz'
  when categoria = 'Allestimento' then 'Curatelazz'
  when categoria = 'Logistica' then 'Logistica'
  else categoria
end
where categoria in (
  'Comunicazione',
  'Organizzazione generale',
  'Settimana evento',
  'Allestimento'
);

alter table evento_compiti rename to compiti;
alter table compiti alter column evento_id drop not null;

alter table compiti
  add constraint compiti_categoria_check
  check (categoria in (
    'Curatelazz', 'Volto', 'Logistica', 'Matazz Family', 'Amministrazz'
  ));
