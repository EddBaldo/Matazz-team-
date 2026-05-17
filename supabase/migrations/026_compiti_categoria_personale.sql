-- Aggiunge "Personale" alle categorie dei compiti, per impegni che riguardano
-- collaboratori esterni (fotografi, tecnici, bar) non parte del team Matazz.

alter table compiti
  drop constraint if exists compiti_categoria_check;

alter table compiti
  add constraint compiti_categoria_check
  check (categoria in (
    'Curatelazz', 'Volto', 'Logistica', 'Matazz Family', 'Amministrazz', 'Personale'
  ));
