@echo off
REM ---------------------------------------------------------------------
REM  Doppio clic UNA VOLTA SOLA: registra nell'Utilita' di pianificazione
REM  di Windows l'attivita' "Lastcorner Telemetria", che ogni 30 minuti
REM  controlla se c'e' una sessione di F1 da scaricare e la pubblica.
REM
REM  Funziona quando il PC e' acceso e sei collegato, anche a batteria; se
REM  il PC dormiva, recupera appena si risveglia. Rilanciarlo e' innocuo:
REM  sostituisce l'attivita' esistente. Per toglierla:
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

REM Le attivita' create con schtasks NON partono se il portatile va a
REM batteria e non recuperano i turni saltati mentre il PC dormiva: il 10 e
REM l'11 ottobre 2026 qualifica e gara di Singapore non sono partite. Qui si
REM tolgono i due limiti.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$t = Get-ScheduledTask -TaskName 'Lastcorner Telemetria'; $t.Settings.DisallowStartIfOnBatteries = $false; $t.Settings.StopIfGoingOnBatteries = $false; $t.Settings.StartWhenAvailable = $true; Set-ScheduledTask -InputObject $t | Out-Null"
if errorlevel 1 (
  echo.
  echo Attivita' creata, ma non sono riuscito a farla partire anche a batteria.
)
echo.
echo Fatto. Prima prova adesso:
call "%~dp0aggiorna-telemetria.bat"
echo Registro: %~dp0automatico.log
pause
