# 05. Configurazione e scelta degli adapter

## Situazione

`loadConfig` legge l'ambiente e decodifica in modo sincrono. Se `CATALOG_PROVIDER=live` ma manca `RAWG_API_KEY`, può lanciare un'eccezione prima che `runHttp` riceva un programma Effect. `makeAppLayer` legge inoltre `DATABASE_URL` separatamente.

## Codice da leggere

- `src/infrastructure/config.ts` e `app-layer.ts`
- `src/infrastructure/http.ts`
- `src/modules/catalog/rawg-live.ts`
- Una route in `src/app/api/` per seguire `Effect.provide`

## Lavoro sul codice

1. Segui una richiesta con configurazione live incompleta. Trova il punto in cui il fallimento esce dal programma.
2. Decidi dove leggere e validare tutte le variabili necessarie agli adapter.
3. Rappresenta l'errore di configurazione in modo che la route possa produrre una risposta controllata senza esporre la chiave.
4. Mantieni la demo come default senza credenziali.

## Come verificare

- La demo parte senza API key.
- La modalità live con chiave valida sceglie l'adapter RAWG.
- La modalità live senza chiave restituisce un errore comprensibile.
- Lint e typecheck passano.

## Cosa impari di Effect

Un `Layer` costruisce le dipendenze di un programma. Se la costruzione può fallire, anche quel fallimento deve comparire nel percorso che la route gestisce. Confronta `Schema` e `Config` di Effect prima di decidere.

## Domanda per la review

In quale punto le variabili d'ambiente diventano configurazione validata?
