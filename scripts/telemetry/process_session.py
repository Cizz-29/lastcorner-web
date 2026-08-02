"""Pipeline dati Telemetria — Lastcorner.

Scarica i dati di TUTTE le sessioni di un weekend F1 (libere, qualifiche,
sprint, gara) dall'API pubblica OpenF1 e li salva come JSON statici in
public/telemetria-data/, pronti per essere serviti da Vercel senza backend.

Perché OpenF1 e non FastF1: l'API di live timing usata da FastF1 blocca gli
IP dei datacenter, quindi su GitHub Actions ogni richiesta tornava vuota.
OpenF1 è una REST API aperta, raggiungibile ovunque, con gli stessi dati.

Uso:
    python process_session.py 2026 11     # anno + round
    python process_session.py --auto      # ultimo weekend concluso mancante

Struttura prodotta:
    index.json                                   elenco weekend
    <anno>/<round>/<sessione>/pace.json          tempi sul giro di tutti
    <anno>/<round>/<sessione>/laps.json          giri con telemetria disponibile
    <anno>/<round>/<sessione>/tel/<numero>.json  telemetria per pilota
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

TELEMETRY_POINTS = 350
THROTTLE_S = 0.25
DEFAULT_COLOR = "FF3A3A"

# Sessioni del weekend, nell'ordine in cui si svolgono. "tel" indica quanti
# giri per pilota salvare con la telemetria completa: nelle qualifiche il
# confronto del giro secco è il cuore dell'analisi, nelle libere bastano
# pochi riferimenti, in gara/sprint interessa il passo più che il giro.
SESSION_TYPES = [
    {"api": "Practice 1", "key": "FP1", "label": "Libere 1", "tel": 3},
    {"api": "Practice 2", "key": "FP2", "label": "Libere 2", "tel": 3},
    {"api": "Practice 3", "key": "FP3", "label": "Libere 3", "tel": 3},
    {"api": "Sprint Qualifying", "key": "SQ", "label": "Qualifica Sprint", "tel": 4},
    {"api": "Sprint", "key": "SPR", "label": "Sprint", "tel": 0},
    {"api": "Qualifying", "key": "Q", "label": "Qualifica", "tel": 5},
    {"api": "Race", "key": "R", "label": "Gara", "tel": 0},
]


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


def save_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


# --- Anagrafiche -----------------------------------------------------------

def get_meetings(year: int) -> list:
    """Gran Premi dell'anno, ordinati per data (l'indice+1 è il 'round').

    Vanno esclusi i test pre-stagionali e i GP cancellati: OpenF1 li elenca
    insieme agli altri, ma non contano nella numerazione ufficiale.
    """
    meetings = get("meetings", year=year)
    meetings = [
        m
        for m in meetings
        if m.get("date_start")
        and not m.get("is_cancelled")
        and "testing" not in (m.get("meeting_name") or "").lower()
    ]
    meetings.sort(key=lambda m: m["date_start"])
    return meetings


def get_drivers(session_key: int) -> dict:
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


def final_positions(session_key: int) -> dict:
    out: dict = {}
    for p in get("position", session_key=session_key):
        num = p.get("driver_number")
        if num is None or p.get("position") is None:
            continue
        prev = out.get(num)
        if prev is None or (p.get("date") or "") > prev[1]:
            out[num] = (int(p["position"]), p.get("date") or "")
    return {num: pos for num, (pos, _) in out.items()}


# --- Telemetria ------------------------------------------------------------

def resample(points: list, n: int) -> list:
    if len(points) <= n:
        return points
    step = len(points) / n
    return [points[int(i * step)] for i in range(n)]


def build_telemetry(session_key: int, driver_number: int, lap: dict) -> dict | None:
    """Telemetria di un giro, ricampionata, con distanza calcolata.

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
        dist += (spd / 3.6) * dt
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


# --- Elaborazione di una sessione -----------------------------------------

def process_session(session: dict, spec: dict, base: Path) -> dict | None:
    """Elabora una sessione: sempre il passo (tempi sul giro), e se previsto
    anche la telemetria dei giri più veloci di ciascun pilota."""
    session_key = session["session_key"]
    laps = get("laps", session_key=session_key)
    if not laps:
        print(f"  [{spec['key']}] nessun giro disponibile")
        return None

    drivers_info = get_drivers(session_key)
    stints = stint_lookup(session_key)
    positions = final_positions(session_key)
    out_dir = base / spec["key"]

    # --- Passo: tutti i giri di tutti i piloti ---
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

    pace_drivers = []
    for num, lap_list in by_driver.items():
        info = drivers_info.get(
            num, {"abbr": str(num), "name": str(num), "team": "", "color": f"#{DEFAULT_COLOR}"}
        )
        lap_list.sort(key=lambda l: l["n"])
        pace_drivers.append(
            {**info, "number": num, "position": positions.get(num), "status": "", "laps": lap_list}
        )
    pace_drivers.sort(key=lambda d: d["position"] if d["position"] is not None else 99)

    if not pace_drivers:
        return None
    save_json(out_dir / "pace.json", {"session": spec["key"], "drivers": pace_drivers})
    print(f"  [{spec['key']}] passo: {len(pace_drivers)} piloti")

    result = {"key": spec["key"], "label": spec["label"], "pace": True, "telemetry": False}

    # --- Telemetria: solo per le sessioni dove il giro secco conta ---
    max_laps = spec["tel"]
    if max_laps <= 0:
        return result

    timed: dict = {}
    for lap in laps:
        num = lap.get("driver_number")
        dur = lap.get("lap_duration")
        if num is None or not dur or lap.get("is_pit_out_lap"):
            continue
        timed.setdefault(num, []).append(lap)

    if not timed:
        return result

    ranked = sorted(timed.items(), key=lambda kv: min(l["lap_duration"] for l in kv[1]))
    tel_drivers = []
    for position, (num, driver_laps) in enumerate(ranked, start=1):
        info = drivers_info.get(
            num, {"abbr": str(num), "name": str(num), "team": "", "color": f"#{DEFAULT_COLOR}"}
        )
        driver_laps.sort(key=lambda l: l["lap_duration"])
        lap_meta = []
        telemetry_by_lap = {}
        for lap in driver_laps[:max_laps]:
            n = lap.get("lap_number")
            tel = build_telemetry(session_key, num, lap)
            time.sleep(THROTTLE_S)
            if tel is None:
                continue
            compound, _ = stints.get((num, n), (None, None))
            telemetry_by_lap[str(n)] = tel
            lap_meta.append(
                {
                    "lap": int(n) if n is not None else 0,
                    "time": round(float(lap["lap_duration"]), 3),
                    "compound": compound,
                }
            )
        if not lap_meta:
            continue
        lap_meta.sort(key=lambda l: l["time"])
        save_json(out_dir / "tel" / f"{num}.json", telemetry_by_lap)
        tel_drivers.append(
            {
                **info,
                "number": num,
                "position": position,
                "lapTime": lap_meta[0]["time"],
                "compound": lap_meta[0]["compound"],
                "bestLap": lap_meta[0]["lap"],
                "laps": lap_meta,
            }
        )

    if tel_drivers:
        save_json(out_dir / "laps.json", {"session": spec["key"], "drivers": tel_drivers})
        result["telemetry"] = True
        print(f"  [{spec['key']}] telemetria: {len(tel_drivers)} piloti")

    return result


# --- Weekend ---------------------------------------------------------------

def load_index() -> list:
    index_path = OUT / "index.json"
    if index_path.exists():
        return json.loads(index_path.read_text(encoding="utf-8"))
    return []


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

    available = get("sessions", meeting_key=meeting["meeting_key"])
    by_name = {s.get("session_name"): s for s in available}

    base = OUT / str(year) / str(rnd)
    sessions = []
    for spec in SESSION_TYPES:
        session = by_name.get(spec["api"])
        if not session:
            continue
        info = process_session(session, spec, base)
        if info:
            sessions.append(info)

    if not sessions:
        print("  nessun dato disponibile, salto")
        return False

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
    print(f"  fatto: {len(sessions)} sessioni")
    return True


def auto() -> None:
    """Elabora l'ultimo weekend concluso non ancora presente nell'indice."""
    now = datetime.now(timezone.utc)
    year = now.year
    meetings = get_meetings(year)
    if not meetings:
        print("Calendario non disponibile.")
        return

    # Un weekend è "fatto" se ha già la gara elaborata.
    done = set()
    for e in load_index():
        if e.get("year") != year:
            continue
        keys = [s.get("key") if isinstance(s, dict) else s for s in e.get("sessions", [])]
        if "R" in keys:
            done.add(e["round"])

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
