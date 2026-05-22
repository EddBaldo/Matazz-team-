-- Matazz Staff — schema iniziale del database
-- Eseguire una volta nel SQL Editor di Supabase.
--
-- Sicurezza:
-- - RLS abilitata senza policy su tutte le tabelle.
-- - L'anon/publishable key (esposta al browser) non può quindi leggere o scrivere nulla.
-- - L'app Next.js accede al DB solo lato server con la service_role/secret key, che bypassa RLS.
-- - Il campo creato_da_id viene popolato server-side leggendo il cookie user_identity_id
--   (vedi helper getCurrentIdentity() in src/lib/auth/identity.ts).

create extension if not exists pgcrypto;

-- =====================================================
-- Tabelle globali
-- =====================================================

create table if not exists team_matazz (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique
);

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  citta text not null,
  indirizzo text,
  capienza integer,
  contatti_referente text,
  costo_tipico numeric,
  link text,
  note text,
  creato_da_id uuid references team_matazz(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists artisti (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cognome text not null,
  tipo_arte text not null check (tipo_arte in (
    'Installazione',
    'Installazione-Sonora',
    'Installazione-Performance',
    'Video',
    'Danza',
    'Performance Musica',
    'Musica Sera',
    'Quadri',
    'DJ',
    'Live Music'
  )),
  link text,
  link_opera text,
  residenza text,
  creato_da_id uuid references team_matazz(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists personale_esterno (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cognome text not null,
  ruolo_principale text not null,
  categoria text check (categoria in (
    'Fotografi/Videomaker',
    'Bar',
    'Tecnici audio',
    'Allestimento',
    'Altro'
  )),
  contatti text,
  tariffa_tipica numeric,
  note text,
  creato_da_id uuid references team_matazz(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists inventario (
  id uuid primary key default gen_random_uuid(),
  articolo text not null,
  quantita integer not null default 1,
  dove_si_trova text,
  condizione text not null check (condizione in (
    'Ottimo', 'Buono', 'Da riparare', 'Da buttare'
  )),
  note text,
  creato_da_id uuid references team_matazz(id) on delete set null,
  created_at timestamptz not null default now()
);

-- =====================================================
-- Tabelle dell'evento
-- =====================================================

create table if not exists eventi (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  data_inizio date not null,
  data_fine date,
  location_id uuid references locations(id) on delete set null,
  stato text not null check (stato in (
    'In pianificazione', 'Concluso'
  )),
  descrizione text,
  creato_da_id uuid references team_matazz(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists evento_programma (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventi(id) on delete cascade,
  data date not null,
  ora_inizio time,
  ora_fine time,
  titolo text not null,
  descrizione text,
  artista_id uuid references artisti(id) on delete set null,
  creato_da_id uuid references team_matazz(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists artisti_eventi_interesse (
  id uuid primary key default gen_random_uuid(),
  artista_id uuid not null references artisti(id) on delete cascade,
  evento_id uuid not null references eventi(id) on delete cascade,
  creato_da_id uuid references team_matazz(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (artista_id, evento_id)
);

create table if not exists evento_artisti (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventi(id) on delete cascade,
  artista_id uuid not null references artisti(id) on delete restrict,
  chi_contatto_id uuid references team_matazz(id) on delete set null,
  doc_mandati text not null default 'Non ancora' check (doc_mandati in ('Sì', 'Non ancora')),
  doc_info_artisti boolean not null default false,
  doc_proposal boolean not null default false,
  necessita_alloggio boolean not null default false,
  info_alloggio text,
  ingombro_mq numeric,
  costi_produzione numeric not null default 0,
  artist_fee numeric not null default 0,
  intolleranze_cibo text,
  commenti text,
  confermato boolean not null default false,
  presente_cena boolean not null default false,
  creato_da_id uuid references team_matazz(id) on delete set null
);

create table if not exists evento_personale (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventi(id) on delete cascade,
  personale_id uuid not null references personale_esterno(id) on delete restrict,
  ruolo_specifico text,
  compenso numeric not null default 0,
  note text,
  intolleranze_cibo text,
  presente_cena boolean not null default false,
  creato_da_id uuid references team_matazz(id) on delete set null
);

create table if not exists evento_cena_ospiti (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventi(id) on delete cascade,
  nome text not null,
  intolleranze_cibo text,
  creato_da_id uuid references team_matazz(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists compiti (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid references eventi(id) on delete cascade,
  titolo text not null,
  data date not null,
  data_fine date,
  ora time,
  categoria text check (categoria in (
    'Curatelazz', 'Volto', 'Logistica', 'Matazz Family', 'Amministrazz'
  )),
  assegnato_a_id uuid references team_matazz(id) on delete set null,
  descrizione text,
  fatto boolean not null default false,
  creato_da_id uuid references team_matazz(id) on delete set null
);

create table if not exists evento_materiali (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventi(id) on delete cascade,
  articolo text not null,
  quantita integer not null default 1,
  prezzo_unitario numeric not null default 0,
  gia_disponibile boolean not null default false,
  inventario_id uuid references inventario(id) on delete set null,
  a_cosa_serve text,
  dove_lo_prendiamo text,
  preso boolean not null default false,
  note text,
  creato_da_id uuid references team_matazz(id) on delete set null
);

create table if not exists evento_budget_extra (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventi(id) on delete cascade,
  voce text not null,
  importo numeric not null,
  tipo text not null check (tipo in ('Entrata', 'Uscita')),
  categoria text,
  note text,
  creato_da_id uuid references team_matazz(id) on delete set null
);

create table if not exists evento_bar_articoli (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventi(id) on delete cascade,
  articolo text not null,
  costo_unitario numeric not null default 0,
  prezzo_vendita numeric not null default 0,
  quantita_stimata integer not null default 0,
  note text,
  creato_da_id uuid references team_matazz(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists evento_catering (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventi(id) on delete cascade,
  nome_fornitore text not null,
  descrizione text,
  prezzo_per_persona numeric not null default 0,
  numero_persone integer not null default 0,
  selezionata boolean not null default false,
  note text,
  creato_da_id uuid references team_matazz(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists evento_food_truck (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventi(id) on delete cascade,
  nome text not null,
  incasso_lordo_stimato numeric not null default 0,
  percentuale_matazz numeric not null default 0,
  selezionata boolean not null default false,
  note text,
  creato_da_id uuid references team_matazz(id) on delete set null,
  created_at timestamptz not null default now()
);

-- =====================================================
-- RLS: abilitata senza policy su tutte le tabelle
-- =====================================================

alter table team_matazz enable row level security;
alter table locations enable row level security;
alter table artisti enable row level security;
alter table personale_esterno enable row level security;
alter table inventario enable row level security;
alter table eventi enable row level security;
alter table evento_artisti enable row level security;
alter table artisti_eventi_interesse enable row level security;
alter table evento_bar_articoli enable row level security;
alter table evento_catering enable row level security;
alter table evento_food_truck enable row level security;
alter table evento_personale enable row level security;
alter table compiti enable row level security;
alter table evento_materiali enable row level security;
alter table evento_budget_extra enable row level security;
alter table evento_programma enable row level security;
alter table evento_cena_ospiti enable row level security;

-- =====================================================
-- Pre-populate: 9 membri del team Matazz
-- =====================================================

insert into team_matazz (nome) values
  ('Edu'),
  ('Gio'),
  ('Pie'),
  ('Pino'),
  ('Briz'),
  ('Maru'),
  ('Vane'),
  ('Tommy'),
  ('Manu')
on conflict (nome) do nothing;
