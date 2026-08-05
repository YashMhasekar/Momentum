@echo off
cd /d "%~dp0.."
echo ========================================
echo   RESTARTING AI SERVICE WITH FIX
echo ========================================
echo.
echo This script will restart the AI service with the emotion detection fix applied.
echo.
echo IMPORTANT: Make sure you have stopped the old service first (Ctrl+C)
echo.
pause

cd backend\ai-service

echo.
echo Starting AI Service...
echo.
echo If you see errors about missing packages, run:
echo   pip install -r requirements.txt
echo.
echo ========================================
echo   AI SERVICE STARTING...
echo ========================================
echo.

python chatbot_api.py

pause
