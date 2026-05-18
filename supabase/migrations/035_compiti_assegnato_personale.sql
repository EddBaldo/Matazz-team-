-- Aggiunge la possibilità di assegnare un compito a una persona esterna
-- (personale_esterno) oltre che a un membro del team Matazz.
-- I due campi sono mutuamente esclusivi: al massimo uno dei due è popolato.

alter table compiti
  add column if not exists assegnato_personale_id uuid
    references personale_esterno(id) on delete set null;

create index if not exists compiti_assegnato_personale_idx
  on compiti (assegnato_personale_id);
