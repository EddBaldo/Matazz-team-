-- Converte evento_artisti.costi_trasporto da text a numeric (CHF).
-- I valori non numerici (residui di "ingombro") vengono messi a null.
alter table evento_artisti
  alter column costi_trasporto type numeric
  using (
    case
      when costi_trasporto ~ '^[0-9]+(\.[0-9]+)?$' then costi_trasporto::numeric
      else null
    end
  );
alter table evento_artisti
  alter column costi_trasporto set default 0;

-- Aggiunge costi_trasporto (CHF) anche al personale.
alter table evento_personale
  add column if not exists costi_trasporto numeric default 0;
