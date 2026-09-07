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

Lo script prende i dati con **FastF1**, che va installato una volta sola:

```
pip install fastf1
```

Scrive in `public/telemetria-data/`. Finito, ricarica la pagina telemetria.

La prima volta che elabori un weekend il download è la parte lenta; da lì in
poi FastF1 tiene tutto in `scripts/telemetry/.cache-fastf1/` (una cinquantina
di megabyte a sessione, non versionati) e **rilanciare lo stesso round è
quasi immediato**. Quindi, se qualcosa va storto, rilanciare non costa nulla.

Alla fine stampa un riepilogo. Se compare `(N giri persi)` accanto a una
sessione, quei giri non hanno telemetria nella fonte: rilanciare non li fa
comparire, è un buco nei dati F1.

### Perché FastF1 e non più OpenF1

Prima i dati venivano da OpenF1, che limita a 30 richieste al minuto: un
weekend erano ~300 chiamate e una decina di minuti di attesa.

Ma il motivo vero è un altro. OpenF1 data l'inizio del giro con un errore
diverso per ogni pilota — sul giro di prova a Monza 0,10 s per Leclerc e
0,16 s per Russell. Quei 0,06 s di differenza, a 84 m/s sul rettilineo del
traguardo, sono cinque metri di sfasamento infilati all'inizio del giro; e
cinque metri alla prima variante, dove le macchine vanno a 20 m/s, valgono un
quarto di secondo di delta che non è mai esistito.

Misurato sullo stesso confronto, con i tempi di settore come metro:

|                    | escursione del delta | picco alla Variante |
| ------------------ | -------------------- | ------------------- |
| OpenF1             | 0,571 s              | −0,562 s            |
| FastF1             | 0,404 s              | −0,391 s            |

Spostando i tempi OpenF1 di quei 0,06 s si ottiene la curva FastF1 quasi al
millesimo: la differenza è tutta lì.

Resta un limite che nessuna elaborazione toglie: a una curva da 70 km/h il
delta conserva un'incertezza di circa ±0,15 s, perché la distanza non è un
dato misurato da nessuna fonte — si ricava integrando la velocità. Ai
traguardi di settore invece siamo esatti a ±0,02 s, ed è per questo che ora
i tempi di settore finiscono in `laps.json`: sono il riferimento con cui
verificare il grafico.

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
