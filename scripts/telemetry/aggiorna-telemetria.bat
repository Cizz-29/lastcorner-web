@echo off
REM ---------------------------------------------------------------------
REM  Telemetria automatica dal PC.
REM
REM  Lo lancia ogni mezz'ora l'Utilita' di pianificazione di Windows (vedi
REM  installa-telemetria-automatica.bat). Se una sessione di F1 e' finita da
REM  almeno 40 minuti e non e' ancora sul sito, la scarica con FastF1, fa il
REM  commit e il push: Vercel la pubblica da solo.
REM
REM  Perche' dal PC e non da GitHub: l'archivio della F1 non risponde ai
REM  server di GitHub (verificato il 2 ottobre 2026, FP1 e FP2 di Sepang:
REM  "Failed to load timing data"), mentre dal tuo computer funziona.
REM
REM  Il registro di ogni esecuzione e' in scripts\telemetry\automatico.log.
REM ---------------------------------------------------------------------

cd /d "%~dp0\..\.."
set "LOG=%~dp0automatico.log"
set "anno="
set "round="
set "sessioni="

for /f "tokens=1,2 delims==" %%a in ('python scripts\telemetry\serve_aggiornare.py 2^>nul') do set "%%a=%%b"
if "%round%"=="" exit /b 0

echo. >> "%LOG%"
echo ==== %date% %time%: round %round%, sessioni %sessioni% >> "%LOG%"

REM Prima si allinea il repository: il bot delle statistiche (GitHub)
REM puo' aver fatto un commit nel frattempo.
git pull --rebase --autostash >> "%LOG%" 2>&1

python scripts\telemetry\process_session.py %anno% %round% --sessioni "%sessioni%" >> "%LOG%" 2>&1

git add public/telemetria-data >> "%LOG%" 2>&1
git diff --cached --quiet
if not errorlevel 1 (
  echo Nessun dato nuovo: l'archivio F1 non e' ancora aggiornato. >> "%LOG%"
  exit /b 0
)
git commit -m "Telemetria: round %round% %sessioni%" >> "%LOG%" 2>&1
git push >> "%LOG%" 2>&1
