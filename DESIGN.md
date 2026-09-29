---
name: Checkpoint
description: Una libreria di videogiochi con copertine in primo piano, nel tema originale di Checkpoint.
colors:
  background-light: "oklch(1 0 0)"
  foreground-light: "oklch(0.145 0.008 326)"
  card-light: "oklch(1 0 0)"
  primary-light: "oklch(0.518 0.253 323.949)"
  primary-foreground-light: "oklch(0.977 0.017 320.058)"
  muted-light: "oklch(0.96 0.003 325.6)"
  muted-foreground-light: "oklch(0.542 0.034 322.5)"
  border-light: "oklch(0.922 0.005 325.62)"
  background-dark: "oklch(0.145 0.008 326)"
  foreground-dark: "oklch(0.985 0 0)"
  card-dark: "oklch(0.212 0.019 322.12)"
  primary-dark: "oklch(0.452 0.211 324.591)"
  muted-dark: "oklch(0.263 0.024 320.12)"
  muted-foreground-dark: "oklch(0.711 0.019 323.02)"
  border-dark: "oklch(1 0 0 / 10%)"
typography:
  body:
    fontFamily: "Geist, sans-serif"
  heading:
    fontFamily: "Geist, sans-serif"
  mono:
    fontFamily: "Geist Mono, monospace"
rounded:
  base: "0.625rem"
components:
  button-primary:
    backgroundColor: "{colors.primary-light}"
    textColor: "{colors.primary-foreground-light}"
    rounded: "{rounded.base}"
  library-card:
    backgroundColor: "{colors.card-light}"
    textColor: "{colors.foreground-light}"
---

# Design di Checkpoint

## Direzione

La libreria è un archivio da esplorare: copertine RAWG grandi, titolo e stato leggibili, filtri compatti. La pagina del gioco separa il checkpoint personale dai metadati del catalogo. La ricerca nell'header mostra insieme i giochi già presenti e i risultati RAWG: apre i primi e propone di aggiungere i secondi.

## Fonte dei token

`src/styles/globals.css` contiene **solo** gli import, il collegamento dei token Tailwind/shadcn, le variabili semantiche originali per tema chiaro e scuro e gli stili base preesistenti. Non aggiungere classi specifiche delle pagine in quel file. Non sostituire la palette originale con colori locali o valori esadecimali nei componenti.

Usare i token semantici di shadcn tramite utility Tailwind: `bg-background`, `text-foreground`, `bg-card`, `text-card-foreground`, `bg-primary`, `text-primary-foreground`, `bg-muted`, `text-muted-foreground`, `border-border`, `text-destructive` e `ring-ring`. I colori precisi dei due temi sono definiti in `src/styles/globals.css`; i valori qui sopra descrivono i token principali e non creano un secondo tema. Il tema iniziale resta scuro, come in `src/app/layout.tsx`.

## Tipografia

Geist è il font di corpo **e** titoli. Geist Mono è riservato a scorciatoie e dati che richiedono un monospace. I font sono caricati da `next/font/google` in `src/app/layout.tsx` e collegati a `typeset-docs` in `src/styles/typeset.css`. La gerarchia usa dimensioni, peso e spaziatura di Tailwind; non introduce un font editoriale separato.

## Marchio

`src/app/icon.svg` contiene il simbolo Checkpoint: una C aperta che inquadra un rombo. La stessa risorsa compare nell'header e come icona del sito. Nell'header il nome resta testo Geist, così segue i colori semantici dei temi. `docs/brand/checkpoint-brandkit.png` documenta il concept; le sue schermate sono illustrative.

## Implementazione delle pagine

- Comporre layout, spazi, griglie, responsive, hover e focus direttamente con utility Tailwind nei componenti. Evitare nuovi selettori in `globals.css` e colori arbitrari.
- Usare i componenti shadcn già presenti per pulsanti, badge, input, select, field, alert, skeleton e textarea. I componenti condivisi mantengono stati e token coerenti.
- Lasciare che le cover RAWG forniscano la varietà cromatica delle schede. Il fallback della cover usa `secondary` e `secondary-foreground`.
- Nella libreria mostrare la collezione subito, con copertine grandi e filtri accessibili. Su schermi stretti la griglia e l'header si impilano.
- Nel dettaglio mostrare una cover ampia, stato e voto personali, poi editor e metadati in colonne che si impilano su mobile.
- La ricerca globale mantiene le due sezioni “Nella tua libreria” e “Catalogo RAWG”; un risultato già posseduto apre il dettaglio, uno nuovo può essere aggiunto.

## Riferimenti

- [Tailwind CSS: utility classes](https://tailwindcss.com/docs/styling-with-utility-classes)
- [shadcn/ui: theming](https://ui.shadcn.com/docs/theming)
