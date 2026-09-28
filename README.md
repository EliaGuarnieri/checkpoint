# Checkpoint

Checkpoint è un diario personale per videogiochi. Cerchi un gioco nel catalogo, lo aggiungi alla libreria e annoti stato, voto e note. Ogni gioco ha una sola voce personale.

Il progetto è un esercizio su [Effect](https://effect.website/). Le chiamate al catalogo, la validazione degli input e la persistenza passano attraverso programmi Effect con dipendenze ed errori espliciti.

## Demo

La configurazione predefinita usa un catalogo locale e una libreria in PostgreSQL. Non richiede API key o richieste esterne. Puoi cercare Hades, Celeste o Dead Cells e aggiungerli dalla pagina `/library`.

![Libreria di Checkpoint](docs/screenshots/library.png)

![Dettaglio di un gioco](docs/screenshots/game-detail.png)

## Avvio rapido

Servono Node.js 20 o successivo, pnpm e Docker con Compose.

```bash
pnpm install --frozen-lockfile
pnpm setup
pnpm dev
```

Apri [http://localhost:3000](http://localhost:3000). `pnpm setup` crea `.env` da `.env.example`, avvia PostgreSQL, applica le migration e carica cinque voci dimostrative. Il seed è ripetibile.

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm check      # lint + typecheck + test
pnpm build
```

## Catalogo RAWG

La demo usa `CATALOG_PROVIDER=fake`. Per cercare nel catalogo live, crea una API key dalla [documentazione RAWG](https://rawg.io/apidocs) e imposta queste variabili in `.env`:

```env
CATALOG_PROVIDER=live
RAWG_API_KEY=la-tua-chiave
```

Non committare `.env`. L'interfaccia mostra l'attribuzione RAWG quando usa il catalogo live.

## Funzionalità

- Una voce personale per gioco, con stato `backlog`, `playing`, `completed` o `abandoned`.
- Voto intero opzionale da 1 a 10 e una nota.
- Ricerca nel catalogo e aggiunta manuale alla libreria.
- Filtri per titolo, stato, genere, sviluppatore, editore e voto minimo.
- Ordinamento per ultimo aggiornamento, titolo, voto o data di uscita.

## Architettura

```mermaid
flowchart LR
  UI[Next.js + TanStack Query] --> API[Route Handlers]
  API --> Catalog[GameCatalog]
  API --> Library[LibraryRepository]
  Catalog --> Rawg[RAWG API o catalogo demo]
  Library --> Drizzle[Drizzle ORM]
  Drizzle --> Postgres[(PostgreSQL)]
```

Il codice applicativo è organizzato in `src/modules`; gli adapter e la configurazione sono in `src/infrastructure`. Il vocabolario è in [`CONTEXT.md`](CONTEXT.md), la specifica in [`docs/spec.md`](docs/spec.md) e le scelte di perimetro in [`docs/adr/`](docs/adr/).

### Come viene usato Effect

- `Context.Tag` dichiara `GameCatalog` e `LibraryRepository`.
- `Layer` sceglie gli adapter live, demo o in memoria.
- `Schema` decodifica input HTTP, configurazione e risposte RAWG.
- `Data.TaggedError` distingue errori del catalogo, del database e voci mancanti.
- `Effect.forEach` limita a quattro le richieste di dettaglio RAWG concorrenti.
- `Schedule` ritenta le richieste RAWG fallite con un limite.

TanStack Query gestisce query, mutation e invalidazione della cache nel browser. Effect gestisce i confini del server e le dipendenze dei programmi. Drizzle gestisce le query SQL; le interfacce dei repository restituiscono valori `Effect`.

## Decisioni

Il prototipo è single-user: non ha autenticazione o tabella utenti. La ricerca aggiorna gli snapshot locali dei giochi, ma non crea voci personali. Solo l'azione esplicita "Aggiungi" crea una voce in libreria. Se la voce esiste già, l'aggiunta non modifica stato, voto o nota.

L'importazione Steam e il tracciamento delle fonti di possesso sono stati rimossi per concentrare il progetto sul diario e sui flussi Effect ancora utili. La [decisione di perimetro](docs/adr/0001-focus-on-personal-library.md) documenta anche la migration che elimina le vecchie associazioni senza cancellare le voci personali.

## Test ed esercizi

I test coprono il repository in memoria e il confine HTTP. `pnpm check` esegue lint, typecheck e test. Le sei [schede di studio](exercises/README.md) propongono cambiamenti progressivi nei flussi di catalogo, libreria, configurazione e chiamate esterne.

## Uso dell'AI

Codex ha aiutato a esaminare il codice, restringere il perimetro e aggiornare implementazione e documenti. Le decisioni sul prodotto sono state confermate prima delle modifiche. Ho verificato il risultato con i controlli del repository.
