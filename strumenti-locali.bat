@echo off
REM ---------------------------------------------------------------------
REM  Strumenti Lastcorner in locale (telemetria + generatore grafiche).
REM
REM  Doppio clic su questo file: avvia il sito sul tuo computer e apre il
REM  browser. Niente di tutto questo passa da internet - i dati telemetria
REM  sono gia' su disco e le foto delle grafiche non escono dal PC.
REM
REM  Per chiudere: chiudi la finestra nera intitolata "Lastcorner locale".
REM ---------------------------------------------------------------------

cd /d "%~dp0"
title Avvio strumenti Lastcorner

REM L'interruttore che accende telemetria e grafiche. Su Vercel non esiste,
REM quindi online quelle pagine restano spente.
if not exist ".env.local" (
  echo STRUMENTI_LOCALI=true> .env.local
  echo Creato .env.local con l'interruttore degli strumenti.
) else (
  findstr /b /c:"STRUMENTI_LOCALI=" .env.local >nul 2>&1
  if errorlevel 1 (
    echo STRUMENTI_LOCALI=true>> .env.local
    echo Aggiunto l'interruttore degli strumenti a .env.local.
  )
)

if not exist "node_modules" (
  echo.
  echo Prima installo le dipendenze. Va fatto una volta sola e ci mette un po'.
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo Installazione fallita. Controlla che Node sia installato: node --version
    pause
    exit /b 1
  )
)

echo.
echo   Telemetria ........ http://localhost:3000/telemetria
echo   Grafiche .......... http://localhost:3000/grafiche
echo.
echo   Avvio in corso, il browser si apre da solo fra qualche secondo.
echo.

start "Lastcorner locale" cmd /k npm run dev
timeout /t 12 /nobreak >nul
start "" http://localhost:3000/telemetria
exit /b 0
