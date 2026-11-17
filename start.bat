@echo off
title ClassClockwork - ZeroClash Sprint Timetable Generator
echo ========================================================
echo   Starting ClassClockwork Timetable Generator
echo ========================================================

:: Ensure Node.js is in PATH
set "PATH=C:\Program Files\nodejs;%PATH%"

:: Navigate to project directory
cd /d "%~dp0"

echo Project Directory: %CD%
echo Node Version:
node -v
echo NPM Version:
call npm -v
echo.

echo Launching ClassClockwork (Frontend on http://localhost:5173, Backend on http://localhost:3001)...
echo.

:: Open browser after a short delay
start "" http://localhost:5173

:: Start the development server
call npm run dev
pause
