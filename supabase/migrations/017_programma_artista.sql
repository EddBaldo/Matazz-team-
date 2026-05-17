-- Voci di programma possono opzionalmente essere collegate a un artista del cast.
-- Esempio: "21:30 — Live set" può puntare all'artista "Yeelen".
-- Se l'artista viene rimosso dall'anagrafica, lascio la voce ma scollego (set null).

alter table evento_programma
  add column artista_id uuid references artisti(id) on delete set null;
