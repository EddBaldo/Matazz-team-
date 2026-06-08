-- Aggiunge categoria agli articoli dell'inventario.
-- Default 'Altro' per gli articoli esistenti e per qualsiasi insert legacy che non specifica la colonna.

alter table inventario
  add column if not exists categoria text not null default 'Altro';
