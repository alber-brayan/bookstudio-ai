@echo off
setlocal
cd /d "%~dp0"
echo BookStudio AI - Instalacion local
node --version >nul 2>&1
if errorlevel 1 (
  echo Instala Node.js 24 LTS o superior y vuelve a ejecutar este archivo.
  pause
  exit /b 1
)
call npm ci
if errorlevel 1 exit /b 1
python -m pip install -r processing\requirements.txt
if errorlevel 1 exit /b 1
call npm run browser:install
if errorlevel 1 exit /b 1
echo Instalacion completada. Ejecuta INICIAR BOOKSTUDIO.cmd
pause
