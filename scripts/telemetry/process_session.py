"""Genera i dati della telemetria per un weekend di Formula 1.

    python scripts\\telemetry\\process_session.py 2026 13
    python scripts\\telemetry\\process_session.py 2026 monza
    python scripts\\telemetry\\process_session.py --auto
    python scripts\\telemetry\\process_session.py 2026 13 --solo-tracciato
    python scripts\\telemetry\\process_session.py 2026 13 --sessioni FP2,Q

Scrive in public/telemetria-data/. Serve fastf1:

    pip install fastf1

## Perche' FastF1 e non piu' OpenF1

Le due fonti servono gli stessi campioni di velocita' (allineandoli lo scarto
scende a 0,17 km/h di deviazione standard), ma OpenF1 data l'inizio del giro
con un errore diverso per ogni pilota: sul giro di prova a Monza 0,10 s per
Leclerc e 0,16 s per Russell. Quei 0,06 s di differenza, a 84 m/s sul
rettilineo del traguardo, sono cinque metri di sfasamento infilati all'inizio
del giro; e cinque metri alla prima variante, dove le macchine vanno a 20 m/s,
valgono un quarto di secondo di delta inventato.

Misurato sullo stesso confronto, con i tempi di settore come metro:

    OpenF1     escursione 0,571 s   picco alla Variante -0,562
    FastF1     escursione 0,404 s   picco alla Variante -0,391

Spostando i tempi OpenF1 di quei 0,06 s si ottiene la curva FastF1 quasi al
millesimo: la differenza e' tutta li'.

In piu' FastF1 scarica la sessione in poche richieste e la tiene in cache su
disco, quindi spariscono il tetto di 30 richieste al minuto di OpenF1 e i
dieci minuti di attesa. Rilanciare un round che era andato storto non costa
quasi nulla.

## Cosa NON e' cambiato

Il formato dei file e' identico a prima, quindi il sito non va toccato.
L'unica aggiunta e' il campo "settori" in laps.json.
"""

from __future__ import annotations

import json
import sys
import warnings
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "telemetria-data"
CACHE = Path(__file__).resolve().parent / ".cache-fastf1"

# Quanti campioni salvare per giro. La telemetria arriva a circa 4 Hz, quindi
# un giro di Monza ne ha ~315: il tetto non taglia quasi mai, ma protegge dai
# circuiti lenti (Monaco, Singapore) dove i giri sono lunghi il doppio.
TELEMETRY_POINTS = 350

# In gara e nella sprint si salvano tutti i giri di tutti i piloti, cioe'
# un migliaio di giri a weekend invece di un centinaio: con meno campioni per
# giro il file di un pilota resta sotto i 100 KB compressi. 250 punti sono
# uno ogni 20-25 metri, abbastanza per staccate e velocita' minime.
TELEMETRY_POINTS_GARA = 250
TUTTI = 10_000

DEFAULT_COLOR = "FF3A3A"

# Sessioni del weekend, nell'ordine in cui si svolgono. La chiave e' il nome
# con cui FastF1 le elenca nel calendario; "tel" dice quanti giri per pilota
# salvare con la telemetria completa. Nelle qualifiche il confronto del giro
# secco e' il cuore dell'analisi, nelle libere bastano pochi riferimenti. In
# gara e sprint si tengono tutti i giri ("gara": True): la sezione che si apre
# per prima resta il passo, ma ogni giro si puo' confrontare come in qualifica.
#
# "Sprint Shootout" e' il nome che la qualifica sprint aveva nel 2023-2024:
# sta qui perche' i round vecchi si possano ancora rigenerare.
SESSION_TYPES = [
    {"nome": "Practice 1", "key": "FP1", "label": "Libere 1", "tel": 3},
    {"nome": "Practice 2", "key": "FP2", "label": "Libere 2", "tel": 3},
    {"nome": "Practice 3", "key": "FP3", "label": "Libere 3", "tel": 3},
    {"nome": "Sprint Qualifying", "key": "SQ", "label": "Qualifica Sprint", "tel": 4},
    {"nome": "Sprint Shootout", "key": "SQ", "label": "Qualifica Sprint", "tel": 4},
    {"nome": "Sprint", "key": "SPR", "label": "Sprint", "tel": TUTTI, "gara": True},
    {"nome": "Qualifying", "key": "Q", "label": "Qualifica", "tel": 5},
    {"nome": "Race", "key": "R", "label": "Gara", "tel": TUTTI, "gara": True},
]


def save_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def secondi(valore) -> float | None:
    """Timedelta -> secondi. None per i valori mancanti (NaT)."""
    try:
        s = float(valore.total_seconds())
    except (AttributeError, TypeError, ValueError):
        return None
    return None if s != s else s


# --- Telemetria ------------------------------------------------------------

def costruisci_telemetria(
    velocita, tempi, durata: float, punti: int = TELEMETRY_POINTS
) -> tuple[list, list] | None:
    """Distanza percorsa, ricavata integrando la velocita' nel tempo.

    La distanza non e' un dato misurato: nessuna fonte la espone. Tre
    accortezze, tutte necessarie perche' il confronto fra due giri abbia senso:

    1. La traccia e' ancorata al traguardo a ENTRAMBE le estremita': un punto
       a t=0 e uno a t=durata. Senza, il primo campione cade fino a 0,27 s
       dopo la linea e l'ultimo prima, in misura diversa per ogni pilota, e
       quella differenza si presenta come distacco finale sbagliato.

    2. L'integrazione usa la velocita' media fra due campioni (trapezio) e non
       quella finale (rettangolo): a parita' di dati dimezza l'errore. Vale la
       pena saperlo perche' FastF1, nel suo `add_distance()`, usa il
       rettangolo — per questo la distanza la calcoliamo qui invece di
       prendere la sua.

    3. Si integra su TUTTI i campioni e si dirada dopo. Diradare prima
       significherebbe integrare su meno punti, cioe' peggio.

    Restituisce (distanze, indici da tenere) oppure None se i dati non bastano.
    """
    if len(tempi) < 20 or durata is None or durata <= 0:
        return None

    t = np.concatenate([[0.0], tempi, [durata]])
    v = np.concatenate([[velocita[0]], velocita, [velocita[-1]]]) / 3.6

    # I punti aggiunti agli estremi possono coincidere con campioni gia'
    # presenti: un dt nullo non sposta l'integrale ma sporca gli indici.
    tieni = np.concatenate([[True], np.diff(t) > 1e-9])
    t, v = t[tieni], v[tieni]

    distanza = np.concatenate([[0.0], np.cumsum((v[:-1] + v[1:]) / 2 * np.diff(t))])

    indici = np.arange(len(t))
    if len(indici) > punti:
        # Il primo e l'ultimo punto sono il traguardo: non si toccano.
        mezzo = np.linspace(1, len(indici) - 2, punti - 2).astype(int)
        indici = np.concatenate([[0], np.unique(mezzo), [len(t) - 1]])

    return t[indici], distanza[indici], indici, tieni


def telemetria_del_giro(lap, punti: int = TELEMETRY_POINTS) -> dict | None:
    """Telemetria di un giro nel formato atteso dal sito."""
    durata = secondi(lap["LapTime"])
    if durata is None:
        return None
    try:
        car = lap.get_car_data()
    except Exception:  # noqa: BLE001 — un giro senza telemetria non e' un errore
        return None
    if len(car) < 20:
        return None

    tempi = car["Time"].dt.total_seconds().to_numpy()
    vel = car["Speed"].to_numpy(dtype=float)
    esito = costruisci_telemetria(vel, tempi, durata, punti)
    if esito is None:
        return None
    t, distanza, indici, tieni = esito

    def canale(colonna, tipo):
        grezzo = car[colonna].to_numpy()
        # Stessa ricostruzione fatta sui tempi: punto iniziale, campioni,
        # punto finale — poi gli stessi filtri, cosi' gli indici combaciano.
        pieno = np.concatenate([[grezzo[0]], grezzo, [grezzo[-1]]])[tieni]
        return [tipo(x) for x in pieno[indici]]

    return {
        "distance": [round(float(x), 1) for x in distanza],
        "speed": canale("Speed", lambda x: int(round(float(x)))),
        # Il gas grezzo sfora ogni tanto il 100 (arriva a 104): il grafico lo
        # disegna come percentuale, quindi si taglia qui invece che li'.
        "throttle": canale("Throttle", lambda x: max(0, min(100, int(round(float(x)))))),
        "brake": canale("Brake", lambda x: 1 if bool(x) else 0),
        "gear": canale("nGear", lambda x: int(x)),
        "time": [round(float(x), 3) for x in t],
    }


# --- Anagrafiche -----------------------------------------------------------

def anagrafica(session) -> dict:
    """numero pilota -> sigla, nome, squadra, colore."""
    out: dict = {}
    try:
        risultati = session.results
    except Exception:  # noqa: BLE001
        return out
    for _, r in risultati.iterrows():
        numero = str(r.get("DriverNumber") or "").strip()
        if not numero:
            continue
        colore = str(r.get("TeamColor") or "").strip() or DEFAULT_COLOR
        out[int(numero)] = {
            "abbr": r.get("Abbreviation") or numero,
            "name": r.get("FullName") or numero,
            "team": r.get("TeamName") or "",
            "color": f"#{colore.lstrip('#')}",
        }
    return out


def piazzamenti(session) -> dict:
    """numero pilota -> posizione finale.

    FastF1 la compila solo per gara, qualifica e sprint. Nelle libere non
    esiste una classifica ufficiale: la si costruisce dal miglior tempo,
    che e' poi quello che interessa guardando le libere.
    """
    out: dict = {}
    try:
        risultati = session.results
    except Exception:  # noqa: BLE001
        return out
    for _, r in risultati.iterrows():
        numero = str(r.get("DriverNumber") or "").strip()
        pos = r.get("Position")
        if not numero or pos is None or pos != pos:
            continue
        out[int(numero)] = int(pos)
    return out


# --- Una sessione ----------------------------------------------------------

def elabora_sessione(session, spec: dict, base: Path) -> dict | None:
    """Scrive pace.json e, dove previsto, laps.json e tel/<numero>.json."""
    # Sessione appena conclusa: FastF1 non solleva un errore quando l'archivio
    # della Formula 1 non e' ancora online, si limita a scrivere dei warning e
    # a caricare zero piloti. L'eccezione arriva qui, al primo accesso ai
    # giri — e senza questa rete faceva cadere l'intero round, buttando via
    # anche le sessioni gia' scaricate.
    try:
        giri = session.laps
    except Exception:  # noqa: BLE001
        print(f"  [{spec['key']}] dati non ancora pubblicati, salto")
        return None
    if giri is None or len(giri) == 0:
        print(f"  [{spec['key']}] nessun giro disponibile")
        return None

    info = anagrafica(session)
    posizioni = piazzamenti(session)
    out_dir = base / spec["key"]

    def scheda(numero: int) -> dict:
        return info.get(
            numero,
            {"abbr": str(numero), "name": str(numero), "team": "", "color": f"#{DEFAULT_COLOR}"},
        )

    # --- Passo: tutti i giri di tutti i piloti ---
    passo: dict = {}
    for _, lap in giri.iterrows():
        numero = str(lap["DriverNumber"] or "").strip()
        n = lap["LapNumber"]
        if not numero or n is None or n != n:
            continue
        stint = lap["Stint"]
        passo.setdefault(int(numero), []).append(
            {
                "n": int(n),
                "t": (lambda s: round(s, 3) if s is not None else None)(secondi(lap["LapTime"])),
                "compound": (lambda c: c if isinstance(c, str) and c and c != "nan" else None)(
                    lap["Compound"]
                ),
                "stint": None if stint is None or stint != stint else int(stint),
                "pit": bool(lap["PitOutTime"] == lap["PitOutTime"]),
            }
        )

    piloti_passo = []
    for numero, elenco in passo.items():
        elenco.sort(key=lambda l: l["n"])
        piloti_passo.append(
            {
                **scheda(numero),
                "number": numero,
                "position": posizioni.get(numero),
                "status": "",
                "laps": elenco,
            }
        )
    if not piloti_passo:
        return None

    # Senza classifica ufficiale (le libere) si ordina per miglior tempo.
    def miglior_tempo(d: dict) -> float:
        tempi = [l["t"] for l in d["laps"] if l["t"]]
        return min(tempi) if tempi else float("inf")

    if any(d["position"] is not None for d in piloti_passo):
        piloti_passo.sort(key=lambda d: d["position"] if d["position"] is not None else 99)
    else:
        piloti_passo.sort(key=miglior_tempo)
        for i, d in enumerate(piloti_passo, start=1):
            d["position"] = i

    save_json(out_dir / "pace.json", {"session": spec["key"], "drivers": piloti_passo})
    print(f"  [{spec['key']}] passo: {len(piloti_passo)} piloti")

    esito = {"key": spec["key"], "label": spec["label"], "pace": True, "telemetry": False}

    # --- Telemetria: solo dove il giro secco conta ---
    massimo = spec["tel"]
    if massimo <= 0:
        return esito

    gara = bool(spec.get("gara"))
    punti = TELEMETRY_POINTS_GARA if gara else TELEMETRY_POINTS

    cronometrati: dict = {}
    for _, lap in giri.iterrows():
        numero = str(lap["DriverNumber"] or "").strip()
        durata = secondi(lap["LapTime"])
        if not numero or durata is None:
            continue
        uscita_box = lap["PitOutTime"] == lap["PitOutTime"]
        # Nelle libere e in qualifica il giro di uscita dai box non e' un
        # giro vero. In gara si', ed e' anche interessante: si tiene.
        if uscita_box and not gara:
            continue
        cronometrati.setdefault(int(numero), []).append((durata, lap))

    if not cronometrati:
        return esito

    ordinati = sorted(cronometrati.items(), key=lambda kv: min(d for d, _ in kv[1]))
    persi = 0
    piloti_tel = []
    for posizione, (numero, elenco) in enumerate(ordinati, start=1):
        elenco.sort(key=lambda x: x[0])
        per_giro: dict = {}
        schede = []
        for durata, lap in elenco[:massimo]:
            tel = telemetria_del_giro(lap, punti)
            if tel is None:
                persi += 1
                continue
            n = int(lap["LapNumber"])
            per_giro[str(n)] = tel
            schede.append(
                {
                    "lap": n,
                    "time": round(durata, 3),
                    "compound": (lambda c: c if isinstance(c, str) and c and c != "nan" else None)(
                        lap["Compound"]
                    ),
                    # I tempi di settore sono l'unico riferimento esatto che
                    # abbiamo: il delta calcolato puo' essere verificato
                    # contro di loro invece che a occhio.
                    "settori": [
                        (lambda s: round(s, 3) if s is not None else None)(secondi(lap[c]))
                        for c in ("Sector1Time", "Sector2Time", "Sector3Time")
                    ],
                }
            )
            if gara:
                # Giro di ingresso o di uscita dai box: il sito lo segnala
                # nell'elenco, perche' il tempo non e' confrontabile.
                if lap["PitOutTime"] == lap["PitOutTime"] or lap["PitInTime"] == lap["PitInTime"]:
                    schede[-1]["pit"] = True
        if not schede:
            continue
        migliore = min(schede, key=lambda l: l["time"])
        # In gara i giri si elencano in ordine, dal primo all'ultimo; altrove
        # dal piu' veloce, che e' quello che si cerca.
        schede.sort(key=lambda l: l["lap"] if gara else l["time"])
        save_json(out_dir / "tel" / f"{numero}.json", per_giro)
        piloti_tel.append(
            {
                **scheda(numero),
                "number": numero,
                # In gara conta l'ordine d'arrivo, non chi ha fatto il giro
                # piu' veloce.
                "position": (posizioni.get(numero) or 99) if gara else posizione,
                "lapTime": migliore["time"],
                "compound": migliore["compound"],
                "bestLap": migliore["lap"],
                "laps": schede,
            }
        )

    if gara:
        piloti_tel.sort(key=lambda d: d["position"])

    if piloti_tel:
        save_json(out_dir / "laps.json", {"session": spec["key"], "drivers": piloti_tel})
        esito["telemetry"] = True
        nota = f" ({persi} giri persi)" if persi else ""
        print(f"  [{spec['key']}] telemetria: {len(piloti_tel)} piloti{nota}")

    return esito


# --- Tracciato --------------------------------------------------------------

# Punti del disegno della pista: abbastanza per curve morbide anche a Monaco,
# pochi per tenere il file sotto i 15 KB.
PUNTI_TRACCIATO = 600

# Da quale sessione prendere il disegno: serve un giro veloce e pulito, e la
# qualifica e' il posto migliore. Le altre sono riserve per i weekend in cui
# la qualifica manca.
PREFERENZA_TRACCIATO = ["Q", "SQ", "FP3", "FP2", "FP1", "SPR", "R"]


def tracciato(session) -> dict | None:
    """Il disegno della pista e la posizione delle curve, in track.json.

    Le coordinate vengono dal giro piu' veloce della sessione (X e Y del GPS
    della vettura), ruotate come nelle mappe ufficiali e ricampionate a
    frazioni uguali di giro: il sito colora il tracciato segmento per
    segmento con la stessa scala che usa per i grafici, cioe' la frazione di
    giro, e cosi' i due disegni combaciano.

    Le curve (numero, posizione, punto del giro) arrivano dalle informazioni
    sul circuito che FastF1 legge da MultiViewer.
    """
    try:
        giro = session.laps.pick_fastest()
        tel = giro.get_telemetry()
    except Exception:  # noqa: BLE001
        return None
    if tel is None or len(tel) < 50 or "X" not in tel or "Distance" not in tel:
        return None

    try:
        info = session.get_circuit_info()
        rotazione = float(info.rotation)
        curve = info.corners
    except Exception:  # noqa: BLE001
        rotazione, curve = 0.0, None

    angolo = np.radians(rotazione)
    cos, sin = np.cos(angolo), np.sin(angolo)

    def ruota(x, y):
        return x * cos - y * sin, x * sin + y * cos

    dist = tel["Distance"].to_numpy(dtype=float)
    lunghezza = float(dist[-1]) or 1.0
    frazioni = np.linspace(0, 1, PUNTI_TRACCIATO)
    xs = np.interp(frazioni, dist / lunghezza, tel["X"].to_numpy(dtype=float))
    ys = np.interp(frazioni, dist / lunghezza, tel["Y"].to_numpy(dtype=float))
    rx, ry = ruota(xs, ys)

    elenco = []
    if curve is not None:
        for _, c in curve.iterrows():
            try:
                cx, cy = ruota(float(c["X"]), float(c["Y"]))
                # L'etichetta sta un po' fuori dalla pista, nella direzione
                # indicata da MultiViewer: sopra il tracciato si leggerebbe male.
                a = np.radians(float(c["Angle"]))
                ox, oy = ruota(np.cos(a) * 600, np.sin(a) * 600)
                lettera = str(c.get("Letter") or "").strip()
                elenco.append({
                    "n": f"{int(c['Number'])}{lettera}",
                    "f": round(max(0.0, min(1.0, float(c["Distance"]) / lunghezza)), 4),
                    "x": int(round(cx / 10)),
                    "y": int(round(cy / 10)),
                    "lx": int(round((cx + ox) / 10)),
                    "ly": int(round((cy + oy) / 10)),
                })
            except Exception:  # noqa: BLE001
                continue

    return {
        "fonte": "",  # la sessione da cui viene: la scrive scrivi_tracciato
        "lunghezza": round(lunghezza),
        # Decimetri interi: bastano e dimezzano il file.
        "x": [int(round(v / 10)) for v in rx],
        "y": [int(round(v / 10)) for v in ry],
        "curve": elenco,
    }


def scrivi_tracciato(sessioni_caricate: dict, base: Path, sempre: bool = True) -> None:
    """Scrive track.json dalla migliore sessione caricata.

    Con `sempre=False` (aggiornamento di singole sessioni, durante il
    weekend) lo sovrascrive solo se la sessione nuova e' preferibile a quella
    da cui viene il disegno attuale: dopo le FP1 la pista arriva dalle FP1,
    dopo la qualifica dalla qualifica, e la gara non la rimpiazza.
    """
    percorso = base / "track.json"
    attuale = len(PREFERENZA_TRACCIATO)
    if not sempre and percorso.exists():
        try:
            fonte = json.loads(percorso.read_text(encoding="utf-8")).get("fonte") or ""
        except (OSError, ValueError):
            fonte = ""
        # Un file senza "fonte" e' stato scritto da un'elaborazione completa
        # del weekend, cioe' gia' dalla sessione migliore: non si tocca.
        attuale = PREFERENZA_TRACCIATO.index(fonte) if fonte in PREFERENZA_TRACCIATO else -1
    for posto, chiave in enumerate(PREFERENZA_TRACCIATO):
        if posto >= attuale:
            return
        session = sessioni_caricate.get(chiave)
        if session is None:
            continue
        dati = tracciato(session)
        if dati:
            dati["fonte"] = chiave
            save_json(percorso, dati)
            print(f"  tracciato: da {chiave}, {len(dati['curve'])} curve")
            return
    print("  tracciato: non disponibile")


def solo_tracciato(anno: int, rnd: int) -> bool:
    """Rigenera solo track.json di un weekend gia' elaborato."""
    cal = calendario(anno)
    righe = cal[cal["RoundNumber"] == rnd]
    if righe.empty:
        print(f"Round {rnd} non trovato nel calendario {anno}.")
        return False
    evento = righe.iloc[0]
    print(f"Tracciato {anno} round {rnd}: {evento['EventName']}")
    presenti = {s["key"]: s for s in sessioni_del_weekend(evento)}
    for chiave in PREFERENZA_TRACCIATO:
        spec = presenti.get(chiave)
        if not spec:
            continue
        try:
            session = evento.get_session(spec["nome"])
            session.load(laps=True, telemetry=True, weather=False, messages=False)
        except Exception as exc:  # noqa: BLE001
            print(f"  [{chiave}] non disponibile: {exc}")
            continue
        dati = tracciato(session)
        if dati:
            dati["fonte"] = chiave
            save_json(OUT / str(anno) / str(rnd) / "track.json", dati)
            print(f"  fatto: da {chiave}, {len(dati['curve'])} curve")
            return True
    print("  tracciato non disponibile")
    return False


# --- Un weekend ------------------------------------------------------------

def carica_indice() -> list:
    percorso = OUT / "index.json"
    if percorso.exists():
        return json.loads(percorso.read_text(encoding="utf-8"))
    return []


def calendario(anno: int):
    import fastf1

    return fastf1.get_event_schedule(anno, include_testing=False)


def sessioni_del_weekend(evento) -> list:
    """Le sessioni davvero previste per questo weekend, nell'ordine giusto.

    Il calendario elenca i nomi in Session1..Session5, e il formato cambia
    (weekend normale, weekend sprint, e la sprint ha cambiato nome nel tempo).
    Leggere i nomi dichiarati invece di indovinarli dal formato evita di
    doverli inseguire a ogni cambio di regolamento.
    """
    presenti = {
        str(evento.get(f"Session{i}") or "").strip()
        for i in range(1, 6)
    }
    return [s for s in SESSION_TYPES if s["nome"] in presenti]


def elabora_round(anno: int, rnd: int, solo: set | None = None) -> bool:
    """Elabora un weekend. Con `solo` (es. {"FP2"}) solo quelle sessioni:
    e' il caso dell'aggiornamento automatico dopo ogni sessione, dove
    rielaborare tutto il weekend vorrebbe dire riscaricarlo ogni volta."""
    cal = calendario(anno)
    righe = cal[cal["RoundNumber"] == rnd]
    if righe.empty:
        print(f"Round {rnd} non trovato nel calendario {anno}.")
        return False
    evento = righe.iloc[0]
    nome = str(evento["EventName"])

    data = evento.get("EventDate")
    quando = "" if data is None else str(data)[:10]

    # I dati generati con OpenF1 numeravano i round contando i weekend in
    # ordine di data; FastF1 usa il numero ufficiale di calendario. Di norma
    # coincidono, ma un GP cancellato o rinviato li fa divergere — e allora
    # si riscriverebbe la cartella di un altro Gran Premio senza accorgersene.
    #
    # Il confronto e' sulla DATA e non sul nome: le due fonti chiamano lo
    # stesso Gran Premio in modi diversi (per OpenF1 il round 7 del 2026 e'
    # il "Barcelona Grand Prix", per il calendario ufficiale lo "Spanish"),
    # e un controllo sul nome griderebbe al lupo ogni volta. Le date invece
    # sono confrontabili, a patto di tollerare qualche giorno: OpenF1 datava
    # il weekend al venerdi', FastF1 lo data alla gara.
    precedente = next(
        (e for e in carica_indice() if e.get("year") == anno and e.get("round") == rnd), None
    )
    if precedente and quando and precedente.get("date"):
        try:
            scarto = abs(
                (datetime.fromisoformat(quando) - datetime.fromisoformat(precedente["date"])).days
            )
        except ValueError:
            scarto = 0
        if scarto > 5:
            print(f"FERMO: la cartella {anno}/{rnd} contiene "
                  f"'{precedente.get('name')}' del {precedente['date']},")
            print(f"       ma nel calendario ufficiale il round {rnd} e' "
                  f"'{nome}' del {quando}.")
            print("       La numerazione dei dati vecchi non coincide con quella di FastF1:")
            print("       rigenerare qui sovrascriverebbe un altro Gran Premio.")
            print("       Sposta o cancella public/telemetria-data prima di rigenerare.")
            return False

    print(f"Elaboro {anno} round {rnd}: {nome}")

    base = OUT / str(anno) / str(rnd)
    sessioni = []
    caricate: dict = {}
    for spec in sessioni_del_weekend(evento):
        if solo is not None and spec["key"] not in solo:
            continue
        try:
            session = evento.get_session(spec["nome"])
            # La telemetria e' il grosso del download: si scarica solo dove
            # serve (oggi tutte le sessioni, ma "tel": 0 la spegne).
            session.load(
                laps=True, telemetry=spec["tel"] > 0, weather=False, messages=False
            )
        except Exception as exc:  # noqa: BLE001
            print(f"  [{spec['key']}] non disponibile: {exc}")
            continue
        info = elabora_sessione(session, spec, base)
        if info:
            sessioni.append(info)
            if spec["tel"] > 0:
                caricate[spec["key"]] = session

    if not sessioni:
        print("  nessun dato nuovo disponibile, salto")
        print("  (se la sessione si e' appena conclusa, l'archivio della F1")
        print("   compare di solito entro un'ora: riprova piu' tardi)")
        return False

    scrivi_tracciato(caricate, base, sempre=solo is None)

    # Le sessioni gia' nell'indice e non rielaborate restano: con `solo`
    # sono quelle dei giorni prima; senza, quelle che stavolta l'archivio non
    # ha restituito (un errore di rete non deve cancellare dati gia' buoni).
    rielaborate = {s["key"] for s in sessioni}
    vecchie = [
        s for s in (precedente or {}).get("sessions", [])
        if isinstance(s, dict) and s.get("key") not in rielaborate
        and (base / s.get("key", "")).is_dir()
    ]
    ordine = {spec["key"]: i for i, spec in enumerate(SESSION_TYPES)}
    sessioni = sorted(vecchie + sessioni, key=lambda s: ordine.get(s["key"], 99))

    indice = [e for e in carica_indice() if not (e["year"] == anno and e["round"] == rnd)]
    data = evento.get("EventDate")
    indice.append(
        {
            "year": anno,
            "round": rnd,
            "name": nome,
            "circuit": str(evento.get("Location") or ""),
            "date": "" if data is None else str(data)[:10],
            "sessions": sessioni,
        }
    )
    indice.sort(key=lambda e: (e["year"], e["round"]))
    save_json(OUT / "index.json", indice)
    print(f"  fatto: {len(rielaborate)} sessioni elaborate, {len(sessioni)} nel weekend")
    return True


def auto() -> None:
    """Elabora l'ultimo weekend concluso non ancora presente nell'indice."""
    adesso = datetime.now(timezone.utc)
    anno = adesso.year
    cal = calendario(anno)
    if cal.empty:
        print("Calendario non disponibile.")
        return

    # Un weekend e' "fatto" se ha gia' la gara elaborata.
    fatti = set()
    for e in carica_indice():
        if e.get("year") != anno:
            continue
        chiavi = [s.get("key") if isinstance(s, dict) else s for s in e.get("sessions", [])]
        if "R" in chiavi:
            fatti.add(e["round"])

    limite = adesso.replace(tzinfo=None) - timedelta(hours=3)
    candidati = []
    for _, ev in cal.iterrows():
        data = ev.get("EventDate")
        if data is None or data != data:
            continue
        if data.to_pydatetime().replace(tzinfo=None) > limite:
            continue
        rnd = int(ev["RoundNumber"])
        if rnd not in fatti:
            candidati.append(rnd)

    if not candidati:
        print("Nessun weekend nuovo da elaborare.")
        return
    elabora_round(anno, candidati[-1])


def risolvi_round(anno: int, valore: str) -> int | None:
    valore = valore.strip()
    if valore.isdigit():
        return int(valore)

    ALIAS = {
        "australia": "australian", "cina": "chinese", "giappone": "japan",
        "canada": "canadian", "barcellona": "barcelona", "austria": "austrian",
        "gran bretagna": "british", "inghilterra": "british", "belgio": "belgian",
        "ungheria": "hungar", "olanda": "dutch", "paesi bassi": "dutch",
        "italia": "italian", "monza": "italian", "spagna": "spanish",
        "messico": "mexico", "brasile": "brazil", "stati uniti": "united states",
        "arabia": "saudi",
    }
    ago = ALIAS.get(valore.lower(), valore.lower())

    for _, ev in calendario(anno).iterrows():
        pagliaio = " ".join(
            str(ev.get(k, "")) for k in ("EventName", "OfficialEventName", "Location", "Country")
        ).lower()
        if ago in pagliaio:
            return int(ev["RoundNumber"])

    print(f"Non riesco a identificare '{valore}' nel calendario {anno}.")
    return None


def main() -> None:
    try:
        import fastf1
    except ImportError:
        print("Manca fastf1. Installalo una volta sola con:\n\n    pip install fastf1\n")
        sys.exit(1)

    CACHE.mkdir(parents=True, exist_ok=True)
    fastf1.Cache.enable_cache(str(CACHE))
    # FastF1 avvisa quando un dato e' approssimato: utile in analisi, rumore
    # qui, dove i giri sospetti li scartiamo gia' noi.
    warnings.filterwarnings("ignore", module="fastf1")
    # Solo avvisi ed errori: il registro di ogni download riempiva la finestra
    # e nascondeva il riepilogo che serve leggere.
    fastf1.set_log_level("WARNING")

    args = sys.argv[1:]
    if args and args[0] == "--auto":
        auto()
    elif len(args) == 3 and args[2] == "--solo-tracciato":
        anno = int(args[0])
        # Anche un intervallo: "2026 1-15 --solo-tracciato".
        if "-" in args[1] and all(p.isdigit() for p in args[1].split("-")):
            da, a = (int(p) for p in args[1].split("-"))
            for rnd in range(da, a + 1):
                solo_tracciato(anno, rnd)
        else:
            rnd = risolvi_round(anno, args[1])
            if rnd is None:
                sys.exit(1)
            solo_tracciato(anno, rnd)
    elif len(args) == 4 and args[2] == "--sessioni":
        anno = int(args[0])
        rnd = risolvi_round(anno, args[1])
        if rnd is None:
            sys.exit(1)
        solo = {k.strip().upper() for k in args[3].split(",") if k.strip()}
        elabora_round(anno, rnd, solo)
    elif len(args) == 2:
        anno = int(args[0])
        # Anche un intervallo: "2026 1-15".
        if "-" in args[1] and all(p.isdigit() for p in args[1].split("-")):
            da, a = (int(p) for p in args[1].split("-"))
            for rnd in range(da, a + 1):
                elabora_round(anno, rnd)
            return
        rnd = risolvi_round(anno, args[1])
        if rnd is None:
            sys.exit(1)
        elabora_round(anno, rnd)
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
