---
name: Checkpoint
description: Un archivio personale di videogiochi, chiaro e calmo, guidato dalle copertine.
colors:
  background-light: "oklch(1 0 0)"
  foreground-light: "oklch(0.145 0.008 326)"
  card-light: "oklch(1 0 0)"
  primary-light: "oklch(0.518 0.253 323.949)"
  primary-foreground-light: "oklch(0.977 0.017 320.058)"
  secondary-light: "oklch(0.967 0.001 286.375)"
  secondary-foreground-light: "oklch(0.21 0.006 285.885)"
  muted-light: "oklch(0.96 0.003 325.6)"
  muted-foreground-light: "oklch(0.542 0.034 322.5)"
  border-light: "oklch(0.922 0.005 325.62)"
  background-dark: "oklch(0.145 0.008 326)"
  foreground-dark: "oklch(0.985 0 0)"
  card-dark: "oklch(0.212 0.019 322.12)"
  primary-dark: "oklch(0.452 0.211 324.591)"
  secondary-dark: "oklch(0.274 0.006 286.033)"
  muted-dark: "oklch(0.263 0.024 320.12)"
  muted-foreground-dark: "oklch(0.711 0.019 323.02)"
  border-dark: "oklch(1 0 0 / 10%)"
typography:
  display:
    fontFamily: "Geist, sans-serif"
    fontWeight: 600
    lineHeight: 1.25
  title:
    fontFamily: "Geist, sans-serif"
    fontWeight: 600
  body:
    fontFamily: "Geist, sans-serif"
  mono:
    fontFamily: "Geist Mono, monospace"
rounded:
  control: "0.625rem"
  card: "0.875rem"
spacing:
  card-content: "1.25rem"
  grid-gap: "1.5rem"
components:
  button-primary-light:
    backgroundColor: "{colors.primary-light}"
    textColor: "{colors.primary-foreground-light}"
    rounded: "{rounded.control}"
    height: "2rem"
  button-primary-dark:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.primary-foreground-light}"
    rounded: "{rounded.control}"
    height: "2rem"
  badge-secondary-light:
    backgroundColor: "{colors.secondary-light}"
    textColor: "{colors.secondary-foreground-light}"
    height: "1.25rem"
  badge-secondary-dark:
    backgroundColor: "{colors.secondary-dark}"
    textColor: "{colors.foreground-dark}"
    height: "1.25rem"
  library-card-light:
    backgroundColor: "{colors.card-light}"
    textColor: "{colors.foreground-light}"
    rounded: "{rounded.card}"
  library-card-dark:
    backgroundColor: "{colors.card-dark}"
    textColor: "{colors.foreground-dark}"
    rounded: "{rounded.card}"
---

# Design System: Checkpoint

## Overview

**Creative North Star: "L'archivio personale dei giochi"**

Checkpoint è un archivio chiaro e calmo: le copertine danno carattere alla collezione, mentre la struttura resta discreta. Titoli, stato e voto si leggono rapidamente. Il magenta segnala le azioni principali e pochi dettagli del marchio; non compete con le immagini dei giochi.

Il simbolo in src/app/icon.svg — una C aperta attorno a un rombo — appare nell'header e come icona del sito. Il nome nell'header è testo Geist, così eredita il colore del tema. Il tema iniziale è scuro; il selettore permette di passare al tema chiaro. Il brandkit in docs/brand/checkpoint-brandkit.png documenta il concept, ma le sue schermate sono illustrative: l'implementazione corrente è la fonte per layout e componenti.

**Key Characteristics:**

- Copertine ampie e metadati personali facili da scandire.
- Palette semantica chiara e scura, con un solo accento magenta.
- Controlli sobri, angoli arrotondati e interazioni precise.
- Geist per interfaccia e titoli; Geist Mono solo dove serve un monospace.

## Colors

src/styles/globals.css è la fonte normativa delle variabili semantiche; il frontmatter ne registra i valori principali, senza creare una seconda palette. Le utility Tailwind consumano ruoli come background, foreground, card, primary, secondary, muted, border, ring e destructive. Il tema scuro viene applicato inizialmente da src/app/layout.tsx.

### Primary

- **Checkpoint magenta** (primary-light, primary-dark): pulsanti principali, collegamenti di rilievo, punto nel titolo della libreria e indicatore del selettore tema. Il testo sopra l'accento usa primary-foreground-light in entrambi i temi.

### Neutral

- **Canvas e inchiostro** (background-*, foreground-*): base della pagina e testo ad alto contrasto.
- **Superficie scheda** (card-*): contenitori e card; nel tema scuro si distingue dal canvas con una lieve differenza tonale.
- **Grigio secondario** (secondary-*): badge di stato e cover di fallback, lasciando il magenta alle azioni e ai richiami.
- **Testo attenuato e separatori** (muted-*, border-*): metadati, testo di supporto, filtri e confini discreti.

**The Semantic Color Rule.** Aggiungi o modifica i colori in src/styles/globals.css; nei componenti usa i ruoli semantici, non valori locali.

## Typography

**Display e corpo:** Geist (src/app/layout.tsx, src/styles/typeset.css). **Monospace:** Geist Mono, per scorciatoie e dati che lo richiedono. La stessa famiglia per testo e titoli mantiene l'archivio compatto e leggibile.

- **Display:** titoli di pagina e di gioco semibold (36px su mobile, 48px da sm, 60px da lg; line-height 1.25), con tracking stretto. Il titolo della libreria usa 32px su mobile per affiancare l'azione di aggiunta.
- **Titolo di sezione:** semibold (24px, poi 30px da sm); i titoli delle card sono semibold (24px).
- **Corpo:** interfaccia e descrizioni soprattutto a 14px, con 16px per il testo introduttivo da sm; le descrizioni lunghe restano entro circa 65 caratteri per riga.
- **Etichetta e metadati:** 12–14px, spesso in muted-foreground; il voto usa numeri tabulari dove deve allinearsi.

**The One Typeface Rule.** Usa Geist per titoli e controlli; riserva Geist Mono a scorciatoie e dati. Non introdurre un font display separato.

## Layout

L'header e il contenuto condividono un contenitore centrato con larghezza massima di 1450px. Il padding laterale passa da 16px a 24px su sm e 40px su lg. Lo spazio verticale del contenuto passa da 32px a 40px e 48px. I gruppi principali usano un ritmo ampio; la griglia delle card usa 24px tra gli elementi.

La libreria presenta un'intestazione, filtri di stato e filtri avanzati, poi card con cover in rapporto 1.65:1. La griglia passa da una colonna a due su sm e tre su xl. Su mobile il titolo della libreria affianca l'azione di aggiunta, lasciando più spazio alla prima cover. Nel dettaglio, la cover precede il testo su mobile; da md la testata affianca i due. Editor personale e metadati diventano colonne da lg. L'header colloca la ricerca su una seconda riga negli schermi stretti e su una riga unica da lg.

**The Cover First Rule.** Lascia alle cover spazio sufficiente per identificare i giochi; mantieni stato, titolo e voto leggibili anche senza immagine.

## Elevation & Depth

Le superfici sono prevalentemente piatte: bordi sottili e differenze tonali separano card, campi e sezioni. La card della libreria si solleva di 4px e riceve shadow-xl al passaggio del puntatore (300ms); i pannelli di ricerca e filtro usano shadow-xl per staccarsi dal contenuto. Badge e cursore del tema usano shadow-sm. I componenti di base mantengono anelli di focus visibili, non ombre decorative permanenti.

**The Lift on Interaction Rule.** Tieni le card ferme a riposo; usa l'elevazione per hover e sovrapposizioni, rispettando prefers-reduced-motion per il movimento.

## Shapes

I controlli condivisi hanno angoli morbidi (10px); card, pannelli e testata del dettaglio usano angoli più ampi (14px). Badge e filtri di stato sono pillole. Le cover vengono ritagliate dal contenitore arrotondato; i separatori sono sottili e semantici. Il rombo del marchio resta un segno specifico dell'identità, non una forma da ripetere su ogni componente.

## Components

### Buttons

Il pulsante primario usa primary e primary-foreground; i controlli condivisi sono compatti (altezza base 32px, 28px small, 36px large). Outline, secondary, ghost, destructive e link usano le varianti esistenti in src/components/ui/button.tsx. Hover cambia la superficie; focus visibile aggiunge un anello di 3px; la pressione sposta il pulsante di 1px quando appropriato.

### Badges e filtri

I badge sono pillole alte 20px. Lo stato sulla cover usa la variante secondary, così il testo resta distinto dall'immagine senza usare l'accento principale. I filtri di stato compongono pulsanti compatti e mostrano il conteggio; il filtro scelto rimane riconoscibile dal suo stato, non solo dalla posizione.

### Cards e cover

La card della libreria ha cover ampia sopra un'area testuale con 20px di padding. Titolo e sviluppatore precedono una riga separata per voto e apertura. Il fallback della cover usa secondary e secondary-foreground. Le card condivise di shadcn usano card e un bordo ad anello sottile; non sostituiscono automaticamente la composizione della card di gioco.

### Inputs e ricerca

Input, select e textarea hanno bordo input, sfondo trasparente o leggermente tonale nel tema scuro, angoli da 10px e focus con bordo ring più anello di 3px. La ricerca globale è un input group alto 40px nell'header, con scorciatoia da tastiera; il pannello separa “Nella tua libreria” da “Risultati della ricerca”. Una voce già in libreria apre il dettaglio; un risultato nuovo offre l'aggiunta esplicita.

### Navigation e tema

L'header sticky porta simbolo, nome, ricerca e selettore chiaro/scuro. Link e risultati hanno focus visibile. Il selettore tema è una pillola con cursore che scorre in 250ms; il movimento viene disattivato quando l'utente preferisce animazioni ridotte.

**The Component Source Rule.** Componi layout e stati con utility Tailwind nei componenti; usa i controlli shadcn già presenti. globals.css resta dedicato a token e stili base.

## Do's and Don'ts

### Do:

- **Do** usa i token semantici per entrambi i temi e verifica il contrasto nelle superfici scure.
- **Do** lascia che le cover RAWG portino varietà cromatica, mantenendo il fallback leggibile.
- **Do** mantieni visibili hover, focus, errori e stati vuoti nei controlli condivisi.
- **Do** impila griglie e colonne ai breakpoint già usati quando lo spazio si restringe.

### Don't:

- **Don't** aggiungere selettori di pagina a src/styles/globals.css o colori esadecimali arbitrari nei componenti.
- **Don't** sostituire Geist con un font editoriale o usare Geist Mono come font decorativo.
- **Don't** trattare le schermate del brandkit o gli screenshot storici come fonte più recente del codice.
