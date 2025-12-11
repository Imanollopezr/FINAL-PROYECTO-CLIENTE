image.png@echo off
setlocal
cd /d "%~dp0"

REM Fuerza a npm a usar cmd.exe para evitar fallos de PowerShell
set "npm_config_script_shell=%SystemRoot%\System32\cmd.exe"

echo Iniciando servidor de desarrollo de Vite...
call npm.cmd run dev -- --force

endlocal