# Strumenti di redazione in locale

Telemetria e generatore di grafiche non stanno più sul sito pubblicato:
girano sul computer. Erano strumenti interni — nessun link li raggiungeva e
una password li proteggeva — ma vivevano comunque su Vercel, con 31 MB di
dati versionati e ricostruiti a ogni deploy.

Online adesso rispondono 404. Niente è stato distrutto: è solo spento.

## Avviarli

Doppio clic su **`strumenti-locali.bat`**, nella cartella `lastcorner`.

Si apre una finestra nera (è il sito che gira sul tuo computer) e, dopo
qualche secondo, il browser sulla telemetria. Gli indirizzi sono:

- telemetria — <http://localhost:3000/telemetria>
- grafiche — <http://localhost:3000/grafiche>

Per chiudere, chiudi la finestra nera intitolata "Lastcorner locale".

Mentre gira, tutto il sito è navigabile in locale: comodo per vedere una
modifica prima di metterla online.

## Elaborare un weekend di telemetria

Prima girava su GitHub a orari fissi. Adesso lo lanci tu, dalla cartella
`lastcorner`:

```
python scripts\telemetry\process_session.py 2026 13
```

dove `2026` è l'anno e `13` il numero del round. In alternativa:

```
python scripts\telemetry\process_session.py --auto
```

che elabora l'ultimo weekend concluso.

Lo script usa solo la libreria standard di Python — non c'è niente da
installare — e prende i dati dall'API pubblica OpenF1. Scrive in
`public/telemetria-data/`. Finito, ricarica la pagina telemetria.

**Metterà una decina di minuti, ed è normale.** OpenF1 consente 30 richieste
al minuto sul piano gratuito, cioè una ogni due secondi, e un weekend
richiede qualche centinaio di chiamate. Lo script rispetta quel ritmo da
solo: se lo superasse, l'API risponderebbe "troppe richieste" e i giri di
quei piloti andrebbero persi in silenzio.

Alla fine stampa un riepilogo. Se compare `(N giri persi)` accanto a una
sessione, quei giri non hanno telemetria: rilancia lo script per quel round
e vedrai il numero scendere.

## Dove stanno i dati, e cosa succede se si perdono

`public/telemetria-data/` non è più versionato: quei file esistono solo sul
tuo disco. Non è un problema — si rigenerano lanciando di nuovo lo script
per i round che servono.

`public/grafiche/` invece **resta versionato**, di proposito: il template è
un export da Photoshop e non si rigenera con un comando. Se il disco si
rompe, quello lo recuperi dal repository.

## Come sono spenti online

`lib/strumenti.ts` legge la variabile `STRUMENTI_LOCALI`. In locale il file
`.env.local` la mette a `true` (ci pensa il `.bat`); su Vercel non esiste,
quindi le pagine chiamano `notFound()` e non finiscono nemmeno nel sito
compilato.

Per riaccenderli online basterebbe aggiungere `STRUMENTI_LOCALI=true` fra le
variabili d'ambiente del progetto su Vercel. Da fare solo sapendo che
tornerebbero a pesare sui consumi.

## Cosa è stato rimosso

- il workflow GitHub Actions che elaborava e committava i dati
- `/api/telemetria-run` e `/api/telemetria-login`, con la pagina di login
- il pannello che avviava la pipeline dal sito
- il controllo password nel middleware, che calcolava uno SHA-256 a ogni
  richiesta protetta

Se ricompaiono richieste al vecchio endpoint della pipeline, arrivano da un
segnalibro: non esiste più nulla da avviare da remoto.
