@echo off
cd /d "%~dp0.."
echo ========================================
echo Checking Momentum Services Status
echo ========================================
echo.

echo [1/3] Checking AI Service (Port 8000)...
curl -s http://127.0.0.1:8000/health >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ AI Service is RUNNING
    curl -s http://127.0.0.1:8000/health
) else (
    echo ❌ AI Service is NOT RUNNING
    echo    Start it with: cd backend\ai-service ^&^& python chatbot_api.py
)
echo.

echo [2/3] Checking Node Server (Port 5000)...
curl -s http://localhost:5000/ >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Node Server is RUNNING
) else (
    echo ❌ Node Server is NOT RUNNING
    echo    Start it with: cd backend\server ^&^& node server.js
)
echo.

echo [3/3] Checking Frontend (Port 5173)...
curl -s http://localhost:5173/ >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Frontend is RUNNING
) else (
    echo ❌ Frontend is NOT RUNNING
    echo    Start it with: cd frontend ^&^& npm run dev
)
echo.

echo ========================================
echo Status Check Complete
echo ========================================
echo.
echo If any service is not running, start it using the commands above.
echo.
pause
