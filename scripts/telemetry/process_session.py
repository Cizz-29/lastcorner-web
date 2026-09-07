"""Genera i dati della telemetria per un weekend di Formula 1.

    python scripts\\telemetry\\process_session.py 2026 13
    python scripts\\telemetry\\process_session.py 2026 monza
    python scripts\\telemetry\\process_session.py --auto

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

DEFAULT_COLOR = "FF3A3A"

# Sessioni del weekend, nell'ordine in cui si svolgono. La chiave e' il nome
# con cui FastF1 le elenca nel calendario; "tel" dice quanti giri per pilota
# salvare con la telemetria completa. Nelle qualifiche il confronto del giro
# secco e' il cuore dell'analisi, nelle libere bastano pochi riferimenti, in
# gara e sprint interessa il passo e non il giro singolo.
#
# "Sprint Shootout" e' il nome che la qualifica sprint aveva nel 2023-2024:
# sta qui perche' i round vecchi si possano ancora rigenerare.
SESSION_TYPES = [
    {"nome": "Practice 1", "key": "FP1", "label": "Libere 1", "tel": 3},
    {"nome": "Practice 2", "key": "FP2", "label": "Libere 2", "tel": 3},
    {"nome": "Practice 3", "key": "FP3", "label": "Libere 3", "tel": 3},
    {"nome": "Sprint Qualifying", "key": "SQ", "label": "Qualifica Sprint", "tel": 4},
    {"nome": "Sprint Shootout", "key": "SQ", "label": "Qualifica Sprint", "tel": 4},
    {"nome": "Sprint", "key": "SPR", "label": "Sprint", "tel": 0},
    {"nome": "Qualifying", "key": "Q", "label": "Qualifica", "tel": 5},
    {"nome": "Race", "key": "R", "label": "Gara", "tel": 0},
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

def costruisci_telemetria(velocita, tempi, durata: float) -> tuple[list, list] | None:
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
    if len(indici) > TELEMETRY_POINTS:
        # Il primo e l'ultimo punto sono il traguardo: non si toccano.
        mezzo = np.linspace(1, len(indici) - 2, TELEMETRY_POINTS - 2).astype(int)
        indici = np.concatenate([[0], np.unique(mezzo), [len(t) - 1]])

    return t[indici], distanza[indici], indici, tieni


def telemetria_del_giro(lap) -> dict | None:
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
    esito = costruisci_telemetria(vel, tempi, durata)
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
    giri = session.laps
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

    cronometrati: dict = {}
    for _, lap in giri.iterrows():
        numero = str(lap["DriverNumber"] or "").strip()
        durata = secondi(lap["LapTime"])
        if not numero or durata is None or lap["PitOutTime"] == lap["PitOutTime"]:
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
            tel = telemetria_del_giro(lap)
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
        if not schede:
            continue
        schede.sort(key=lambda l: l["time"])
        save_json(out_dir / "tel" / f"{numero}.json", per_giro)
        piloti_tel.append(
            {
                **scheda(numero),
                "number": numero,
                "position": posizione,
                "lapTime": schede[0]["time"],
                "compound": schede[0]["compound"],
                "bestLap": schede[0]["lap"],
                "laps": schede,
            }
        )

    if piloti_tel:
        save_json(out_dir / "laps.json", {"session": spec["key"], "drivers": piloti_tel})
        esito["telemetry"] = True
        nota = f" ({persi} giri persi)" if persi else ""
        print(f"  [{spec['key']}] telemetria: {len(piloti_tel)} piloti{nota}")

    return esito


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


def elabora_round(anno: int, rnd: int) -> bool:
    cal = calendario(anno)
    righe = cal[cal["RoundNumber"] == rnd]
    if righe.empty:
        print(f"Round {rnd} non trovato nel calendario {anno}.")
        return False
    evento = righe.iloc[0]
    nome = str(evento["EventName"])
    print(f"Elaboro {anno} round {rnd}: {nome}")

    base = OUT / str(anno) / str(rnd)
    sessioni = []
    for spec in sessioni_del_weekend(evento):
        try:
            session = evento.get_session(spec["nome"])
            # La telemetria e' il grosso del download: per gara e sprint, dove
            # serve solo il passo, non la si scarica affatto.
            session.load(
                laps=True, telemetry=spec["tel"] > 0, weather=False, messages=False
            )
        except Exception as exc:  # noqa: BLE001
            print(f"  [{spec['key']}] non disponibile: {exc}")
            continue
        info = elabora_sessione(session, spec, base)
        if info:
            sessioni.append(info)

    if not sessioni:
        print("  nessun dato disponibile, salto")
        return False

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
    print(f"  fatto: {len(sessioni)} sessioni")
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

    args = sys.argv[1:]
    if args and args[0] == "--auto":
        auto()
    elif len(args) == 2:
        anno = int(args[0])
        rnd = risolvi_round(anno, args[1])
        if rnd is None:
            sys.exit(1)
        elabora_round(anno, rnd)
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
