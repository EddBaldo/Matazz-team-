-- Compiti: ora_fine opzionale, per appuntamenti dalle ore alle ore
-- (es. "Briefing staff 17:30 – 18:30", utile per gestire i turni del personale).

alter table compiti
  add column if not exists ora_fine time;
