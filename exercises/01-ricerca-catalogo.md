# 01. Ricerca nel catalogo e fallimenti locali

## Situazione

Il catalogo live cerca fino a dieci giochi e poi richiede i dettagli con `Effect.forEach`, al massimo quattro alla volta. Se una risposta di dettaglio fallisce, la ricerca intera fallisce. Decidi se questo comportamento è utile al giocatore o se i risultati riusciti dovrebbero restare visibili.

## Codice da leggere

- `src/modules/catalog/rawg-live.ts`: `searchByTitle` e `requestJson`
- `src/modules/catalog/service.ts`: errore pubblico del catalogo
- `src/app/api/catalog/search/route.ts`: composizione della ricerca
- `src/components/catalog-search-dialog.tsx`: messaggi mostrati

## Lavoro sul codice

1. Disegna il percorso di una ricerca con due risultati. Segna dove un errore interrompe il programma.
2. Scegli una promessa per la ricerca: tutti i risultati o un insieme parziale dichiarato. Scrivi cosa dovrebbe vedere l'utente se un dettaglio RAWG non arriva.
3. Cambia programma e UI solo se la promessa scelta richiede un comportamento diverso. Conserva il limite di quattro richieste concorrenti.
4. Non nascondere un errore che rende inaffidabile l'intera risposta del catalogo.

## Come verificare

- La ricerca demo trova Hades, Celeste e Dead Cells.
- Un dettaglio RAWG fallito produce il risultato o l'errore che hai deciso.
- Lint e typecheck passano.

## Cosa impari di Effect

`Effect.forEach` controlla la concorrenza, ma il punto in cui gestisci l'errore decide se fallisce una voce o l'intera ricerca. Il canale d'errore rende visibile questa scelta.

## Domanda per la review

Quale informazione manca alla UI se mostri risultati parziali come una normale lista completa?
