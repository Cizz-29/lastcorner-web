# Strumenti di redazione

La **telemetria** è pubblica dal 1° ottobre 2026, su
<https://lastcorner.net/telemetria>. Le pagine si generano al deploy dai file
JSON in `public/telemetria-data/`, che ora sono **versionati nel repository**
(circa 3 MB a weekend): li produci tu sul PC con lo script Python e li
pubblichi con un push, come il codice.

Il **generatore di grafiche** sta a <https://lastcorner.net/grafiche>,
protetto da password (vedi sotto). È tutto codice di browser: la foto non
viene caricata da nessuna parte e l'unico peso è il template da 1,4 MB,
scaricato solo da chi apre la pagina.

## Vedere il sito in locale

Doppio clic su **`strumenti-locali.bat`**, nella cartella `lastcorner-web`.
Si apre una finestra nera (è il sito che gira sul tuo computer) e, dopo
qualche secondo, il browser. Serve per controllare un weekend di telemetria
appena elaborato prima di pubblicarlo:

- telemetria — <http://localhost:3000/telemetria>
- grafiche — <http://localhost:3000/grafiche>

Per chiudere, chiudi la finestra nera intitolata "Lastcorner locale".

## Elaborare un weekend di telemetria

Lo lanci tu, dalla cartella `lastcorner-web`:

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

## Pubblicare un weekend

Lo script scrive in `public/telemetria-data/`: il round nuovo, il disegno
della pista (`track.json`) e l'indice aggiornato. Per metterli online basta
il solito push:

```
git add public/telemetria-data
git commit -m "Telemetria: GP di ..."
git push
```

Al deploy Vercel genera la pagina del weekend nuovo e la aggiunge alla
sitemap. Il browser dei lettori scarica la telemetria di un pilota solo
quando lo mette a confronto (40 KB circa a pilota).

### La pista e le curve

`track.json` contiene il disegno del tracciato (dal giro più veloce della
qualifica) e la posizione delle curve, che FastF1 legge da MultiViewer. Per
i circuiti nuovi MultiViewer può non avere ancora le curve — succede col
Madring di Madrid: la pista si vede lo stesso, senza numeri.

Per rigenerare solo le piste, senza toccare il resto:

```
python scripts\telemetry\process_session.py 2026 1-15 --solo-tracciato
```

### La cache di FastF1

Sta in `scripts/telemetry/.cache-fastf1/` (non versionata). Se la vecchia
cartella `lastcorner` ne ha già una, spostala qui dentro: rielaborare i
round già scaricati diventa quasi immediato.

## Telemetria online: cosa costa

Le pagine sono statiche (una per weekend, generate al deploy) e i dati sono
file statici serviti dalla CDN di Vercel: nessuna funzione gira quando un
lettore apre un confronto. Gli annunci AdSense sulla telemetria sono spenti
(vedi `components/AdsenseScript.tsx`): gli annunci automatici finirebbero
fra un grafico e l'altro.

L'interruttore `STRUMENTI_LOCALI` e `lib/strumenti.ts` non esistono più.

## La password delle grafiche

Su Vercel serve la variabile d'ambiente **`GRAFICHE_PASSWORD`**. Il middleware
usa l'autenticazione HTTP del browser: al primo accesso il telefono chiede
utente e password, poi se le ricorda. Nel campo utente si può scrivere
qualsiasi cosa — conta solo la password, perché è una password condivisa e
non un account.

Se la variabile non è configurata la pagina resta aperta: è quello che
succede in locale, dove non serve.

Rispetto al login che c'era prima non c'è nessuna pagina di login, nessuna
route API e nessun cookie, e soprattutto niente SHA-256 ricalcolato a ogni
richiesta protetta: solo un confronto fra due stringhe.

## Cosa è stato rimosso

- il workflow GitHub Actions che elaborava e committava i dati
- `/api/telemetria-run` e `/api/telemetria-login`, con la pagina di login
- il pannello che avviava la pipeline dal sito

Se ricompaiono richieste al vecchio endpoint della pipeline, arrivano da un
segnalibro: non esiste più nulla da avviare da remoto.
