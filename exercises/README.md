# Checkpoint: esercizi su Effect e sul diario

Queste schede usano i flussi che l'applicazione esegue oggi. Parti dal codice, scrivi la regola che vuoi proteggere e cambia un comportamento alla volta. Non serve creare una suite di test nuova per ogni scheda; usa i controlli esistenti e prova il percorso nella demo.

Per descrivere un programma Effect, indica sempre il valore che produce, gli errori previsti e le dipendenze richieste.

## Percorso

| Ordine | Esercizio                                                  | Focus                                     |
| ------ | ---------------------------------------------------------- | ----------------------------------------- |
| 01     | [Ricerca nel catalogo](01-ricerca-catalogo.md)             | `Effect.gen`, `forEach`, errori           |
| 02     | [Aggiunta alla libreria](02-aggiunta-libreria.md)          | `Schema`, dati attendibili, `Context.Tag` |
| 03     | [Persistenza e risultato](03-persistenza-libreria.md)      | sequenza, transazioni, errori             |
| 04     | [Libreria e snapshot](04-moduli-e-snapshot.md)             | `Layer`, interfacce, coerenza             |
| 05     | [Configurazione degli adapter](05-configurazione-layer.md) | configurazione, `Layer`                   |
| 06     | [Richieste RAWG](06-richieste-esterne.md)                  | `Schedule`, retry, risposta HTTP          |

Le schede contengono indizi e domande per la review, non soluzioni. Puoi fermarti dopo una scheda: ognuna riguarda una decisione leggibile nel codice.

## Verifiche

```bash
pnpm lint
pnpm typecheck
pnpm test
```

Consulta la [specifica](../docs/spec.md), il [vocabolario](../CONTEXT.md) e il [README](../README.md) quando una regola non è chiara.
