"""Pipeline dati Telemetria — Lastcorner.

Scarica via FastF1 i dati di qualifica e gara di un weekend F1 e li salva
come JSON statici in public/telemetria-data/, pronti per essere serviti da
Vercel senza alcun backend.

Uso:
    python process_session.py 2026 14      # elabora anno/round specifico
    python process_session.py --auto       # elabora l'ultimo weekend concluso
                                           # non ancora presente nell'indice

Output:
    public/telemetria-data/index.json
    public/telemetria-data/<anno>/<round>/qualifying.json
    public/telemetria-data/<anno>/<round>/race.json
"""

import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import fastf1
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "telemetria-data"
CACHE = ROOT / ".fastf1-cache"

# Punti telemetria per giro dopo il downsampling: abbastanza fitti per
# grafici fluidi, abbastanza pochi da tenere i JSON leggeri (~1-2 MB a
# sessione per l'intera griglia).
TELEMETRY_POINTS = 500


def setup_cache() -> None:
    CACHE.mkdir(exist_ok=True)
    fastf1.Cache.enable_cache(str(CACHE))


def downsample(df: pd.DataFrame, n: int) -> pd.DataFrame:
    if len(df) <= n:
        return df
    step = len(df) / n
    idx = [int(i * step) for i in range(n)]
    return df.iloc[idx]


def lap_time_seconds(value) -> float | None:
    if pd.isna(value):
        return None
    return round(value.total_seconds(), 3)


def process_qualifying(year: int, rnd: int) -> dict | None:
    try:
        session = fastf1.get_session(year, rnd, "Q")
        session.load(telemetry=True, laps=True, weather=False, messages=False)
    except Exception as exc:  # sessione non ancora disponibile
        print(f"  qualifica non disponibile: {exc}")
        return None

    drivers = []
    for _, row in session.results.iterrows():
        abbr = row["Abbreviation"]
        try:
            lap = session.laps.pick_drivers(abbr).pick_fastest()
            if lap is None or pd.isna(lap["LapTime"]):
                continue
            tel = lap.get_telemetry()
        except Exception:
            continue

        tel = downsample(tel, TELEMETRY_POINTS)
        drivers.append(
            {
                "abbr": abbr,
                "name": row["FullName"],
                "team": row["TeamName"],
                "color": f"#{row['TeamColor']}" if pd.notna(row["TeamColor"]) else "#FF3A3A",
                "position": int(row["Position"]) if pd.notna(row["Position"]) else None,
                "lapTime": lap_time_seconds(lap["LapTime"]),
                "compound": lap["Compound"] if pd.notna(lap["Compound"]) else None,
                "telemetry": {
                    "distance": [round(float(v), 1) for v in tel["Distance"]],
                    "speed": [round(float(v), 1) for v in tel["Speed"]],
                    "throttle": [round(float(v), 1) for v in tel["Throttle"]],
                    "brake": [int(bool(v)) for v in tel["Brake"]],
                    "gear": [int(v) for v in tel["nGear"]],
                    "time": [round(float(v.total_seconds()), 3) for v in tel["Time"]],
                },
            }
        )

    if not drivers:
        return None
    return {"session": "Q", "drivers": drivers}


def process_race(year: int, rnd: int) -> dict | None:
    try:
        session = fastf1.get_session(year, rnd, "R")
        session.load(telemetry=False, laps=True, weather=False, messages=False)
    except Exception as exc:
        print(f"  gara non disponibile: {exc}")
        return None

    drivers = []
    for _, row in session.results.iterrows():
        abbr = row["Abbreviation"]
        laps = session.laps.pick_drivers(abbr)
        if len(laps) == 0:
            continue
        drivers.append(
            {
                "abbr": abbr,
                "name": row["FullName"],
                "team": row["TeamName"],
                "color": f"#{row['TeamColor']}" if pd.notna(row["TeamColor"]) else "#FF3A3A",
                "position": int(row["Position"]) if pd.notna(row["Position"]) else None,
                "status": row["Status"] if pd.notna(row["Status"]) else "",
                "laps": [
                    {
                        "n": int(lap["LapNumber"]),
                        "t": lap_time_seconds(lap["LapTime"]),
                        "compound": lap["Compound"] if pd.notna(lap["Compound"]) else None,
                        "stint": int(lap["Stint"]) if pd.notna(lap["Stint"]) else None,
                        "pit": bool(pd.notna(lap["PitInTime"]) or pd.notna(lap["PitOutTime"])),
                    }
                    for _, lap in laps.iterrows()
                ],
            }
        )

    if not drivers:
        return None
    return {"session": "R", "drivers": drivers}


def load_index() -> list:
    index_path = OUT / "index.json"
    if index_path.exists():
        return json.loads(index_path.read_text(encoding="utf-8"))
    return []


def save_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def process_round(year: int, rnd: int) -> bool:
    event = fastf1.get_event(year, rnd)
    print(f"Elaboro {year} round {rnd}: {event['EventName']}")

    quali = process_qualifying(year, rnd)
    race = process_race(year, rnd)
    if quali is None and race is None:
        print("  nessun dato disponibile, salto")
        return False

    base = OUT / str(year) / str(rnd)
    sessions = []
    if quali:
        save_json(base / "qualifying.json", quali)
        sessions.append("Q")
    if race:
        save_json(base / "race.json", race)
        sessions.append("R")

    index = [e for e in load_index() if not (e["year"] == year and e["round"] == rnd)]
    index.append(
        {
            "year": year,
            "round": rnd,
            "name": event["EventName"],
            "circuit": event["Location"],
            "date": str(event["EventDate"].date()) if pd.notna(event["EventDate"]) else "",
            "sessions": sessions,
        }
    )
    save_json(OUT / "index.json", index)
    print(f"  fatto: sessioni {sessions}")
    return True


def auto() -> None:
    """Trova l'ultimo weekend concluso e lo elabora se manca (o è parziale)."""
    now = datetime.now(timezone.utc)
    year = now.year
    schedule = fastf1.get_event_schedule(year, include_testing=False)
    index = load_index()

    done_full = {(e["year"], e["round"]) for e in index if "R" in e.get("sessions", [])}

    candidates = []
    for _, ev in schedule.iterrows():
        ev_date = ev["EventDate"]
        if pd.isna(ev_date):
            continue
        # L'evento è "concluso o in corso avanzato" se la domenica è passata
        # da almeno 3 ore (margine per la pubblicazione dei dati FastF1).
        if ev_date.tz_localize("UTC") if ev_date.tzinfo is None else ev_date <= now - timedelta(hours=3):
            rnd = int(ev["RoundNumber"])
            if (year, rnd) not in done_full:
                candidates.append(rnd)

    if not candidates:
        print("Nessun weekend nuovo da elaborare.")
        return
    # Solo il più recente: i precedenti eventualmente mancanti si possono
    # recuperare a mano con `python process_session.py <anno> <round>`.
    process_round(year, candidates[-1])


def main() -> None:
    setup_cache()
    args = sys.argv[1:]
    if args and args[0] == "--auto":
        auto()
    elif len(args) == 2:
        process_round(int(args[0]), int(args[1]))
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
