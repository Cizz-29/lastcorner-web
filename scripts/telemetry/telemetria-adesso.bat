@echo off
REM ---------------------------------------------------------------------
REM  Telemetria A MANO: doppio clic quando l'automatico non e' partito.
REM
REM  1. Cerca da solo la sessione che manca sul sito (finita da almeno 40
REM     minuti e da non piu' di 36 ore).
REM  2. Se non ne trova, ti chiede round e sessioni (utile oltre le 36 ore).
REM  3. Scarica i dati, fa commit e push: Vercel pubblica da solo in
REM     qualche minuto.
REM
REM  La finestra resta aperta alla fine: leggi l'ultima riga per sapere
REM  com'e' andata.
REM ---------------------------------------------------------------------

cd /d "%~dp0\..\.."
set "anno="
set "round="
set "sessioni="

echo Cerco le sessioni che mancano sul sito...
for /f "tokens=1,2 delims==" %%a in ('python scripts\telemetry\serve_aggiornare.py') do set "%%a=%%b"

if "%round%"=="" (
  echo.
  echo Nessuna sessione in attesa trovata in automatico.
  set /p "round=Round da elaborare (es. 17), oppure INVIO per uscire: "
)
if "%round%"=="" goto fine
if "%anno%"=="" set "anno=2026"
if "%sessioni%"=="" set /p "sessioni=Sessioni separate da virgola (es. Q,R): "
if "%sessioni%"=="" goto fine

echo.
echo === Round %round%, sessioni %sessioni% ===
echo.
echo Allineo il repository...
git pull --rebase --autostash
if errorlevel 1 (
  echo.
  echo ERRORE: git pull non e' riuscito. Scrivimi in chat.
  goto fine
)

echo.
echo Scarico ed elaboro i dati (qualche minuto)...
python scripts\telemetry\process_session.py %anno% %round% --sessioni "%sessioni%"

git add public/telemetria-data
git diff --cached --quiet
if not errorlevel 1 (
  echo.
  echo Nessun dato nuovo: l'archivio della F1 non li ha ancora pubblicati.
  echo Riprova tra mezz'ora.
  goto fine
)

git commit -m "Telemetria: round %round% %sessioni%"
git push
if errorlevel 1 (
  echo.
  echo ERRORE: push non riuscito. Riprova con: git pull --rebase  e poi  git push
  goto fine
)

echo.
echo FATTO: dati pubblicati. Il sito si aggiorna entro pochi minuti.

:fine
echo.
pause
