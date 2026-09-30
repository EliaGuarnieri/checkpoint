# Criteri per un progetto idiomatico Effect

Ricerca del 30 settembre 2026. I criteri e l'audit descrivono lo stato precedente all'implementazione. Le correzioni successive sono riepilogate in fondo.

## Versione e ambito

Checkpoint dichiara e installa **Effect 3.22.2**, verificato in `package.json` e `node_modules/effect/package.json`. Le fonti web sotto sono esplicitamente v3. Le pagine v4 mostrano API diverse: per esempio `Context.Service`, `Effect.catch` e `Effect.result`; nella versione installata i riferimenti pertinenti sono `Context.Tag`/`Effect.Service`, `Effect.catchAll` ed `Effect.either`. Un aggiornamento di major non è un prerequisito per rendere più idiomatico il progetto. [Servizi v3](https://effect.website/docs/v3/requirements-management/services), [Servizi v4](https://effect.website/docs/v4/requirements-management/services), [Errori v3](https://effect.website/docs/v3/error-management/expected-errors), [Errori v4](https://effect.website/docs/v4/error-management/expected-errors).

L'obiettivo non è aumentare il numero di import da Effect. La documentazione descrive Effect come coordinatore di esecuzione, concorrenza e fallimenti, e consiglia normali array per le trasformazioni di collezioni. Da questo discende un criterio progettuale: JSX, layout, semplici trasformazioni pure e stato di interazione React non richiedono automaticamente un Effect. L'integrazione tramite Promise al confine di Next.js o React è prevista dal runtime. [Myths](https://effect.website/docs/v3/additional-resources/myths), [Runtime](https://effect.website/docs/v3/runtime).

## 1. Programmi descritti, esecuzione ai confini

`Effect<A, E, R>` rende visibili risultato, fallimenti attesi e dipendenze. `Effect.tryPromise` converte API Promise in un'operazione composta nel programma e consente di mappare il rigetto a un errore tipizzato. Il thunk rimanda l'operazione all'esecuzione: creare una Promise prima del thunk avvia il lavoro prima che Effect possa coordinarlo. [Creating Effects](https://effect.website/docs/v3/getting-started/creating-effects).

Le sorgenti installate di `ManagedRuntime.ts` indicano esplicitamente di invocare `runPromise` e gli altri runner ai bordi del programma. Criterio: route, Server Action e integrazioni UI possono eseguire Effect; un servizio di dominio dovrebbe restituire Effect e comporli senza eseguirli internamente. Un grande `tryPromise(async () => ...)` è un adapter legittimo; diventa una debolezza quando racchiude un intero caso d'uso e nasconde errori, dipendenze e policy che sarebbe utile comporre separatamente. Quest'ultima valutazione è un'inferenza progettuale, non un divieto della libreria. [Sorgente ManagedRuntime installata](../../node_modules/effect/src/ManagedRuntime.ts), [Runtime](https://effect.website/docs/v3/runtime).

## 2. Errori attesi, difetti e interruzioni distinti

Gli errori recuperabili fanno parte di `E`; gli errori discriminati con `_tag` permettono recovery selettivo mediante `catchTag`. I difetti segnalano condizioni per cui non esiste un recupero sensato nel contesto del programma; `never` nel canale degli errori non garantisce l'assenza di difetti. [Expected Errors](https://effect.website/docs/v3/error-management/expected-errors), [Unexpected Errors](https://effect.website/docs/v3/error-management/unexpected-errors).

Criteri: non cancellare indiscriminatamente dettagli di errori distinti con un'unica stringa; usare fallback solo per le condizioni ammesse dal prodotto; lasciare osservabili i difetti. Un messaggio generico verso il browser può essere corretto, purché il lato server mantenga causa e contesto diagnostico. `runPromiseExit` conserva l'esito tramite `Exit`/`Cause`; `catchAll` tratta il canale tipizzato, `catchAllCause` può trattare anche difetti e interruzioni. [Cause](https://effect.website/docs/v3/data-types/cause), [Sorgente Effect installata](../../node_modules/effect/src/Effect.ts).

Non ogni errore deve avere una classe separata: la tassonomia deve rappresentare recovery differenti, non soltanto luoghi differenti in cui un errore può emergere.

## 3. Dipendenze sostituibili e Layer come costruttori

`Context.Tag` rende una capacità richiesta esplicita nel parametro `R`. `Layer` costruisce implementazioni e compone il loro grafo di dipendenze, evitando di esporre dettagli di costruzione in ogni metodo del servizio. [Managing Services](https://effect.website/docs/v3/requirements-management/services), [Managing Layers](https://effect.website/docs/v3/requirements-management/layers).

Criterio: accessi a database, catalogo, configurazione, tempo o generatori di identificativi devono avere un punto di sostituzione quando influenzano comportamento e test. Non serve creare un servizio per ogni funzione. Importare un singleton live all'interno di un caso d'uso rende meno utile `R`, anche se quella funzione ritorna formalmente un Effect. `Context.Tag` più `Layer` è già idiomatico: passare a `Effect.Service` non risolve da solo dipendenze nascoste. [Sorgenti Context](../../node_modules/effect/src/Context.ts), [Sorgenti Layer](../../node_modules/effect/src/Layer.ts).

## 4. Validazione dei dati e invarianti

`Schema` descrive decodifica, codifica e validazione, inclusi input sconosciuti. È quindi adatto ai confini in cui TypeScript non offre garanzie a runtime: form, query, JSON esterno e dati persistiti. [Schema Introduction](https://effect.website/docs/v3/schema/introduction), [Schema Basic Usage](https://effect.website/docs/v3/schema/basic-usage).

Criterio: una type assertion non sostituisce il decoder; dopo la validazione, le operazioni interne dovrebbero poter fidarsi delle invarianti invece di ripetere controlli incoerenti. Schemi raffinati e brand possono distinguere identificativi e valori validi; il loro valore va misurato dal numero di stati sbagliati che impediscono, non dal numero di tipi introdotti. Questa è una raccomandazione di progettazione basata sulle capacità di Schema, non una prescrizione di brandizzare ogni stringa. [Sorgente Schema installata](../../node_modules/effect/src/Schema.ts).

## 5. Risorse e cancellazione con un proprietario

`acquireRelease` registra il rilascio nello `Scope`; dopo un'acquisizione riuscita il finalizer viene eseguito quando lo scope si chiude, anche se l'utilizzo fallisce. `Layer.scoped` permette di costruire servizi con risorse. Un `ManagedRuntime` possiede le risorse del proprio layer e offre `dispose`/`disposeEffect`. [Scope](https://effect.website/docs/v3/resource-management/scope), [Sorgente Layer](../../node_modules/effect/src/Layer.ts), [Sorgente ManagedRuntime](../../node_modules/effect/src/ManagedRuntime.ts).

Criteri: pool e connessioni devono avere lifetime dichiarato; una connessione per transazione può vivere nello scope dell'operazione, un pool nello scope dell'applicazione. Per chiamate HTTP, `tryPromise` passa un `AbortSignal` utilizzabile da `fetch`: l'interruzione del fiber non garantisce che un'API esterna ignori o interrompa realmente il lavoro, se il signal non viene inoltrato o supportato. [Sorgente Effect installata](../../node_modules/effect/src/Effect.ts).

## 6. Test e osservabilità come conseguenze dell'architettura

Le dipendenze esplicite possono essere fornite da implementazioni di test. Per comportamento temporale, `TestClock` e `TestContext` consentono di far avanzare il tempo senza attese reali. Criterio: un caso d'uso dovrebbe poter essere provato con catalogo e persistenza deterministici, includendo errori e cancellazione quando pertinenti. Non è necessario cambiare test runner per ottenere questo beneficio. [Managing Services](https://effect.website/docs/v3/requirements-management/services), [TestClock](https://effect.website/docs/v3/testing/testclock).

`withSpan` aggiunge span alle operazioni, e un exporter configura la destinazione dei trace. Criterio: osservare casi d'uso e adapter esterni con nomi di dominio, causa dei fallimenti e durata; non tracciare ogni helper puro. L'assenza di tracing è un'occasione di apprendimento e diagnosi, non prova che un programma sia scorretto. [Tracing](https://effect.website/docs/v3/observability/tracing).

## Come usare questi criteri nell'audit

Per ogni rilievo distinguere: difetto concreto del comportamento, dipendenza o garanzia nascosta, opportunità didattica, semplice preferenza stilistica. Dare precedenza a ciò che permette di comporre errori, dipendenze, risorse e policy di un caso d'uso. Una riscrittura globale della UI o la sostituzione di ogni Promise non seguono automaticamente da questi principi.

## Audit di Checkpoint

Il progetto usa già Effect per servizi, adapter, configurazione, validazione ed errori. Il passo successivo è rendere più affidabili le garanzie di quei programmi. La valutazione rispetta [spec](../spec.md) e [ADR di perimetro](../adr/0001-focus-on-personal-library.md): Effect v3 sul server, TanStack Query nel browser, Drizzle per il database, nessuna nuova integrazione di prodotto.

### 1. Correggere l'esecuzione anticipata nel repository in memoria

**Difetto confermato.** In [repository-memory.ts](../../src/modules/library/repository-memory.ts#L114), `findById` legge lo stato mentre costruisce il valore Effect. `update` e `remove` modificano lo stato prima di restituire `Effect.void`. Costruire un programma dovrebbe descrivere l'operazione; lo stato dovrebbe essere letto e modificato quando il programma viene eseguito. Vedi il criterio 1.

Due verifiche locali, senza database o rete:

- Chiamare `repository.update(id, { rating: 1 })` senza eseguire il valore restituito cambia già il rating iniziale da 9 a 1.
- Costruire `const read = repository.findById(id)`, aggiornare il rating e poi eseguire `read` restituisce 9; costruire ed eseguire una nuova lettura restituisce 1.

Questo altera anche il significato di riusare, ritentare e interrompere un programma. Primo intervento: racchiudere letture e scritture in `Effect.suspend` o `Effect.sync`, come già accade per `addManualGame` e `refreshCatalogGame`. Successivamente `Ref` può rendere esplicita la gestione dello stato; una closure mutabile usata correttamente non è di per sé vietata. Testare costruzione senza esecuzione e riuso della stessa lettura.

### 2. Dichiarare le dipendenze necessarie ai singoli flussi

**Accoppiamento confermato.** [app-layer.ts](../../src/infrastructure/app-layer.ts#L7) costruisce sempre catalogo e repository. Tutte le route forniscono quel layer, comprese GET, PATCH e DELETE della libreria che non usano il catalogo. La costruzione legge quindi `RAWG_API_KEY` prima di eseguire anche quei programmi. Vedi il criterio 3.

Verifica locale: fornire `makeAppLayer()` a un semplice `Effect.succeed`, con `ConfigProvider.fromMap(new Map())`, produce `Missing data at RAWG_API_KEY`. Non parte alcuna chiamata esterna. Per una lettura della libreria, l'assenza della chiave del catalogo è una dipendenza estranea al caso d'uso. La spec richiede la chiave per l'app live; separare le dipendenze dei flussi è una scelta architetturale coerente, non una richiesta di aggiungere una modalità demo.

Fornire il layer del repository ai programmi di sola libreria, quello del catalogo alla ricerca e il grafo completo ad aggiunta e refresh. Se si sceglie invece di validare tutta la configurazione all'avvio, documentare questa policy. Non assumere che `R` elimini automaticamente i servizi in più presenti nel layer fornito.

### 3. Far possedere il pool database a un layer

**Garanzia nascosta.** [client.ts](../../src/infrastructure/database/client.ts#L65) conserva un singleton globale; `closeDatabase` è una funzione separata. [repository-live.ts](../../src/modules/library/repository-live.ts#L24) legge la configurazione e recupera quel singleton per ogni operazione. `LibraryRepositoryLive` usa `Layer.succeed`, quindi non acquisisce né rilascia il pool. Nel comando di verifica, `runtime.dispose()` e `closeDatabase()` sono infatti chiamati separatamente. Vedi il criterio 5.

Introdurre un servizio `Database` costruito con `Layer.scoped` e `Effect.acquireRelease`, con rilascio tramite `pool.end()`. Il repository live richiede quel servizio e riceve il client quando viene costruito. Mantenere Drizzle e le sue transazioni.

Il pool deve vivere quanto il runtime dell'applicazione, non quanto una richiesta. Dopo questa modifica, continuare a costruire e chiudere il layer a ogni route aprirebbe e chiuderebbe pool continuamente. Valutare un `ManagedRuntime` condiviso per processo con lifecycle esplicito nel deployment scelto. Non dichiarare risolto lo shutdown di Next.js solo perché esiste `dispose()`.

### 4. Rendere gli errori utili alle decisioni

**Perdita di distinzione.** Il catch di [databaseEffect](../../src/modules/library/repository-live.ts#L29) converte sia errori di configurazione sia ogni eccezione della callback in `DatabaseUnavailable`. Anche `Game upsert returned no row` finisce in quella categoria. [rawg-live.ts](../../src/modules/catalog/rawg-live.ts#L27) riduce tutti gli status HTTP a una generica indisponibilità. [http.ts](../../src/infrastructure/http.ts#L3) accetta un `E` arbitrario, estrae una stringa `_tag` e assegna 503 a tutti i fallimenti non riconosciuti. Non registra la `Cause`; difetti e interruzioni senza fallimento tipizzato diventano entrambi una risposta generica 500. Vedi il criterio 2.

Distinguere configurazione invalida, problemi di trasporto, risposta HTTP e violazioni delle invarianti quando richiedono comportamenti differenti. Conservare status e causa nell'adapter, anche se l'errore di dominio rimane più generale. Una condizione ritenuta impossibile dovrebbe restare diagnosticabile come difetto; un vincolo SQL atteso può invece avere un errore tipizzato specifico. Definire al confine HTTP una union nota e una mappatura esaustiva. Registrare la causa completa lato server con attenzione ai segreti, senza pubblicarla nel JSON.

### 5. Collegare cancellazione, timeout e retry

**Policy incompleta, retry confermato.** La callback di `Effect.tryPromise` in [rawg-live.ts](../../src/modules/catalog/rawg-live.ts#L22) non inoltra l'`AbortSignal` a `fetch`. Non c'è un timeout applicativo. Il retry copre indistintamente tutti i fallimenti della richiesta, comprese risposte permanenti; la decodifica Schema avviene dopo il retry e non viene ritentata, correttamente. Vedi i criteri 2 e 5.

Verifica con `fetch` simulato che restituisce 404: una singola `findById` genera tre richieste. Inoltrare il signal, definire timeout e una policy selettiva per errori di rete e status transitori; trattare 429 secondo la policy del provider e l'eventuale `Retry-After`. Un 404 o una credenziale rifiutata non si risolvono con un retry identico.

Per propagare la cancellazione end-to-end, i runner supportano `{ signal }`: il confine HTTP può ricevere `request.signal`, e gli hook TanStack Query possono inoltrare il signal a `fetchJson`. L'effettiva cancellazione alla disconnessione dipende anche dall'ambiente Next.js e va verificata nel deployment. Interrompere un fiber non prova che una query PostgreSQL o una Promise non cancellabile abbiano smesso di lavorare.

### 6. Estrarre i casi d'uso dalle route

**Miglioramento architetturale e didattico.** Aggiunta e refresh sono già sequenze Effect ben composte, ma vivono in [library/route.ts](../../src/app/api/library/route.ts#L32) e [refresh/route.ts](../../src/app/api/library/[id]/refresh/route.ts#L18), insieme a parsing, output HTTP e fornitura live. Estrarre programmi come `addCatalogGame` e `refreshLibraryEntry` renderebbe i loro requisiti e fallimenti leggibili senza dettagli HTTP. Le route validano l'input, invocano il programma e traducono il risultato. Vedi i criteri 1, 3 e 6.

Provare quei programmi con `GameCatalogFake` e `LibraryRepositoryMemory`, verificando che un errore del catalogo non modifichi la libreria e che il refresh preservi tracking status, rating e note. Per cominciare basta una funzione che restituisce Effect; un ulteriore servizio è utile solo se nasconde una capacità o policy reale.

### 7. Rafforzare le invarianti dove servono

**Opportunità successiva.** [model.ts](../../src/modules/library/model.ts#L11) valida il rating in ingresso come intero 1–10, mentre il modello restituito ammette qualsiasi `Schema.Number`. La note in ingresso ha limite 10.000, quella in uscita no. Identificativi di catalogo e libreria sono entrambi stringhe. Vedi il criterio 4.

Riutilizzare schemi di dominio `Rating`, `Note`, `CatalogGameId` e `LibraryEntryId`; considerare brand per impedire scambi tra identificativi. Non basta brandizzare un valore con una assertion: occorre costruirlo tramite un decoder. Prima di imporre UUID al modello comune, correggere l'adapter memory che oggi genera `memory-${game.id}`. Le date serializzate possono restare stringhe nel contratto HTTP; un tipo temporale interno ha senso se il dominio deve calcolare su quelle date.

Letture di tempo tramite `new Date()` negli adapter possono passare a `Clock` per prove deterministiche. Span sui casi d'uso e sugli adapter, e log delle cause al confine, sono altri esercizi utili. Queste assenze non equivalgono a difetti di comportamento.

## Cosa conserverei

- `Context.Tag` e `Layer`: sono già una buona separazione tra contratto e implementazione.
- `Data.TaggedError` e `Schema.decodeUnknown` ai confini: continuerei a svilupparli.
- `async`/`await` nell'adapter Drizzle e transazioni Drizzle: wrapping tramite `tryPromise` è legittimo. `Promise.all` nell'adapter non impone una riscrittura, purché se ne riconoscano i limiti di cancellazione e composizione.
- TanStack Query e React per cache e interazioni. `fetchJson` può rimanere un adapter Promise; migliorarne il signal è più urgente che convertirlo interamente in Effect.
- `filterLibraryGames` come funzione pura. Introducendo Effect qui non si ottiene una nuova garanzia.

## Sequenza consigliata e verifiche

Ordine di apprendimento: correggere la laziness del repository memory; separare i layer dei flussi; introdurre `Database` scoped e il runtime che ne possiede il pool; rendere selettivi errori e retry con cancellazione; estrarre e testare un caso d'uso. Schemi raffinati, clock e tracing possono seguire.

Sono stati eseguiti tre probe locali: mutazione senza esecuzione e lettura precostruita, configurazione vuota con il layer comune, retry 404 tramite fetch simulato. Nessuna credenziale letta, nessuna richiesta a RAWG e nessuna connessione database. La suite esistente passa con `node node_modules/vitest/vitest.mjs run`: un file, tre test. `pnpm test` è rimasto senza output ed è stato interrotto; non è stata diagnosticata la causa del blocco del launcher.

L'indagine modifica soltanto questa nota. Non sono stati cambiati codice applicativo, dipendenze, schema database, ADR o specifica.

## Interventi applicati

Dopo l'audit sono stati applicati i seguenti interventi, senza flusso TDD su richiesta dell'utente:

- Repository in memoria basato su `Ref`, con letture e scritture differite e ID UUID. I timestamp passano tramite `Clock`.
- Layer distinti per catalogo e libreria; runtime gestiti che condividono una `MemoMap` per riusare il pool.
- Servizio `Database` acquisito tramite `Layer.scoped` e `Effect.acquireRelease`. Rilascio del pool con `dispose`, incluso il comando di verifica reale.
- Errori di configurazione distinti da errori di connessione e SQL. Le eccezioni sconosciute dell'adapter restano difetti. Mappatura HTTP esaustiva e logging delle cause server, con cause esterne sensibili redatte.
- RAWG con retry solo transitori, rispetto di `Retry-After`, timeout per tentativo e totale, cancellazione mantenuta anche durante la lettura del body. Signal inoltrato dalle query del browser alle richieste HTTP e dal confine server al runner.
- Casi d'uso di aggiunta e refresh estratti dalle route, con span e prove tramite layer fake.
- Schemi di rating, nota e identificativi condivisi tra input e output; nessun brand introdotto.

La suite viene ampliata dopo le modifiche per verificare i comportamenti corretti. README descrive implementazione e limiti: la cancellazione del fiber non annulla una query PostgreSQL già inviata, e il cleanup `beforeExit` non garantisce finalizer asincroni quando Next.js chiama `process.exit` sui segnali. Non sono stati aggiunti server custom o dipendenze di tracing esterne.

Verifiche finali dell'implementazione: lint e typecheck senza segnalazioni; 44 test in 8 file; build di produzione completata con `next build --webpack`; controllo reale Supabase riuscito con lettura di 7 voci e rilascio del pool. Il backend Turbopack non completa la build in questo ambiente perché il worker PostCSS non può aprire una porta. La review su Standards e Spec ha trovato due errori di classificazione, poi corretti e verificati: disconnessioni PostgreSQL senza codice dentro il wrapper Drizzle, ed errori di trasporto RAWG durante la lettura del body. Nessun rilievo aperto sui due assi.
