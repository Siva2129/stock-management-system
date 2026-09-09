@echo off
title StockFlow - Stock Management System
color 0A

echo ========================================
echo    StockFlow - Stock Management System
echo    Express.js + MongoDB Backend
echo ========================================
echo.

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed! Download from https://nodejs.org/
    pause
    exit /b
)

echo [OK] Node.js found
echo.

:: Install backend dependencies
echo [1/3] Installing backend dependencies (npm)...
cd /d "%~dp0backend"
call npm install --silent 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies!
    pause
    exit /b
)
echo [OK] Backend dependencies ready
echo.

:: Install frontend dependencies
echo [2/3] Installing frontend dependencies...
cd /d "%~dp0frontend"
call npm install --silent 2>nul
echo [OK] Frontend dependencies ready
echo.

:: Start both servers
echo [3/3] Starting servers...
echo.
echo ========================================
echo   Backend  : http://localhost:5000
echo   Frontend : http://localhost:5173
echo ========================================
echo.
echo   Login Credentials:
echo   Admin   : admin@stock.com   / admin123
echo   Manager : manager@stock.com / manager123
echo   Staff   : staff@stock.com   / staff123
echo ========================================
echo.
echo   MongoDB must be running on localhost:27017
echo   (Or update MONGO_URI in backend/.env)
echo ========================================
echo.
echo   Opening app in browser in 5 seconds...
echo   Press Ctrl+C to stop both servers.
echo ========================================
echo.

:: Start backend in background
cd /d "%~dp0backend"
start "StockFlow Backend" cmd /c "node server.js"

:: Wait for backend to start, then open browser
timeout /t 5 /nobreak >nul
start http://localhost:5173

:: Start frontend (foreground - keeps window open)
cd /d "%~dp0frontend"
call npm run dev
