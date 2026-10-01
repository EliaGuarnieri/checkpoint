# Skill condivise del progetto

Le skill sono salvate in `.agents/skills/` e distribuite con il repository. Codex le rileva da questa cartella; sono disponibili dal turno successivo all'installazione. Per gli altri assistenti, configurare il caricamento da questa cartella secondo le loro convenzioni.

## Fonti

- [AI Hero / Matt Pocock](https://www.aihero.dev/skills): 31 skill dalle cartelle stabili `engineering`, `productivity` e `misc` di [mattpocock/skills](https://github.com/mattpocock/skills), versione 1.2.3, commit `d81f3a183412e71a5b1e84ca21bc1a35eea03a60`. Escluse le bozze in `in-progress` e i contenuti deprecati.
- [Impeccable](https://impeccable.style/): versione 4.4.0, commit `c74755d920985f7a92cef691ca970ba95f90126e` di [pbakaus/impeccable](https://github.com/pbakaus/impeccable). Installata la distribuzione per Codex da `.agents/skills/impeccable`, completa di riferimenti, agenti e launcher.

`skills-lock.json` registra fonti, percorsi e hash nel formato del CLI Skills. Le skill shadcn e Supabase già presenti sono conservate; `migrate-radix-to-base` è stata rimossa.

## Uso e aggiornamenti

Invocare una skill per nome, ad esempio `$tdd`, `$research` o `$impeccable`. Il progetto ha già le convenzioni per issue tracker, triage e dominio in `AGENTS.md` e `docs/agents/`. L'obiettivo didattico su Effect resta definito in `AGENTS.md`.

Per controllare e aggiornare le skill, dalla radice del repository:

```bash
npx skills@latest check
npx skills@latest update
```

Dopo un aggiornamento, verificare il diff delle skill e del lockfile e includerlo nel commit. Un clone riceve i file già installati e non richiede una nuova installazione delle skill.

Il launcher Impeccable può scaricare il proprio eseguibile al primo utilizzo nella cache personale `~/.impeccable/bin/`. L'installazione delle skill non ha eseguito il launcher né aggiunto hook.

Le licenze originali sono conservate in [aihero-MIT.txt](licenses/aihero-MIT.txt) e [impeccable-Apache-2.0.txt](licenses/impeccable-Apache-2.0.txt).
