-- Food truck: due modelli di business.
-- "Percentuale" (default, esistente): loro vendono, noi prendiamo % sull'incasso.
-- "Acquisto": noi compriamo a un prezzo base e rivendiamo (margine per unità).

alter table evento_food_truck
  add column if not exists modello text not null default 'Percentuale';

alter table evento_food_truck
  add column if not exists costo_unitario numeric;

alter table evento_food_truck
  add column if not exists prezzo_vendita numeric;

alter table evento_food_truck
  add column if not exists quantita_stimata numeric;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'evento_food_truck_modello_check'
  ) then
    alter table evento_food_truck
      add constraint evento_food_truck_modello_check
      check (modello in ('Percentuale', 'Acquisto'));
  end if;
end $$;
