-- Personale evento: campo libero "presenza" per indicare quando la persona
-- sarà presente (es. "Tutti i giorni", "Sabato 14:00-18:00", "Solo allestimento").

alter table evento_personale
  add column if not exists presenza text;
