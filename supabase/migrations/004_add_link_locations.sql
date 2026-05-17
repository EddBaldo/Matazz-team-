-- Aggiunge la colonna link (URL del posto) a locations.

alter table locations
  add column if not exists link text;
