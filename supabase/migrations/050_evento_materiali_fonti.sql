-- Aggiunge supporto per piu' fonti (label + url) per ogni materiale.
-- Migra il vecchio campo testuale dove_lo_prendiamo come prima fonte.

alter table evento_materiali
  add column if not exists fonti jsonb not null default '[]'::jsonb;

update evento_materiali
set fonti = jsonb_build_array(
  case
    when dove_lo_prendiamo ~* '^https?://'
      then jsonb_build_object('label', null, 'url', dove_lo_prendiamo)
    else jsonb_build_object('label', dove_lo_prendiamo, 'url', null)
  end
)
where dove_lo_prendiamo is not null
  and length(trim(dove_lo_prendiamo)) > 0
  and (fonti is null or fonti = '[]'::jsonb);
