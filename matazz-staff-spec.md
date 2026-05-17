# Matazz Staff — Specifica del Progetto

Questo documento contiene tutte le informazioni per costruire l'app interna di gestione eventi dell'associazione Matazz. Dallo a Claude Code come riferimento all'inizio del progetto e quando ti serve ricordare lo schema o le decisioni prese.

---

## Obiettivo

Costruire una **dashboard interna minimale** per il team Matazz (9 persone) per organizzare eventi artistici itineranti. Sostituisce fogli Excel sparsi e Google Drive. Centralizza in un'unica app: rubrica artisti, gestione eventi, budget automatico, calendario compiti, materiali, location e inventario.

**Filosofia: minimal e funzionale.** Niente animazioni, niente UI elaborata. Tutto in italiano. Estetica da dashboard interna, usabile da mobile e desktop.

---

## Stack tecnico

- **Frontend**: Next.js 14+ (App Router), TypeScript
- **Styling**: Tailwind CSS (utility classes base, niente fronzoli)
- **Database + Backend**: Supabase (Postgres)
- **Hosting**: Cloudflare Pages (deploy automatico da GitHub)
- **Repository**: GitHub (repository privato)
- **Dominio finale**: `staff.matazz.ch` (sottodominio collegato via CNAME a Cloudflare Pages)

---

## Autenticazione e Identità

**Password condivisa + selezione identità.** Niente account individuali con email/password personali. Tutti entrano con la stessa password, poi selezionano chi sono dalla lista del team per avere attribuzione automatica delle azioni.

### Flusso utente

1. L'utente apre il sito e viene reindirizzato a `/login`
2. Inserisce la password condivisa (variabile d'ambiente `SHARED_PASSWORD`)
3. Viene reindirizzato a `/seleziona-identita` (se non ha mai selezionato un'identità su questo browser)
4. Vede una griglia con i 9 nomi del team come bottoni grossi e cliccabili (anche da mobile)
5. Clicca sul suo nome
6. Viene reindirizzato alla home e da qui in poi l'app sa "chi è"
7. In alto a destra di ogni pagina c'è sempre visibile il nome attivo + un piccolo link "cambia identità"

### Implementazione tecnica

- **Due cookie httpOnly separati**:
  - `auth_token`: settato dopo password corretta, durata 30 giorni
  - `user_identity_id`: settato dopo selezione identità, contiene l'UUID del membro `team_matazz`, durata 90 giorni
- **Middleware Next.js**:
  - Manca `auth_token` → redirect a `/login`
  - Ha `auth_token` ma manca `user_identity_id` → redirect a `/seleziona-identita`
  - Entrambi presenti → accesso libero a tutte le pagine interne
- **Pulsante "Esci"** in alto a destra cancella entrambi i cookie e riporta a `/login`
- **Pulsante "Cambia identità"** cancella solo `user_identity_id` e riporta a `/seleziona-identita`

### Attribuzione automatica

Quando un utente compie un'azione che crea una nuova riga in una tabella (aggiungere un artista, creare un evento, aggiungere un compito, ecc.), il sistema legge `user_identity_id` dal cookie server-side e popola automaticamente il campo `creato_da_id` della nuova riga. L'utente non deve scriverlo a mano.

**Non usare Supabase Auth**: è sovradimensionato per questo caso.

---

## Schema database

### Tabelle globali (vivono fuori dagli eventi)

**`team_matazz`** — lista membri del team, pre-popolata
- `id` (uuid, PK)
- `nome` (text, unique)

Da pre-popolare con i nomi: Edu, Gio, Pie, Pino, Briz, Maru, Vane, Tommy, Manu

**`locations`** — rubrica sedi possibili
- `id` (uuid, PK)
- `nome` (text)
- `citta` (text)
- `indirizzo` (text, nullable)
- `capienza` (integer, nullable)
- `contatti_referente` (text, nullable)
- `costo_tipico` (decimal, nullable)
- `note` (text, nullable)
- `creato_da_id` (uuid, FK → team_matazz, nullable)
- `created_at` (timestamp, default now())

**`artisti`** — rubrica artisti minimale
- `id` (uuid, PK)
- `nome` (text)
- `cognome` (text)
- `tipo_arte` (text — enum: Installazione, Installazione-Sonora, Installazione-Performance, Video, Danza, Performance Musica, Musica Sera)
- `link` (text, nullable — sito o instagram)
- `creato_da_id` (uuid, FK → team_matazz, nullable)
- `created_at` (timestamp, default now())

**`personale_esterno`** — collaboratori non artisti
- `id` (uuid, PK)
- `nome` (text)
- `cognome` (text)
- `ruolo_principale` (text — es: Fotografo, Tecnico audio, Tecnico luci, Bar staff, Allestimento, Cucina, Sicurezza)
- `contatti` (text, nullable)
- `tariffa_tipica` (decimal, nullable)
- `note` (text, nullable)
- `creato_da_id` (uuid, FK → team_matazz, nullable)
- `created_at` (timestamp, default now())

**`inventario`** — cose possedute da Matazz
- `id` (uuid, PK)
- `articolo` (text)
- `quantita` (integer, default 1)
- `dove_si_trova` (text, nullable)
- `condizione` (text — enum: Ottimo, Buono, Da riparare, Da buttare)
- `note` (text, nullable)
- `creato_da_id` (uuid, FK → team_matazz, nullable)
- `created_at` (timestamp, default now())

### Tabelle dell'evento

**`eventi`**
- `id` (uuid, PK)
- `nome` (text)
- `data_inizio` (date)
- `data_fine` (date, nullable)
- `location_id` (uuid, FK → locations, nullable)
- `stato` (text — enum: In pianificazione, In corso, Concluso, Annullato)
- `descrizione` (text, nullable)
- `creato_da_id` (uuid, FK → team_matazz, nullable)
- `created_at` (timestamp, default now())

**`evento_artisti`** — link artista-evento + dettagli specifici di quella partecipazione
- `id` (uuid, PK)
- `evento_id` (uuid, FK → eventi, on delete cascade)
- `artista_id` (uuid, FK → artisti)
- `chi_contatto_id` (uuid, FK → team_matazz, nullable)
- `doc_mandati` (text, default 'Non ancora' — enum: Sì, Non ancora)
- `doc_compilati` (text, default 'In attesa' — enum: Sì, No, In attesa)
- `necessita_alloggio` (boolean, default false)
- `info_alloggio` (text, nullable)
- `ingombro_mq` (decimal, nullable)
- `costi_produzione` (decimal, default 0)
- `artist_fee` (decimal, default 0)
- `intolleranze_cibo` (text, nullable)
- `commenti` (text, nullable)
- `creato_da_id` (uuid, FK → team_matazz, nullable)

**`evento_personale`**
- `id` (uuid, PK)
- `evento_id` (uuid, FK → eventi, on delete cascade)
- `personale_id` (uuid, FK → personale_esterno)
- `ruolo_specifico` (text, nullable — sovrascrive `ruolo_principale` per questo evento)
- `compenso` (decimal, default 0)
- `note` (text, nullable)
- `creato_da_id` (uuid, FK → team_matazz, nullable)

**`evento_compiti`** — timeline, comunicazione, tabella di marcia
- `id` (uuid, PK)
- `evento_id` (uuid, FK → eventi, on delete cascade)
- `titolo` (text)
- `data` (date)
- `ora` (time, nullable)
- `categoria` (text — enum: Comunicazione, Organizzazione generale, Settimana evento, Allestimento, Logistica)
- `assegnato_a_id` (uuid, FK → team_matazz, nullable)
- `descrizione` (text, nullable)
- `fatto` (boolean, default false)
- `creato_da_id` (uuid, FK → team_matazz, nullable)

**`evento_materiali`**
- `id` (uuid, PK)
- `evento_id` (uuid, FK → eventi, on delete cascade)
- `articolo` (text)
- `quantita` (integer, default 1)
- `prezzo_unitario` (decimal, default 0)
- `gia_disponibile` (boolean, default false)
- `inventario_id` (uuid, FK → inventario, nullable — se collegato a un item dell'inventario)
- `note` (text, nullable)
- `creato_da_id` (uuid, FK → team_matazz, nullable)

**`evento_budget_extra`** — tutto il resto del budget (affitto location, SIAE, ecc.)
- `id` (uuid, PK)
- `evento_id` (uuid, FK → eventi, on delete cascade)
- `voce` (text)
- `importo` (decimal)
- `tipo` (text — enum: Entrata, Uscita)
- `categoria` (text, nullable — es: Affitto location, SIAE, Assicurazione, Trasporti, Catering, Pubblicità, Permessi)
- `note` (text, nullable)
- `creato_da_id` (uuid, FK → team_matazz, nullable)

### Calcolo automatico del budget evento

Per ogni evento, il totale si calcola al volo (non memorizzato):

**Totale uscite** = somma di:
- `evento_artisti.artist_fee + evento_artisti.costi_produzione`
- `evento_personale.compenso`
- `evento_materiali` con `gia_disponibile = false` → `quantita × prezzo_unitario`
- `evento_budget_extra.importo` con `tipo = 'Uscita'`

**Totale entrate** = somma di `evento_budget_extra.importo` con `tipo = 'Entrata'`

**Saldo** = entrate − uscite

Quando l'utente modifica un valore in qualsiasi delle tabelle sopra, la pagina Budget mostra il totale aggiornato al ricaricamento (o via revalidation Next.js).

---

## Pagine e ordine di sviluppo

Costruire in questo ordine, così l'app è utilizzabile il prima possibile.

### Priorità 1 — MVP utilizzabile

1. **`/login`** — pagina con un campo password
2. **`/seleziona-identita`** — griglia con i 9 nomi del team (bottoni grossi, ottimi per mobile) per scegliere chi si è
3. **`/`** — home/dashboard: lista eventi attivi + pulsante "Nuovo evento" + nome utente in alto a destra
4. **`/eventi`** — lista cronologica di tutti gli eventi (filtro per stato), pulsante "Nuovo evento"
5. **`/eventi/[id]`** — pagina dettaglio evento con tab di navigazione
6. **Tab Artisti** dentro `/eventi/[id]` — tabella artisti dell'evento, CRUD completo. L'aggiunta parte selezionando un artista dalla rubrica `artisti` (o creandone uno nuovo al volo). Il campo `creato_da_id` viene popolato automaticamente dall'identità attiva.

### Priorità 2

7. **Tab Budget** — riassunto con totale uscite (suddivise per categoria), totale entrate, saldo. Tutto calcolato automaticamente.
8. **Tab Compiti** — lista compiti con filtro per categoria, ordinati per data. Checkbox "fatto". Filtro "Solo miei compiti" (basato su `assegnato_a_id` = identità attiva). Possibile vista calendario.

### Priorità 3

9. **Tab Personale** dentro `/eventi/[id]`
10. **Tab Materiali** dentro `/eventi/[id]`
11. **Tab Voci extra** dentro `/eventi/[id]` — gestione `evento_budget_extra`

### Priorità 4 — rubriche globali

12. **`/artisti`** — CRUD sulla rubrica globale, con colonna "proposto da" che mostra il `creato_da_id`
13. **`/personale`** — CRUD sulla rubrica personale
14. **`/locations`** — CRUD sulle location
15. **`/inventario`** — CRUD sull'inventario

---

## Linee guida UX/UI

- **Lingua**: italiano dappertutto
- **Layout**: sidebar a sinistra con link alle sezioni principali (Eventi, Artisti, Personale, Locations, Inventario, Esci). In alto a destra: nome utente attivo + link piccolo "Cambia identità". Contenuto principale a destra.
- **Mobile**: sidebar collassabile in menu hamburger
- **Stile**: minimal. Tailwind defaults. Palette neutra (bianco/grigio/nero) + un colore d'accento (suggerisco ambra o un colore preso dal sito matazz.ch). Niente animazioni inutili.
- **Tabelle**: stile spreadsheet-like, righe editabili in-place o tramite modal (scegliere la soluzione più semplice da implementare). Colonna "proposto da" / "aggiunto da" visibile dove utile.
- **Form**: validazione minima, messaggi di errore chiari in italiano
- **Date**: formato italiano gg/mm/aaaa
- **Numeri/valute**: formato italiano (€ 1.234,56)

---

## Setup iniziale (prima di scrivere codice)

### Account da creare

1. **GitHub** (github.com) — per il codice
2. **Supabase** (supabase.com) — per il database. Creare progetto nella regione EU (Francoforte è la più vicina alla Svizzera)
3. **Cloudflare** (cloudflare.com) — per il deploy

### Su Supabase

1. Creare nuovo progetto
2. Annotare in un posto sicuro: URL del progetto, anon key, service_role key
3. SQL Editor → eseguire lo script di creazione tabelle (Claude Code può generarlo dallo schema sopra)
4. Inserire i 9 nomi nella tabella `team_matazz`

### Su GitHub

1. Creare un repository privato chiamato `matazz-staff`

### Variabili d'ambiente

File `.env.local` (locale, **non** committare):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SHARED_PASSWORD=...
```

Le stesse variabili vanno configurate su Cloudflare Pages al momento del deploy.

---

## Workflow di sviluppo consigliato per Claude Code

1. Inizializzare progetto Next.js con TypeScript e Tailwind nella cartella del progetto
2. Installare `@supabase/supabase-js` e configurare il client
3. Implementare l'autenticazione: middleware + `/login` + `/seleziona-identita` (con i 9 nomi pre-popolati o letti dal DB)
4. Implementare un helper server-side `getCurrentIdentity()` che legge il cookie `user_identity_id` e ritorna il record corrispondente di `team_matazz`. Usarlo per popolare `creato_da_id` su tutte le insert.
5. Generare ed eseguire lo script SQL su Supabase per creare tutte le tabelle
6. Costruire le pagine in ordine di priorità
7. Inizializzare git, creare il repo su GitHub, primo commit & push
8. Collegare Cloudflare Pages al repo, configurare variabili d'ambiente, primo deploy
9. Su IONOS aggiungere record DNS (CNAME) per `staff.matazz.ch` → puntare al deploy Cloudflare

---

## Note finali

- Nomi delle tabelle e dei concetti di dominio in italiano (`evento`, `artista`, ecc.). Codice tecnico (componenti React, utility, hook) può restare in inglese.
- Preferire React Server Components quando possibile, Client Components solo dove c'è interattività.
- Niente librerie pesanti: niente Redux, niente UI framework complessi. Tailwind + componenti scritti a mano. `react-hook-form` ok se aiuta per i form.
- Il team accede da mobile durante gli eventi: tutte le pagine devono funzionare bene su schermo piccolo.
- Quando una tabella ha più di 10 righe, valutare paginazione o filtri.
- **Sicurezza**: il campo `creato_da_id` deve essere popolato server-side leggendo il cookie, mai accettando un valore inviato dal client. Usare Server Actions o API routes per le insert.
