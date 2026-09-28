# 04. Libreria, catalogo e snapshot

## Situazione

La ricerca chiama `searchByTitle` e poi `refreshCatalogGames`. Il repository live salva uno snapshot per tutti i risultati; quello in memoria aggiorna soltanto le voci già presenti. Le due implementazioni possono quindi mostrare comportamenti diversi durante l'esplorazione del catalogo.

## Codice da leggere

- `src/app/api/catalog/search/route.ts`
- `src/modules/library/service.ts`
- `src/modules/library/repository-live.ts` e `repository-memory.ts`
- `CONTEXT.md`: Game, Catalog e Library entry

## Lavoro sul codice

1. Segui ricerca e aggiunta. Segna il punto in cui nasce un Game locale e quello in cui nasce una Library entry.
2. Decidi quale promessa deve fare `refreshCatalogGames` a tutti gli adapter. La ricerca può aggiornare metadati senza aggiungere un gioco alla libreria?
3. Allinea gli adapter o restringi l'interfaccia se la promessa attuale è troppo ampia.
4. Mantieni intatti stato, voto e nota quando cambiano i metadati.

## Come verificare

- Ricerca e aggiunta hanno lo stesso significato in demo e con PostgreSQL.
- Cercare un gioco non crea una voce personale.
- Aggiornare il catalogo non cambia i campi personali.

## Cosa impari di Effect

`Context.Tag` dichiara la promessa del servizio e `Layer` sceglie l'implementazione. La sostituzione funziona solo se gli adapter rispettano lo stesso comportamento osservabile.

## Domanda per la review

Quale conoscenza del database dovrebbe restare dentro il repository?
