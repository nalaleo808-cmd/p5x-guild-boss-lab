@echo off
title P5X Guild Boss Lab
cd /d "%~dp0"
set "PORT=4174"
set "P5X_URL=http://127.0.0.1:4174/"

rem If a server is already listening on 4174, just open the page.
netstat -ano | findstr /r /c:"127.0.0.1:4174 .*LISTENING" >nul 2>nul
if not errorlevel 1 (
  echo P5X Guild Boss Lab is already running. Opening %P5X_URL%
  start "" "%P5X_URL%"
  exit /b 0
)

set "P5X_NODE=C:\Program Files\nodejs\node.exe"
if not exist "%P5X_NODE%" (
  set "P5X_NODE=node"
  where node >nul 2>nul
  if errorlevel 1 set "P5X_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
)
if not exist "%P5X_NODE%" (
  echo Node.js was not found. Install Node.js 18 or newer, then run this file again.
  pause
  exit /b 1
)

:run
echo Starting P5X Guild Boss Lab at %P5X_URL%
echo Close this window to stop the simulator.
rem Give the server a moment to bind, then open the browser.
start "" /b cmd /c "timeout /t 2 /nobreak >nul & start "" "%P5X_URL%""
"%P5X_NODE%" serve.mjs
