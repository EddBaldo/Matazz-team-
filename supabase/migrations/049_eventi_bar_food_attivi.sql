-- Flag globali per attivare/disattivare la sezione Bar e Food Truck nel budget.
-- Default true: tutto attivo, comportamento invariato per gli eventi esistenti.

alter table eventi
  add column if not exists bar_attivo boolean not null default true;

alter table eventi
  add column if not exists food_truck_attivo boolean not null default true;
