-- Rubrica sponsor (globale) + evento_sponsor (sponsor associati a evento).
-- Solo gli evento_sponsor con stato 'Confermato' entrano nelle Entrate del Budget.
-- Pre-popolata con i 30 sponsor della lista Matazz iniziale.

create table if not exists sponsor (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null check (tipo in (
    'Fondazione', 'Banca', 'Food & Beverage', 'Privato', 'Altro'
  )),
  contatto text,
  indirizzo text,
  telefono text,
  sito_web text,
  note text,
  creato_da_id uuid references team_matazz(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists evento_sponsor (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventi(id) on delete cascade,
  sponsor_id uuid not null references sponsor(id) on delete restrict,
  chi_contatto_id uuid references team_matazz(id) on delete set null,
  stato text not null default 'Da contattare' check (stato in (
    'Da contattare', 'Contattato', 'Confermato', 'Rifiutato'
  )),
  importo numeric not null default 0,
  data_contatto date,
  note text,
  creato_da_id uuid references team_matazz(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table sponsor enable row level security;
alter table evento_sponsor enable row level security;

insert into sponsor (nome, tipo, indirizzo, telefono, sito_web) values
  ('Pro Helvetia', 'Fondazione', 'Zürich', '044 267 71 71', 'https://prohelvetia.ch/it/trovare-sostegno/manifestazione-che-coniuga-diverse-discipline-artistiche-2/'),
  ('Ernst Göhner Stiftung', 'Fondazione', 'Zug', '041 729 66 33', 'https://www.ernst-goehner-stiftung.ch'),
  ('Landis & Gyr Stiftung', 'Fondazione', 'Zug', '041 725 23 50', 'https://www.lg-stiftung.ch'),
  ('Schweizerische Interpreten Stiftung', 'Fondazione', 'Zürich', '043 322 10 61', 'https://www.interpretenstiftung.ch'),
  ('Stanley Thomas Johnson Stiftung', 'Fondazione', 'Berna', '031 372 25 95', 'https://www.johnsonstiftung.ch'),
  ('Oertli Stiftung', 'Fondazione', 'Zürich', null, 'https://www.oertlistiftung.ch'),
  ('Fondazione Teatro dell''Architettura', 'Fondazione', 'Mendrisio', null, 'https://fondazionetam.ch'),
  ('Stadt Zürich Kultur', 'Altro', 'Zürich', null, 'https://www.stadt-zuerich.ch/de.html?cid=redirect-portal.html'),
  ('GUESS EUROPE', 'Altro', 'Bioggio', '091 809 50 00', 'https://www.guess.com'),
  ('Banca Popolare di Sondrio', 'Banca', 'Lugano', null, 'https://www.bps-suisse.ch'),
  ('Banca Migros SA', 'Banca', 'Zürich', null, 'https://www.migrosbank.ch'),
  ('Cornèr Banca SA Lugano', 'Banca', null, null, 'https://www.corner.ch'),
  ('Ticinowine', 'Food & Beverage', 'Morbio Inferiore', '091 690 13 53', 'mailto:info@ticinowine.ch'),
  ('Coop cultura', 'Food & Beverage', null, null, 'https://sponsoring.coop.ch/it'),
  ('Fondation ARPE', 'Fondazione', 'Zürich', null, 'http://www.fondationarpe.com/en/contact/'),
  ('Karitative Stiftung Dr. Gerber-ten Bosch', 'Fondazione', 'Zürich', null, null),
  ('René Lanz Stiftung', 'Fondazione', 'Zürich', null, null),
  ('Stiftung Bredroli', 'Fondazione', 'Zürich', null, null),
  ('Walter B. Kielholz Foundation', 'Fondazione', 'Zürich', null, null),
  ('Paul Schiller Stiftung', 'Fondazione', 'Zürich', null, 'https://paul-schiller-stiftung.ch'),
  ('Sophie und Karl Binding Stiftung', 'Fondazione', 'Zürich', null, 'https://www.binding-stiftung.ch'),
  ('Fondazione Dr M. O. Winterhalter', 'Fondazione', 'Zürich', null, null),
  ('Alba Stiftung', 'Fondazione', 'Zürich', null, 'https://albastiftung.ch'),
  ('Dek Dubach Keller Stiftung', 'Fondazione', 'Zürich', null, 'https://www.annekeller.art'),
  ('Elisabeth Weber Stiftung', 'Fondazione', 'Zürich', null, 'https://elisabethweberstiftung.ch'),
  ('Lah Art Foundation', 'Fondazione', null, null, 'https://fundacijalah.com'),
  ('Max Kohler Stiftung', 'Fondazione', null, null, 'https://www.maxkohler-stiftung.ch'),
  ('Prof Otto Beisheim Stiftung', 'Fondazione', null, null, 'https://www.beisheim-stiftung.com/ch/de'),
  ('The Marc Rich Foundation for Education Culture and Welfare', 'Fondazione', null, null, null),
  ('Finestra da Pepe', 'Food & Beverage', null, null, null),
  ('Architetto Rojer', 'Privato', null, null, null)
on conflict do nothing;
