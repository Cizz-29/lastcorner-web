"""Pipeline dati Telemetria — Lastcorner.

Scarica i dati di qualifica e gara di un weekend F1 dall'API pubblica
OpenF1 (https://openf1.org) e li salva come JSON statici in
public/telemetria-data/, pronti per essere serviti da Vercel senza backend.

Perché OpenF1 e non FastF1: l'API di live timing usata da FastF1 blocca gli
IP dei datacenter, quindi su GitHub Actions ogni richiesta tornava vuota.
OpenF1 è una REST API aperta, raggiungibile ovunque, e con gli stessi dati
(telemetria a ~3.7 Hz, giri, stint, mescole).

Uso:
    python process_session.py 2026 11     # anno + round
    python process_session.py --auto      # ultimo weekend concluso mancante

Output:
    public/telemetria-data/index.json
    public/telemetria-data/<anno>/<round>/qualifying.json
    public/telemetria-data/<anno>/<round>/race.json
"""

import json
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

API = "https://api.openf1.org/v1"
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "telemetria-data"

# Punti telemetria per giro dopo il ricampionamento: abbastanza fitti per
# grafici fluidi, abbastanza pochi da tenere i JSON leggeri.
TELEMETRY_POINTS = 400
# Pausa tra le chiamate: OpenF1 è gratuita, evitiamo di stressarla.
THROTTLE_S = 0.35
DEFAULT_COLOR = "FF3A3A"


def get(endpoint: str, **params) -> list:
    """GET su OpenF1 con ritentativi. Restituisce [] in caso di fallimento."""
    qs = urllib.parse.urlencode(params, safe="<>=")
    url = f"{API}/{endpoint}?{qs}" if params else f"{API}/{endpoint}"
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "LastcornerTelemetry/1.0"})
            with urllib.request.urlopen(req, timeout=60) as res:
                return json.loads(res.read().decode("utf-8"))
        except Exception as exc:
            if attempt == 2:
                print(f"    ! {endpoint} fallito: {exc}")
                return []
            time.sleep(2 * (attempt + 1))
    return []


def parse_dt(value: str) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


# --- Anagrafiche -----------------------------------------------------------

def get_meetings(year: int) -> list:
    """Gran Premi dell'anno, ordinati per data (l'indice+1 è il 'round')."""
    meetings = get("meetings", year=year)
    meetings = [m for m in meetings if m.get("date_start")]
    meetings.sort(key=lambda m: m["date_start"])
    return meetings


def find_session(meeting_key: int, name: str) -> dict | None:
    sessions = get("sessions", meeting_key=meeting_key, session_name=name)
    return sessions[0] if sessions else None


def get_drivers(session_key: int) -> dict:
    """Mappa numero pilota -> anagrafica (sigla, nome, team, colore)."""
    out = {}
    for d in get("drivers", session_key=session_key):
        num = d.get("driver_number")
        if num is None:
            continue
        colour = d.get("team_colour") or DEFAULT_COLOR
        out[num] = {
            "abbr": d.get("name_acronym") or str(num),
            "name": d.get("full_name") or d.get("broadcast_name") or str(num),
            "team": d.get("team_name") or "",
            "color": f"#{colour.lstrip('#')}",
        }
    return out


def stint_lookup(session_key: int) -> dict:
    """Mappa (numero pilota, numero giro) -> (mescola, numero stint)."""
    table = {}
    for s in get("stints", session_key=session_key):
        num = s.get("driver_number")
        start = s.get("lap_start")
        end = s.get("lap_end")
        if num is None or start is None or end is None:
            continue
        for lap in range(int(start), int(end) + 1):
            table[(num, lap)] = (s.get("compound"), s.get("stint_number"))
    return table


# --- Qualifica -------------------------------------------------------------

def resample(points: list, n: int) -> list:
    if len(points) <= n:
        return points
    step = len(points) / n
    return [points[int(i * step)] for i in range(n)]


def build_telemetry(session_key: int, driver_number: int, lap: dict) -> dict | None:
    """Telemetria del giro indicato, ricampionata e con distanza calcolata.

    OpenF1 non espone la distanza percorsa: la si ricava integrando la
    velocità nel tempo (v * dt), sufficiente per l'asse X dei grafici.
    """
    start = parse_dt(lap.get("date_start"))
    duration = lap.get("lap_duration")
    if start is None or not duration:
        return None

    end = start + timedelta(seconds=float(duration) + 1)
    rows = get(
        "car_data",
        session_key=session_key,
        driver_number=driver_number,
        **{"date>": start.isoformat(), "date<": end.isoformat()},
    )
    if len(rows) < 20:
        return None

    rows = [r for r in rows if r.get("date")]
    rows.sort(key=lambda r: r["date"])
    rows = resample(rows, TELEMETRY_POINTS)

    t0 = parse_dt(rows[0]["date"])
    distance, speed, throttle, brake, gear, times = [], [], [], [], [], []
    dist = 0.0
    prev = t0
    for r in rows:
        now = parse_dt(r["date"])
        if now is None or t0 is None:
            continue
        dt = (now - prev).total_seconds()
        prev = now
        spd = float(r.get("speed") or 0)
        dist += (spd / 3.6) * dt  # km/h -> m/s
        distance.append(round(dist, 1))
        speed.append(spd)
        throttle.append(float(r.get("throttle") or 0))
        brake.append(1 if float(r.get("brake") or 0) > 0 else 0)
        gear.append(int(r.get("n_gear") or 0))
        times.append(round((now - t0).total_seconds(), 3))

    return {
        "distance": distance,
        "speed": speed,
        "throttle": throttle,
        "brake": brake,
        "gear": gear,
        "time": times,
    }


def process_qualifying(meeting_key: int) -> dict | None:
    session = find_session(meeting_key, "Qualifying")
    if not session:
        print("  [Q] sessione non trovata")
        return None
    session_key = session["session_key"]

    laps = get("laps", session_key=session_key)
    if not laps:
        print("  [Q] nessun giro disponibile (dati non ancora pubblicati)")
        return None

    drivers_info = get_drivers(session_key)
    stints = stint_lookup(session_key)

    # Giro più veloce per pilota (esclusi i giri senza tempo valido).
    best: dict = {}
    for lap in laps:
        num = lap.get("driver_number")
        dur = lap.get("lap_duration")
        if num is None or not dur or lap.get("is_pit_out_lap"):
            continue
        if num not in best or dur < best[num]["lap_duration"]:
            best[num] = lap

    if not best:
        print("  [Q] nessun giro cronometrato valido")
        return None

    ranked = sorted(best.items(), key=lambda kv: kv[1]["lap_duration"])
    drivers = []
    for position, (num, lap) in enumerate(ranked, start=1):
        info = drivers_info.get(num, {"abbr": str(num), "name": str(num), "team": "", "color": f"#{DEFAULT_COLOR}"})
        telemetry = build_telemetry(session_key, num, lap)
        time.sleep(THROTTLE_S)
        if telemetry is None:
            print(f"    - {info['abbr']}: telemetria non disponibile, salto")
            continue
        compound, _ = stints.get((num, lap.get("lap_number")), (None, None))
        drivers.append(
            {
                **info,
                "position": position,
                "lapTime": round(float(lap["lap_duration"]), 3),
                "compound": compound,
                "telemetry": telemetry,
            }
        )
        print(f"    + {info['abbr']} {lap['lap_duration']:.3f}s")

    if not drivers:
        return None
    return {"session": "Q", "drivers": drivers}


# --- Gara ------------------------------------------------------------------

def final_positions(session_key: int) -> dict:
    """Ultima posizione registrata per ciascun pilota."""
    out: dict = {}
    for p in get("position", session_key=session_key):
        num = p.get("driver_number")
        if num is None or p.get("position") is None:
            continue
        prev = out.get(num)
        if prev is None or (p.get("date") or "") > prev[1]:
            out[num] = (int(p["position"]), p.get("date") or "")
    return {num: pos for num, (pos, _) in out.items()}


def process_race(meeting_key: int) -> dict | None:
    session = find_session(meeting_key, "Race")
    if not session:
        print("  [R] sessione non trovata")
        return None
    session_key = session["session_key"]

    laps = get("laps", session_key=session_key)
    if not laps:
        print("  [R] nessun giro disponibile (dati non ancora pubblicati)")
        return None

    drivers_info = get_drivers(session_key)
    stints = stint_lookup(session_key)
    positions = final_positions(session_key)

    by_driver: dict = {}
    for lap in laps:
        num = lap.get("driver_number")
        n = lap.get("lap_number")
        if num is None or n is None:
            continue
        compound, stint = stints.get((num, n), (None, None))
        dur = lap.get("lap_duration")
        by_driver.setdefault(num, []).append(
            {
                "n": int(n),
                "t": round(float(dur), 3) if dur else None,
                "compound": compound,
                "stint": stint,
                "pit": bool(lap.get("is_pit_out_lap")),
            }
        )

    drivers = []
    for num, lap_list in by_driver.items():
        info = drivers_info.get(num, {"abbr": str(num), "name": str(num), "team": "", "color": f"#{DEFAULT_COLOR}"})
        lap_list.sort(key=lambda l: l["n"])
        drivers.append(
            {
                **info,
                "position": positions.get(num),
                "status": "",
                "laps": lap_list,
            }
        )

    drivers.sort(key=lambda d: d["position"] if d["position"] is not None else 99)
    if not drivers:
        return None
    print(f"    + {len(drivers)} piloti, {sum(len(d['laps']) for d in drivers)} giri")
    return {"session": "R", "drivers": drivers}


# --- Indice e salvataggio --------------------------------------------------

def load_index() -> list:
    index_path = OUT / "index.json"
    if index_path.exists():
        return json.loads(index_path.read_text(encoding="utf-8"))
    return []


def save_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def process_round(year: int, rnd: int) -> bool:
    meetings = get_meetings(year)
    if not meetings:
        print(f"Nessun calendario disponibile per il {year}.")
        return False
    if rnd < 1 or rnd > len(meetings):
        print(f"Round {rnd} fuori range (il {year} ha {len(meetings)} GP).")
        return False

    meeting = meetings[rnd - 1]
    name = meeting.get("meeting_name") or f"Round {rnd}"
    print(f"Elaboro {year} round {rnd}: {name}")

    quali = process_qualifying(meeting["meeting_key"])
    race = process_race(meeting["meeting_key"])
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
            "name": name,
            "circuit": meeting.get("circuit_short_name") or meeting.get("location") or "",
            "date": (meeting.get("date_start") or "")[:10],
            "sessions": sessions,
        }
    )
    save_json(OUT / "index.json", index)
    print(f"  fatto: sessioni {sessions}")
    return True


def auto() -> None:
    """Elabora l'ultimo weekend concluso non ancora presente nell'indice."""
    now = datetime.now(timezone.utc)
    year = now.year
    meetings = get_meetings(year)
    if not meetings:
        print("Calendario non disponibile.")
        return

    done = {e["round"] for e in load_index() if e["year"] == year and "R" in e.get("sessions", [])}
    cutoff = now - timedelta(hours=3)

    candidates = []
    for i, m in enumerate(meetings, start=1):
        start = parse_dt(m.get("date_start"))
        if start is None:
            continue
        # date_start è il giovedì/venerdì: la gara è ~3 giorni dopo.
        if start + timedelta(days=3) > cutoff:
            continue
        if i not in done:
            candidates.append(i)

    if not candidates:
        print("Nessun weekend nuovo da elaborare.")
        return
    process_round(year, candidates[-1])


def resolve_round(year: int, value: str) -> int | None:
    """Accetta un numero di round oppure un nome (GP, circuito, città)."""
    value = value.strip()
    if value.isdigit():
        return int(value)

    ALIASES = {
        "australia": "australian", "cina": "chinese", "giappone": "japan",
        "canada": "canadian", "barcellona": "barcelona", "austria": "austrian",
        "gran bretagna": "british", "inghilterra": "british", "belgio": "belgian",
        "ungheria": "hungar", "olanda": "dutch", "paesi bassi": "dutch",
        "italia": "italian", "spagna": "spanish", "messico": "mexico",
        "brasile": "brazil", "stati uniti": "united states", "arabia": "saudi",
    }
    needle = ALIASES.get(value.lower(), value.lower())

    for i, m in enumerate(get_meetings(year), start=1):
        haystack = " ".join(
            str(m.get(k, "")) for k in
            ("meeting_name", "meeting_official_name", "circuit_short_name", "country_name", "location")
        ).lower()
        if needle in haystack:
            return i

    print(f"Non riesco a identificare '{value}' nel calendario {year}.")
    return None


def main() -> None:
    args = sys.argv[1:]
    if args and args[0] == "--auto":
        auto()
    elif len(args) == 2:
        year = int(args[0])
        rnd = resolve_round(year, args[1])
        if rnd is None:
            sys.exit(1)
        process_round(year, rnd)
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
