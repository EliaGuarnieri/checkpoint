# 03. Persistenza e risultato veritiero

## Situazione

`addManualGame` aggiorna il gioco di catalogo e poi inserisce la voce personale. Le due azioni non condividono la stessa transazione SQL. Se la seconda fallisce, il gioco rimane nel database senza una voce di libreria, mentre la risposta HTTP segnala un errore.

## Codice da leggere

- `src/modules/library/repository-live.ts`: `upsertCatalogGame` e `addManualGame`
- `src/app/api/library/route.ts`
- `src/infrastructure/http.ts`
- `src/components/catalog-search-dialog.tsx`

## Lavoro sul codice

1. Traccia cosa rimane nel database se l'inserimento della voce fallisce dopo l'aggiornamento del catalogo.
2. Decidi se le due scritture devono essere atomiche o se lo snapshot del catalogo può sopravvivere da solo. Motiva la scelta con il significato di Game e Library entry nel glossario.
3. Adegua repository e risposta solo dove il codice contraddice la promessa scelta.
4. Verifica che una seconda aggiunta non sovrascriva i dati personali.

## Come verificare

- Un errore simulato dopo la prima scrittura lascia lo stato previsto.
- Una richiesta ripetuta non duplica la voce e non cambia voto o nota.
- La risposta HTTP descrive ciò che è accaduto.

## Cosa impari di Effect

La sequenza di due `Effect` non è una transazione SQL. Un errore nel secondo passaggio non annulla il primo; il confine della transazione va scelto in base alla regola del dominio.

## Domanda per la review

Il gioco di catalogo senza voce personale è un dato valido per Checkpoint?
