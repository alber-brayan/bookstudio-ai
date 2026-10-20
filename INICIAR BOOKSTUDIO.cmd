@echo off
setlocal
cd /d "%~dp0"
set NEXT_TELEMETRY_DISABLED=1
powershell -NoProfile -Command "try { $r = Invoke-RestMethod 'http://127.0.0.1:3000/api/health' -TimeoutSec 2; if ($r.app -eq 'bookstudio-ai') { exit 0 } } catch {}; exit 1"
if not errorlevel 1 (
  start "" "http://127.0.0.1:3000/studio"
  exit /b 0
)
if not exist node_modules\next (
  echo Ejecuta INSTALAR.cmd primero.
  pause
  exit /b 1
)
python -c "import cv2, PIL, numpy" >nul 2>&1
if errorlevel 1 (
  echo Faltan las dependencias de Python. Ejecuta INSTALAR.cmd
  pause
  exit /b 1
)
echo Abre http://127.0.0.1:3000/studio en tu navegador.
echo Conserva esta ventana abierta. Ctrl+C detiene el estudio.
start "" "http://127.0.0.1:3000/studio"
call npm run dev
