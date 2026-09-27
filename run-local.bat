@echo off
cd /d "%~dp0"
set "P5X_NODE=node"
where node >nul 2>nul
if errorlevel 1 set "P5X_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "%P5X_NODE%" if "%P5X_NODE%"=="node" goto run
if not exist "%P5X_NODE%" (
  echo Node.js was not found. Install Node.js 18 or newer, then run this file again.
  pause
  exit /b 1
)
:run
"%P5X_NODE%" serve.mjs
