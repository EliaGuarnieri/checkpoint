# 06. Chiamate RAWG e risposta HTTP

## Situazione

Il client RAWG usa un `Schedule` di retry per ogni fallimento della richiesta. Una API key errata e un errore temporaneo del server vengono quindi trattati allo stesso modo. `runHttp` traduce gli errori del catalogo in una risposta 503.

## Codice da leggere

- `src/modules/catalog/rawg-live.ts`: richiesta, decodifica e retry
- `src/modules/catalog/service.ts`: errore pubblico
- `src/infrastructure/http.ts`: risposta al client
- `src/components/catalog-search-dialog.tsx`: messaggio per l'utente

## Lavoro sul codice

1. Segui tre casi: credenziale errata, risposta 5xx e JSON malformato. Conta i tentativi e annota quale errore arriva alla route.
2. Decidi quali casi meritano retry e un limite di tempo.
3. Conserva una causa utile per diagnosticare il problema senza inviare chiavi o payload esterni al browser.
4. Cambia risposta HTTP e UI solo se possono comunicare una differenza utile all'utente.

## Come verificare

- Una credenziale errata non avvia tentativi inutili.
- Un errore temporaneo viene ritentato un numero finito di volte.
- JSON non valido si distingue da un problema di rete nei dati diagnostici.
- La risposta non contiene segreti.

## Cosa impari di Effect

`Schedule` definisce quando ripetere un `Effect`. La scelta degli errori ritentabili resta una regola del programma. `Schema.decodeUnknown` fallisce in un punto diverso dalla richiesta HTTP.

## Domanda per la review

Quale errore potrebbe cambiare risultato riprovando subito?
