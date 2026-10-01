# Resoconto: avvio locale senza credenziali

Il progetto può essere avviato con PostgreSQL Docker e un catalogo dimostrativo, senza un progetto Supabase o una chiave RAWG. Il percorso concordato è `pnpm install --frozen-lockfile`, `pnpm setup`, `pnpm dev`. Le scelte sono registrate nell'[ADR 0002](adr/0002-local-development-with-postgres-and-demo-catalog.md).

## Setup e database

`compose.yaml` definisce PostgreSQL 17.11, raggiungibile sulla porta locale 5433, con un controllo di disponibilità e un volume persistente. Il container resta avviato dopo il setup. `docker compose stop postgres` lo ferma conservando i dati.

`pnpm setup` crea `.env` dai valori locali di `.env.example` solo quando il file manca. Riconosce il database del progetto tramite host locale, porta 5433 e nome `checkpoint`; gli altri PostgreSQL vengono rifiutati. Il comando controlla Docker e Compose, avvia il container, aspetta che sia pronto, applica le migration e legge la libreria per verificare il risultato. I messaggi distinguono Docker mancante, daemon non disponibile e porta occupata.

Gli script database condividono il programma in `scripts/database.ts`. `pnpm db:migrate` e `pnpm db:check` funzionano sia in locale sia su Supabase. I vecchi comandi con suffisso `:supabase` restano disponibili e accettano soltanto Supabase. Le migration sono eseguite dal migrator Drizzle sul client PostgreSQL esistente; non è stato modificato lo schema.

Su Supabase il setup richiede la chiave RAWG, applica le migration e verifica la connessione senza inserire dati demo. Mantiene i controlli sulle porte del pooler, sull'appartenenza delle due URL allo stesso progetto e sulla verifica TLS tramite la CA già presente. Il comando di sola verifica non richiede una connessione separata per le migration.

Gli script caricano le variabili con `@next/env`, usando le stesse regole dell'app in sviluppo. Un `.env` esistente viene conservato, inclusa una configurazione Supabase. Per passare al locale bisogna impostare `DATABASE_URL` come nell'esempio e svuotare `DATABASE_MIGRATION_URL`; anche `RAWG_API_KEY` va svuotata se si vuole il catalogo demo. Le variabili del processo e gli eventuali file `.env.local` mantengono la precedenza.

## Catalogo e dati iniziali

Il catalogo demo contiene Hades, Celeste, The Witcher 3, Hollow Knight e Red Dead Redemption 2. Il seed crea quattro voci con tutti gli stati di tracciamento, esempi di voti e note; Red Dead Redemption 2 resta disponibile per provare l'aggiunta. Tutti i giochi iniziali possono essere cercati e aggiornati tramite il catalogo demo.

Le copertine demo sono SVG tipografici inclusi in `public/demo-covers`, senza richieste esterne. `GameCover` accetta quei percorsi locali oltre agli URL RAWG già consentiti. Il fake dei test riusa il catalogo demo, evitando due dataset separati per la stessa implementazione deterministica.

Il seed controlla se la libreria è vuota e inserisce i dati nella stessa transazione SQL. Un lock sulla tabella impedisce che due setup simultanei inseriscano il seed insieme. Un errore annulla tutti gli inserimenti. Se la libreria contiene almeno una voce, il seed viene saltato: stato, voto, nota e giochi eliminati rimangono invariati. Se la libreria viene svuotata completamente, un nuovo setup inserisce nuovamente le voci demo.

## Cosa mostra di Effect

`GameCatalog` e `LibraryRepository` restano i contratti dei servizi. `Layer.unwrapEffect` legge la configurazione e sceglie quale implementazione del catalogo fornire: con il database locale e chiave assente o vuota usa `GameCatalogDemo`, con una chiave presente usa RAWG. Su Supabase la chiave è obbligatoria. Gli errori RAWG restano visibili e non causano un passaggio automatico al demo.

`LibraryRepositoryLive` resta lo stesso adapter PostgreSQL nei due ambienti. `Config` legge le variabili, `Redacted` rappresenta URL e chiavi, `Schema` valida la forma delle URL e gli errori previsti degli script sono `Data.TaggedError`. Il confine CLI esegue il programma, presenta un messaggio senza credenziali e chiude il pool anche in caso di errore.

La transazione del seed appartiene all'adapter: comporre operazioni con `Effect.gen` descrive sequenza e fallimenti, ma non rende automaticamente atomiche le scritture SQL.

## Documentazione e verifiche

L'avvio rapido del README usa il nuovo percorso locale. Sono state allineate anche le indicazioni Supabase e RAWG che lo contraddicevano, la specifica e i vincoli di prodotto.

Le verifiche comprendono:

- `pnpm check`: lint, typecheck e i tre test didattici già presenti nel repository.
- Verifica del setup sul PostgreSQL Docker: creazione di `.env`, migration e seed, conservazione di modifiche ed eliminazioni ai setup successivi.
- `pnpm build`: build di produzione riuscita.
- Verifica dell'app Next.js con database locale e chiave vuota: lettura della libreria, ricerca, aggiunta, aggiornamento dei metadati e accesso alle copertine locali.
- Controlli di formattazione e `git diff --check`.

Non è stata eseguita una migration sul database Supabase reale. I test aggiunti per questa modifica e il comando dedicato al setup sono stati rimossi su richiesta; rimane la suite didattica preesistente.

## Standards

La review ha rilevato una violazione della regola di validazione ai confini: l'URL delle migration Supabase era controllata con `new URL` e verifiche imperative, mentre gli standard richiedono Effect `Schema`. È stata corretta introducendo un decoder PostgreSQL condiviso, usato anche per `DATABASE_MIGRATION_URL` prima dei controlli di porta, progetto e TLS.

Ha inoltre segnalato una possibile duplicazione nei controlli TLS e nella validazione dell'URL runtime. Il controllo TLS ora vive in una funzione dedicata; la validazione runtime viene eseguita una sola volta.

## Spec

La review non ha rilevato discrepanze rispetto all'ADR 0002: avvio e disponibilità Docker, migration, seed atomico della libreria vuota, conservazione dei dati, percorso Supabase senza seed e selezione demo/RAWG corrispondono alle decisioni confermate. Il limite resta la mancata esecuzione del percorso Supabase su un database reale.

Risultato della review: un rilievo sugli standard e una possibile duplicazione, entrambi corretti; nessun rilievo sulla specifica.
