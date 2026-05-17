-- Bar: distinzione tra articoli acquistati da noi e articoli forniti da terzi.
-- fonte = 'Noi' (default) o 'Fornitore'. fornitore = nome libero (solo se 'Fornitore').

alter table evento_bar_articoli
  add column if not exists fonte text not null default 'Noi';

alter table evento_bar_articoli
  add column if not exists fornitore text;

-- Vincolo: fonte deve essere uno dei due valori previsti
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'evento_bar_articoli_fonte_check'
  ) then
    alter table evento_bar_articoli
      add constraint evento_bar_articoli_fonte_check
      check (fonte in ('Noi', 'Fornitore'));
  end if;
end $$;
