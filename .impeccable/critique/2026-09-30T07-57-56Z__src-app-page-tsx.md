---
target: pagina libreria src/app/page.tsx
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:/Users/Elia_Guarnieri/Projects/checkpoint/src/app/page.tsx"
target_fingerprint: "sha256:77802be1c0c803b9775fda67e035267cde40ece39189752b70bcd096f71ed560"
target_path: /Users/Elia_Guarnieri/Projects/checkpoint/src/app/page.tsx
timestamp: 2026-09-30T07-57-56Z
slug: src-app-page-tsx
---
# Critica della libreria — `src/app/page.tsx`

Metodo: due valutazioni indipendenti (design e controllo deterministico). La pagina è resa da `src/components/library-view.tsx`; modalità Operate. Vista live a 1280×720 con quattro giochi.

## Salute dell'interfaccia

| # | Euristica di Nielsen | Punteggio | Evidenza principale |
|---|---|---:|---|
| 1 | Visibilità dello stato | 3/4 | Skeleton e stato selezionato chiari; aggiunta in corso poco evidente. |
| 2 | Corrispondenza col mondo reale | 3/4 | Lessico videoludico chiaro, ma “Publisher” e sezione catalogo generica. |
| 3 | Controllo e libertà | 2/4 | “Azzera filtri” lascia attivo lo stato. |
| 4 | Coerenza | 3/4 | Componenti e token coerenti; il reset rompe la promessa dell'etichetta. |
| 5 | Prevenzione degli errori | 2/4 | Un risultato RAWG omonimo si aggiunge subito senza verifica. |
| 6 | Riconoscimento | 2/4 | I valori dei filtri avanzati spariscono dietro un badge numerico. |
| 7 | Efficienza | 3/4 | Ricerca globale via Cmd/Ctrl+K, frecce e Invio. |
| 8 | Estetica e minimalismo | 3/4 | Cover efficaci; nomi delle schede sotto la prima piega a 1280×720. |
| 9 | Recupero dagli errori | 2/4 | Messaggi comprensibili, ma manca un'azione di riprova locale. |
| 10 | Aiuto | 1/4 | Solo l'indicazione dei due caratteri per la ricerca nel catalogo. |
| **Totale** | | **24/40** | **Accettabile: i flussi principali funzionano, ma richiedono chiarimenti.** |

## Specificità e impressione

La pagina si riconosce come diario videoludico personale: copertine RAWG grandi, stato di gioco, voto personale, marchio Checkpoint e testi italiani. La struttura potrebbe servire anche un'altra libreria multimediale; la distinzione tra catalogo e record personale è la sua opportunità più forte, ancora poco evidente nel flusso di aggiunta. L'apertura è gradevole, ma al primo viewport l'utente vede soprattutto copertine e deve scorrere per leggere i titoli.

Il controllo `impeccable detect --json` su `page.tsx`, `library-view.tsx`, `app-shell.tsx`, `game-cover.tsx` e `global-search.tsx` restituisce **0 rilievi**. Non sono emersi falsi positivi. La scansione meccanica non intercetta le ambiguità di flusso e di contenuto rilevate nella revisione. La pagina live è stata ispezionata, ma l'API del browser non consente l'iniezione mutabile: nessun overlay diagnostico è visibile.

## Cosa funziona

- Le cover e i badge di stato danno identità alla collezione, con una palette scura che lascia risaltare le immagini (`library-view.tsx:298`).
- Skeleton, stato vuoto e azione per recuperare da una ricerca senza risultati evitano una pagina muta (`library-view.tsx:282`, `library-view.tsx:356`).
- La ricerca globale distingue già i giochi posseduti dai risultati catalogo e offre un percorso rapido da tastiera (`global-search.tsx:180`, `global-search.tsx:288`).

## Problemi prioritari

1. **P1 — “Azzera filtri” non azzera tutti i filtri.** Il pulsante nel pannello cancella testo e voto minimo, ma conserva lo stato selezionato (`library-view.tsx:164`, `library-view.tsx:265`). Verificato live scegliendo “In corso”. Chi non vede più giochi può credere che manchino. Fare un reset unico di stato e filtri avanzati, oppure chiamare il comando “Azzera filtri avanzati” e offrirne uno globale. Comando: `$impeccable harden`.
2. **P2 — Aggiunta dal catalogo troppo implicita.** “Aggiungi un gioco” sposta solo il focus alla ricerca nell'header (`library-view.tsx:103`, `library-view.tsx:117`); la sezione RAWG è chiamata genericamente “Risultati della ricerca” e un clic su una voce la aggiunge subito (`global-search.tsx:359`, `global-search.tsx:375`). La query “Hades” mostra titoli molto simili. Rendere esplicite origine e conseguenza dell'azione, distinguendo “Apri nella tua libreria” da “Aggiungi dal catalogo RAWG”; per omonimi, mostrare anno e dati distintivi prima della scelta. Comando: `$impeccable clarify`.
3. **P2 — Il conteggio non riflette la vista filtrata.** “4 giochi” e i numeri nelle schede di stato contano tutta la libreria (`library-view.tsx:132`, `library-view.tsx:166`), anche quando i filtri lasciano zero schede (`library-view.tsx:74`). Mostrare “N di M giochi” accanto alla collezione e chiarire se i conteggi per stato sono globali o compatibili con gli altri filtri. Comando: `$impeccable clarify`.
4. **P2 — I titoli arrivano troppo tardi nel primo viewport.** A 1280×720 la prima riga mostra soprattutto le cover; i nomi sono sotto la piega. Intro, spazi e immagine ampia (`library-view.tsx:105`, `library-view.tsx:298`) rendono meno veloce ritrovare un gioco. Ridurre l'altezza prima della griglia o portare titolo e stato più vicino alla parte alta della scheda, preservando il ruolo delle cover. Comando: `$impeccable layout`.
5. **P2 — Gli errori non offrono un recupero immediato.** La libreria chiede di ricaricare l'intera pagina (`library-view.tsx:282`); la ricerca catalogo dice di riprovare più tardi (`global-search.tsx:365`). Aggiungere un'azione “Riprova” accanto all'errore che richiami la query; preservare filtri e testo inserito. Comando: `$impeccable harden`.

## Carico cognitivo e percorso

Cinque stati visibili in una sola riga superano la soglia di quattro opzioni semplici; possono essere utili, ma la riga va mantenuta chiaramente distinguibile. Il pannello avanzato riduce l'ingombro, però quando si chiude mostra solo il numero dei criteri attivi: richiede di ricordarne i valori. L'utente parte da una collezione visivamente forte; il momento debole arriva quando “Aggiungi” trasferisce il focus altrove e risultati simili possono essere aggiunti con un solo gesto. L'esito porta al dettaglio del gioco, ma la lista non conferma quale voce sia stata scelta.

## Verifica per persona

- **Jordan, prima visita:** due campi cercano in ambiti diversi; “Aggiungi” non apre un flusso esplicito e può sembrare inattivo.
- **Sam, uso assistivo:** i filtri chiusi conservano i criteri senza esporne i valori, oltre al badge con il numero; è difficile capire cosa limita i risultati.
- **Riley, casi limite:** il reset incompleto e i titoli RAWG simili aumentano il rischio di selezione errata.
- **Casey, mobile:** la distanza fra inizio pagina e identità delle schede potrebbe pesare sul primo viewport; è un'inferenza, perché la verifica live è stata desktop.

## Note minori e domande di progetto

“Publisher” e l'attribuzione RAWG restano in inglese in una UI italiana. Ricerca globale e pannello filtri possono restare aperti contemporaneamente. Vale la pena chiedersi: la ricerca per titolo della libreria dovrebbe essere visibile accanto agli stati, lasciando la ricerca globale chiaramente dedicata a catalogo e aggiunta? Per questa pagina conta di più riconoscere una cover o leggere titolo e voto senza scorrere? Quale segnale deve confermare che il reset ha riportato davvero l'intera libreria?
