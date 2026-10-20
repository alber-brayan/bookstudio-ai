@echo off
setlocal
cd /d "%~dp0"
set NEXT_TELEMETRY_DISABLED=1
powershell -NoProfile -Command "try { $r = Invoke-RestMethod 'http://127.0.0.1:3000/api/health' -TimeoutSec 2; if ($r.app -eq 'bookstudio-ai') { exit 0 } } catch {}; exit 1"
if not errorlevel 1 (
  start "" "http://127.0.0.1:3000"
  exit /b 0
)
if not exist node_modules\next (
  echo Ejecuta INSTALAR.cmd primero.
  pause
  exit /b 1
)
echo Editorial D'Fernandez: http://127.0.0.1:3000
echo Conserva esta ventana abierta. Ctrl+C detiene el servidor.
start "" "http://127.0.0.1:3000"
call npm run dev
