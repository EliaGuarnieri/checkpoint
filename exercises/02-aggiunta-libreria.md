# 02. Aggiungere un gioco attendibile

## Situazione

La UI invia un oggetto `CatalogGame` completo a `POST /api/library`. Il server ne valida la forma con `Schema`, poi lo salva. Un client diverso può costruire un oggetto valido senza averlo ottenuto dal catalogo.

## Codice da leggere

- `src/components/catalog-search-dialog.tsx`
- `src/app/api/library/route.ts` e `src/infrastructure/api-schema.ts`
- `src/modules/catalog/service.ts` e `src/modules/library/service.ts`

## Lavoro sul codice

1. Separa l'intenzione del giocatore dai metadati che il server deve verificare.
2. Confronta due richieste possibili: inviare il gioco completo o solo un identificatore. Considera cosa accade se i metadati cambiano tra ricerca e aggiunta.
3. Scegli una richiesta minima e una verifica lato server. Se l'interfaccia del catalogo non permette di recuperare un gioco per ID, decidi come estenderla senza far dipendere la route da RAWG.
4. Mantieni l'aggiunta idempotente: ripetere il comando non cambia stato, voto o nota.

## Come verificare

- Dalla demo puoi aggiungere un gioco trovato nel catalogo.
- Una richiesta costruita a mano non diventa attendibile solo perché passa `CatalogGameSchema`.
- La stessa voce non compare due volte dopo richieste ripetute.

## Cosa impari di Effect

`Schema` verifica la struttura dell'input. `Context.Tag` dichiara il servizio da cui il programma può ottenere i fatti che il client non può attestare.

## Domanda per la review

Quale dato è una scelta dell'utente e quale richiede una verifica indipendente?
