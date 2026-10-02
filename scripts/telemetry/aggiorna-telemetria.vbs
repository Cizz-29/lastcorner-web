' Avvia aggiorna-telemetria.bat senza aprire la finestra nera ogni mezz'ora.
CreateObject("WScript.Shell").Run """" & Replace(WScript.ScriptFullName, ".vbs", ".bat") & """", 0, False
