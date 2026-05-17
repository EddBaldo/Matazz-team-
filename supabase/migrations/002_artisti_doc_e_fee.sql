-- evento_artisti: sostituisce doc_compilati (Sì/No/In attesa) con due booleani
-- separati doc_info_artisti e doc_proposal. Il campo artist_fee resta com'è.

alter table evento_artisti drop column if exists doc_compilati;

alter table evento_artisti
  add column if not exists doc_info_artisti boolean not null default false;
alter table evento_artisti
  add column if not exists doc_proposal boolean not null default false;
