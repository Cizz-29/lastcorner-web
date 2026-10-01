"""C'e' una sessione di F1 appena finita da elaborare?

    python scripts/telemetry/serve_aggiornare.py

Lo lancia ogni ora il workflow .github/workflows/telemetria.yml. Usa solo la
libreria standard, cosi' il controllo costa pochi secondi e FastF1 (che va
installato e scarica centinaia di MB) entra in gioco solo quando serve.

Stampa, nel formato che GitHub Actions legge da $GITHUB_OUTPUT:

    anno=2026
    round=16
    sessioni=FP1,FP2

oppure niente, se non c'e' nulla da fare.

Una sessione e' "da fare" se:
  - e' finita da almeno MARGINE minuti (l'archivio della F1 pubblica i dati
    di solito entro mezz'ora-un'ora dalla bandiera a scacchi);
  - non e' finita da piu' di FINESTRA ore (se in un giorno e mezzo i dati
    non sono arrivati, il problema non si risolve riprovando ogni ora);
  - non compare ancora in public/telemetria-data/index.json.

Se l'archivio non ha ancora i dati, process_session.py non scrive niente e
l'ora dopo questo controllo la ripropone: e' cosi' che si gestisce l'attesa.
"""

from __future__ import annotations

import json
import sys
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
INDICE = ROOT / "public" / "telemetria-data" / "index.json"

MARGINE = timedelta(minutes=40)
FINESTRA = timedelta(hours=36)

# Campo del calendario Jolpica -> (chiave del sito, durata prevista). Le
# durate sono larghe: una bandiera rossa allunga la sessione, e partire
# troppo presto costa solo un tentativo a vuoto.
SESSIONI = [
    ("FirstPractice", "FP1", timedelta(minutes=60)),
    ("SecondPractice", "FP2", timedelta(minutes=60)),
    ("ThirdPractice", "FP3", timedelta(minutes=60)),
    ("SprintQualifying", "SQ", timedelta(minutes=45)),
    ("SprintShootout", "SQ", timedelta(minutes=45)),
    ("Sprint", "SPR", timedelta(minutes=60)),
    ("Qualifying", "Q", timedelta(minutes=60)),
    ("", "R", timedelta(minutes=150)),  # la gara: data e ora sono in cima
]


def orario(blocco: dict) -> datetime | None:
    data = blocco.get("date")
    ora = blocco.get("time") or "00:00:00Z"
    if not data:
        return None
    try:
        return datetime.fromisoformat(f"{data}T{ora.replace('Z', '+00:00')}")
    except ValueError:
        return None


def calendario(anno: int) -> list:
    url = f"https://api.jolpi.ca/ergast/f1/{anno}.json"
    req = urllib.request.Request(url, headers={"User-Agent": "lastcorner.net telemetria"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)["MRData"]["RaceTable"]["Races"]


def gia_fatte() -> dict:
    """(anno, round) -> chiavi delle sessioni gia' nell'indice."""
    try:
        indice = json.loads(INDICE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    fuori: dict = {}
    for e in indice:
        chiavi = {s.get("key") if isinstance(s, dict) else s for s in e.get("sessions", [])}
        fuori[(e.get("year"), e.get("round"))] = chiavi
    return fuori


def main() -> None:
    adesso = datetime.now(timezone.utc)
    fatte = gia_fatte()
    try:
        gare = calendario(adesso.year)
    except Exception as exc:  # noqa: BLE001
        # Calendario irraggiungibile: niente da fare stavolta, si riprova
        # all'ora dopo. Il messaggio va su stderr per non finire nell'output.
        print(f"calendario non disponibile: {exc}", file=sys.stderr)
        return

    for gara in gare:
        rnd = int(gara["round"])
        presenti = fatte.get((adesso.year, rnd), set())
        da_fare = []
        for campo, chiave, durata in SESSIONI:
            blocco = gara if campo == "" else gara.get(campo)
            if not blocco:
                continue
            inizio = orario(blocco)
            if inizio is None:
                continue
            fine = inizio + durata
            if fine + MARGINE <= adesso <= fine + FINESTRA and chiave not in presenti:
                da_fare.append(chiave)
        if da_fare:
            print(f"anno={adesso.year}")
            print(f"round={rnd}")
            print(f"sessioni={','.join(dict.fromkeys(da_fare))}")
            print(f"da fare: {adesso.year} round {rnd} {da_fare}", file=sys.stderr)
            return
    print("niente da fare", file=sys.stderr)


if __name__ == "__main__":
    main()
