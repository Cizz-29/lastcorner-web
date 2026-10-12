@echo off
REM ---------------------------------------------------------------------
REM  Trova il Python da usare e lo mette in PY. Lo chiamano
REM  aggiorna-telemetria.bat e telemetria-adesso.bat.
REM
REM  Perche': il 12 ottobre 2026 "python" sul PC portava al collegamento di
REM  Microsoft Store (WindowsApps\python.exe), rotto, mentre il Python vero
REM  e' in AppData\Local\Programs\Python\Python313. Il controllo falliva in
REM  silenzio e la telemetria di qualifica e gara non partiva.
REM
REM  Ordine: Python installato da python.org (la versione piu' recente),
REM  poi il lanciatore "py", poi "python". Se a quel Python manca FastF1,
REM  lo installa (una volta sola, un paio di minuti).
REM ---------------------------------------------------------------------

set "PY="
for /d %%d in ("%LOCALAPPDATA%\Programs\Python\Python3*") do if exist "%%d\python.exe" set "PY=%%d\python.exe"
if not defined PY (
  py -3 --version >nul 2>&1 && set "PY=py -3"
)
if not defined PY (
  python --version >nul 2>&1 && set "PY=python"
)
if not defined PY exit /b 1

%PY% -c "import fastf1" >nul 2>&1
if errorlevel 1 (
  echo Installo FastF1 per %PY% ^(solo la prima volta^)...
  %PY% -m pip install --quiet -r "%~dp0requirements.txt"
)
%PY% -c "import fastf1" >nul 2>&1
if errorlevel 1 exit /b 2
exit /b 0
