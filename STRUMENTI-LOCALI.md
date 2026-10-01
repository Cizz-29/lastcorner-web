# Strumenti di redazione

La **telemetria** è pubblica dal 1° ottobre 2026, su
<https://lastcorner.net/telemetria>. Le pagine si generano al deploy dai file
JSON in `public/telemetria-data/`, che sono **versionati nel repository**
(circa 9 MB a weekend con i giri di gara).

**Dal 1° ottobre 2026 i dati arrivano da soli**: un workflow di GitHub
Actions, dopo ogni sessione, scarica i dati nuovi, li committa e il deploy
li pubblica (vedi "Aggiornamento automatico" sotto). Lo script sul PC resta
per rielaborare un weekend a mano o se l'automatico si inceppa.

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

## Aggiornamento automatico

`.github/workflows/telemetria.yml` gira ogni ora da venerdì a lunedì (UTC).
Ogni volta `scripts/telemetry/serve_aggiornare.py` confronta il calendario
(Jolpica) con `public/telemetria-data/index.json`: se una sessione è finita
da almeno 40 minuti e sul sito non c'è ancora, la elabora **da sola** (le
sessioni dei giorni prima non si toccano), committa come `telemetria-bot` e
Vercel fa il deploy. Se l'archivio F1 non ha ancora i dati non succede
nulla e si riprova all'ora dopo, per 36 ore al massimo.

In pratica: un'ora o due dopo la fine di ogni sessione i dati sono online.

**Conseguenza importante**: nei weekend di gara il bot fa commit su `main`.
Prima di ogni tuo push:

```
git pull --rebase
```

Altrimenti il push viene rifiutato ("rejected, fetch first").

Per lanciarlo a mano: GitHub → Actions → **Telemetria** → *Run workflow*,
con il round (es. `16`) ed eventualmente le sole sessioni (es. `Q,R`).

Se su GitHub il job fallisce scaricando i dati (l'archivio F1 a volte
blocca gli indirizzi dei server), si torna allo script sul PC qui sotto.

## Elaborare un weekend di telemetria a mano

Lo lanci tu, dalla cartella `lastcorner-web`:

```
python scripts\telemetry\process_session.py 2026 13
```

dove `2026` è l'anno e `13` il numero del round. In alternativa:

```
python scripts\telemetry\process_session.py --auto
```

che elabora l'ultimo weekend concluso. Oppure solo alcune sessioni, lasciando
com'è il resto del weekend:

```
python scripts\telemetry\process_session.py 2026 16 --sessioni Q,R
```

oppure più round di fila: `2026 1-15`.

### Cosa si salva, sessione per sessione

- **libere**: passo, e telemetria dei 3 giri più veloci di ogni pilota;
- **qualifica e qualifica sprint**: passo, e telemetria dei 5 (4) giri migliori;
- **gara e sprint**: passo, e telemetria di **tutti** i giri di tutti i
  piloti, con 250 campioni a giro invece di 350 per tenere il file di un
  pilota sotto i 100 KB compressi. Sul sito la gara si apre sul passo; la
  telemetria dei singoli giri è a un clic.

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
quando lo mette a confronto (40 KB circa a pilota, 200 KB in gara: compressi
dalla CDN diventano un quarto).

I file `tel/` non entrano nelle funzioni di Vercel: `next.config.js` li
esclude (`outputFileTracingExcludes`). Senza, Next ce li copiava tutti, e con
i giri di gara si sarebbe superato il tetto di 250 MB a funzione.

### La pista e le curve

`track.json` contiene il disegno del tracciato (dal giro più veloce della
qualifica; durante il weekend, prima della qualifica, da quello delle libere,
e viene sostituito quando arriva la qualifica) e la posizione delle curve, che FastF1 legge da MultiViewer. Per
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

- il vecchio workflow GitHub Actions basato su OpenF1 (sostituito, dal
  1° ottobre 2026, da quello nuovo con FastF1 descritto sopra)
- `/api/telemetria-run` e `/api/telemetria-login`, con la pagina di login
- il pannello che avviava la pipeline dal sito

Se ricompaiono richieste al vecchio endpoint della pipeline, arrivano da un
segnalibro: non esiste più nulla da avviare da remoto.
