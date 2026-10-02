"""Statistiche di carriera di piloti e team di F1, per le "domande rapide".

    python scripts/statistiche/aggiorna.py            # stagione in corso + ricalcolo
    python scripts/statistiche/aggiorna.py --tutto    # riscarica anche lo storico

Scrive:
  scripts/statistiche/storico/<anno>.json   una stagione: gare, piazzamenti,
                                            pole, classifiche finali
  data/statistiche-f1.json                  i numeri pronti per il sito, solo
                                            per i piloti e i team in griglia

Solo libreria standard: gira anche su GitHub Actions senza installare niente.

## Perche' si scaricano i dati grezzi invece di chiedere i totali

Jolpica (l'erede di Ergast) ha filtri come /drivers/hamilton/qualifying/1,
che dovrebbero restituire le pole. Verificato il 2 ottobre 2026: restituisce
118 "pole" per Hamilton contro le 104 reali (per il GP di Spagna 2024 elenca
Hamilton, terzo in qualifica). E le classifiche finali si possono chiedere
solo stagione per stagione. Quindi si scarica tutto e si conta qui.

Lo storico non cambia: una volta scaricato resta nel repository, e ogni
aggiornamento riscarica solo la stagione in corso (una dozzina di richieste).
Jolpica concede 500 richieste l'ora; il primo scaricamento completo ne fa
circa 500 e per questo va piano (vedi ATTESA_LENTA).

## Le pole

Le pole si contano dalla griglia di partenza (primo posto in griglia), non
dalla classifica della qualifica. Verificato il 2 ottobre 2026 sui totali
ufficiali di 15 piloti: la griglia li riproduce tutti (Hamilton 104,
Verstappen 48, Leclerc 27, Senna 65...), la qualifica sbaglia di 1-3 in un
caso su due. Il motivo e' che la FIA assegna la pole a chi scatta primo
quando il piu' veloce e' penalizzato (Leclerc in Messico 2019, Sainz a Spa
2022) e, nel 2021, al vincitore della sprint. Un'eccezione: vedi
POLE_DALLA_QUALIFICA.
"""

from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STORICO = Path(__file__).resolve().parent / "storico"
USCITA = ROOT / "data" / "statistiche-f1.json"
API = "https://api.jolpi.ca/ergast/f1"

PRIMO_ANNO = 1950
PRIMO_COSTRUTTORI = 1958  # primo Mondiale costruttori

# Secondi fra due richieste. 7,5 s = 480 l'ora, sotto il tetto di 500.
# Nell'aggiornamento normale (una stagione) si puo' andare piu' veloci.
ATTESA_LENTA = 7.5
ATTESA_VELOCE = 1.0


def scarica(percorso: str, attesa: float) -> dict:
    url = f"{API}/{percorso}"
    for tentativo in range(5):
        time.sleep(attesa)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "lastcorner.net statistiche"})
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)["MRData"]
        except urllib.error.HTTPError as e:
            if e.code == 429:
                # Troppe richieste: si aspetta e si riprova.
                time.sleep(60 * (tentativo + 1))
                continue
            raise
        except (urllib.error.URLError, TimeoutError):
            time.sleep(10 * (tentativo + 1))
    raise RuntimeError(f"impossibile scaricare {url}")


def tutte_le_pagine(percorso: str, chiave: str, attesa: float) -> list:
    """Le API restituiscono al massimo 100 righe: si pagina. Le gare possono
    essere spezzate a cavallo di due pagine, quindi si riuniscono per round."""
    gare: dict = {}
    offset = 0
    while True:
        m = scarica(f"{percorso}?limit=100&offset={offset}", attesa)
        for g in m["RaceTable"]["Races"]:
            r = int(g["round"])
            if r not in gare:
                gare[r] = {**g, chiave: []}
            gare[r][chiave].extend(g.get(chiave, []))
        offset += 100
        if offset >= int(m["total"]):
            break
    return [gare[r] for r in sorted(gare)]


def scarica_stagione(anno: int, attesa: float) -> dict:
    risultati = tutte_le_pagine(f"{anno}/results/", "Results", attesa)

    gare = []
    for g in risultati:
        r = int(g["round"])
        ordine = [
            [
                x["Driver"]["driverId"],
                x["Constructor"]["constructorId"],
                x.get("positionText", ""),
                int(x["grid"]) if str(x.get("grid", "")).isdigit() else None,
            ]
            for x in g["Results"]
        ]
        in_pole = next((x for x in ordine if x[3] == 1), None)
        pole = [in_pole[0], in_pole[1]] if in_pole else None
        gare.append({"round": r, "nome": g["raceName"], "data": g["date"], "ordine": ordine, "pole": pole})

    piloti, punti_piloti = {}, {}
    m = scarica(f"{anno}/driverStandings/?limit=100", attesa)
    liste = m["StandingsTable"]["StandingsLists"]
    if liste:
        for s in liste[0]["DriverStandings"]:
            piloti[s["Driver"]["driverId"]] = int(s["position"]) if s.get("position") else None
            punti_piloti[s["Driver"]["driverId"]] = float(s.get("points") or 0)

    costruttori, punti_costruttori = {}, {}
    if anno >= PRIMO_COSTRUTTORI:
        m = scarica(f"{anno}/constructorStandings/?limit=100", attesa)
        liste = m["StandingsTable"]["StandingsLists"]
        if liste:
            for s in liste[0]["ConstructorStandings"]:
                costruttori[s["Constructor"]["constructorId"]] = int(s["position"]) if s.get("position") else None
                punti_costruttori[s["Constructor"]["constructorId"]] = float(s.get("points") or 0)

    # Gare previste nel calendario: serve a sapere se la stagione e' finita
    # (solo allora il primo in classifica e' campione).
    previste = int(scarica(f"{anno}/", attesa)["total"])
    return {
        "anno": anno,
        "gare": gare,
        "piloti": piloti,
        "costruttori": costruttori,
        "puntiPiloti": punti_piloti,
        "puntiCostruttori": punti_costruttori,
        "conclusa": len(gare) >= previste and previste > 0,
    }


def salva(percorso: Path, dati) -> None:
    percorso.parent.mkdir(parents=True, exist_ok=True)
    percorso.write_text(json.dumps(dati, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def carica_storico() -> dict:
    return {int(p.stem): json.loads(p.read_text(encoding="utf-8")) for p in sorted(STORICO.glob("*.json"))}


# --- Conteggi ------------------------------------------------------------------

# Negli anni '60 Ergast separa la McLaren per motore ("mclaren-ford",
# "mclaren-brm"...), mentre le statistiche ufficiali del team le contano
# tutte: senza questa riga mancavano le 4 vittorie del 1968-69 di Hulme e
# McLaren. Controllato sui team in griglia nel 2026: e' l'unico caso
# ("cooper-ferrari" e' una Cooper con motore Ferrari, non la Ferrari).
# Unica eccezione alla regola della griglia: nel 2022, nei weekend con la
# sprint, la griglia del GP la decideva la sprint ma la pole andava al piu'
# veloce in qualifica. Conta solo il Brasile (Magnussen in pole, Russell primo
# in griglia dopo la sprint); a Imola e in Austria i due coincidono. Lo
# storico del 2022 conserva in "pole" il primo della qualifica.
POLE_DALLA_QUALIFICA = {(2022, 4), (2022, 11), (2022, 21)}

ALIAS_TEAM = {
    "mclaren-ford": "mclaren",
    "mclaren-brm": "mclaren",
    "mclaren-alfa_romeo": "mclaren",
    "mclaren-seren": "mclaren",
}

def calcola(stagioni: dict, anno_corrente: int) -> dict:
    p = defaultdict(lambda: {"gp": 0, "vittorie": 0, "podi": 0, "pole": 0, "mondiali": [], "stagioni": set(),
                              "piazzamenti": {}, "primaVittoria": None, "ultimaVittoria": None})
    t = defaultdict(lambda: {"gp": 0, "vittorie": 0, "podi": 0, "pole": 0, "mondiali": [], "stagioni": set(),
                              "piazzamenti": {}, "primaVittoria": None, "ultimaVittoria": None})

    for anno in sorted(stagioni):
        s = stagioni[anno]
        for g in s["gare"]:
            gara = {"anno": anno, "gara": g["nome"], "data": g["data"]}
            team_in_gara = set()
            team_vincitore = None
            for pilota, team, pos, _griglia in g["ordine"]:
                team = ALIAS_TEAM.get(team, team)
                if pos in ("F", "W"):  # non qualificato o ritirato prima del via
                    continue
                d = p[pilota]
                d["gp"] += 1
                d["stagioni"].add(anno)
                team_in_gara.add(team)
                t[team]["stagioni"].add(anno)
                if pos == "1":
                    d["vittorie"] += 1
                    d["primaVittoria"] = d["primaVittoria"] or gara
                    d["ultimaVittoria"] = gara
                    team_vincitore = team
                if pos in ("1", "2", "3"):
                    d["podi"] += 1
                    t[team]["podi"] += 1
            for team in team_in_gara:
                t[team]["gp"] += 1
            if team_vincitore:
                tv = t[team_vincitore]
                tv["vittorie"] += 1
                tv["primaVittoria"] = tv["primaVittoria"] or gara
                tv["ultimaVittoria"] = gara
            # La pole dalla griglia (vedi in cima). Lo storico scaricato prima
            # del 2 ottobre 2026 ha in "pole" il primo della qualifica: per
            # questo si ricalcola qui invece di fidarsi del campo.
            in_pole = next((x for x in g["ordine"] if x[3] == 1), None)
            if (anno, g["round"]) in POLE_DALLA_QUALIFICA and g.get("pole"):
                in_pole = g["pole"]
            if in_pole:
                p[in_pole[0]]["pole"] += 1
                t[ALIAS_TEAM.get(in_pole[1], in_pole[1])]["pole"] += 1

        # Campione solo a stagione finita: chi e' primo a meta' anno non lo e'.
        finita = bool(s.get("conclusa"))
        for pilota, pos in s["piloti"].items():
            if pos is None:
                continue
            if finita:
                p[pilota]["piazzamenti"][anno] = pos
                if pos == 1:
                    p[pilota]["mondiali"].append(anno)
        for team, pos in s["costruttori"].items():
            team = ALIAS_TEAM.get(team, team)
            if pos is None or not finita:
                continue
            t[team]["piazzamenti"][anno] = pos
            if pos == 1:
                t[team]["mondiali"].append(anno)

    def chiudi(d: dict) -> dict:
        fuori = {
            "gp": d["gp"],
            "esordio": min(d["stagioni"]) if d["stagioni"] else None,
            "vittorie": d["vittorie"],
            "podi": d["podi"],
            "pole": d["pole"],
            "mondiali": d["mondiali"],
            "primaVittoria": d["primaVittoria"],
            "ultimaVittoria": d["ultimaVittoria"],
        }
        if d["piazzamenti"]:
            migliore = min(d["piazzamenti"].values())
            fuori["migliorPiazzamento"] = {
                "posizione": migliore,
                "anni": sorted(a for a, v in d["piazzamenti"].items() if v == migliore),
            }
        return fuori

    return {
        "piloti": {k: chiudi(v) for k, v in p.items()},
        "team": {k: chiudi(v) for k, v in t.items()},
    }


def main() -> None:
    adesso = datetime.now(timezone.utc)
    anno = adesso.year
    tutto = "--tutto" in sys.argv

    archivio = carica_storico()
    mancanti = [a for a in range(PRIMO_ANNO, anno) if tutto or a not in archivio]
    for a in mancanti:
        print(f"storico {a}...", flush=True)
        archivio[a] = scarica_stagione(a, ATTESA_LENTA)
        salva(STORICO / f"{a}.json", archivio[a])

    print(f"stagione {anno}...", flush=True)
    archivio[anno] = scarica_stagione(anno, ATTESA_VELOCE)
    salva(STORICO / f"{anno}.json", archivio[anno])

    tutti = calcola(archivio, anno)
    # La stagione in corso da sola: serve ai riquadri "Stagione" delle schede,
    # che prima chiedevano i podi a Jolpica pilota per pilota a ogni
    # rigenerazione della pagina.
    corrente = calcola({anno: archivio[anno]}, anno)
    for chiave in ("piloti", "team"):
        for k, v in tutti[chiave].items():
            c = corrente[chiave].get(k)
            v["stagione"] = {"vittorie": c["vittorie"], "podi": c["podi"], "pole": c["pole"]} if c else None

    # Sul sito servono solo piloti e team della griglia attuale: quelli in
    # classifica nella stagione in corso.
    # A inizio anno, prima della prima gara, la classifica nuova e' vuota: si
    # usa la griglia dell'anno prima, cosi' le schede non perdono le domande.
    rif = anno if archivio[anno]["piloti"] else anno - 1
    griglia_piloti = set(archivio.get(rif, {}).get("piloti", {}))
    griglia_team = set(archivio.get(rif, {}).get("costruttori", {}))
    uscita = {
        "aggiornato": adesso.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "stagione": anno,
        "piloti": {k: v for k, v in tutti["piloti"].items() if k in griglia_piloti},
        "team": {k: v for k, v in tutti["team"].items() if k in griglia_team},
        # La classifica della stagione: il sito la legge da Jolpica, ma averla
        # qui fa si' che il file cambi anche dopo una sprint (che non tocca le
        # statistiche dei Gran Premi), e quindi che il commit faccia ripartire
        # il deploy con la classifica nuova.
        "classifica": {
            "piloti": {k: [v, archivio[anno].get("puntiPiloti", {}).get(k)] for k, v in archivio[anno]["piloti"].items()},
            "team": {k: [v, archivio[anno].get("puntiCostruttori", {}).get(k)] for k, v in archivio[anno]["costruttori"].items()},
        },
    }
    # Il file cambia solo se cambiano i numeri: la data di aggiornamento da
    # sola non deve produrre un commit (e un deploy) a ogni esecuzione.
    if USCITA.exists():
        vecchio = json.loads(USCITA.read_text(encoding="utf-8"))
        if {**vecchio, "aggiornato": ""} == {**uscita, "aggiornato": ""}:
            print("nessun numero cambiato")
            return
    USCITA.parent.mkdir(parents=True, exist_ok=True)
    USCITA.write_text(json.dumps(uscita, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"scritto {USCITA.relative_to(ROOT)}: {len(uscita['piloti'])} piloti, {len(uscita['team'])} team")


if __name__ == "__main__":
    main()
