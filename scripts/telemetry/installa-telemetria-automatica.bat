@echo off
REM ---------------------------------------------------------------------
REM  Doppio clic UNA VOLTA SOLA: registra nell'Utilita' di pianificazione
REM  di Windows l'attivita' "Lastcorner Telemetria", che ogni 30 minuti
REM  controlla se c'e' una sessione di F1 da scaricare e la pubblica.
REM
REM  Funziona quando il PC e' acceso e sei collegato. Per toglierla:
REM      schtasks /Delete /TN "Lastcorner Telemetria" /F
REM ---------------------------------------------------------------------

cd /d "%~dp0"
schtasks /Create /TN "Lastcorner Telemetria" /TR "wscript.exe \"%~dp0aggiorna-telemetria.vbs\"" /SC MINUTE /MO 30 /F
if errorlevel 1 (
  echo.
  echo Non sono riuscito a creare l'attivita'.
  pause
  exit /b 1
)
echo.
echo Fatto. Prima prova adesso:
call "%~dp0aggiorna-telemetria.bat"
echo Registro: %~dp0automatico.log
pause
