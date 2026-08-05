@echo off
cd /d "%~dp0.."
echo ========================================
echo Starting AI Service for Emotion Detection
echo ========================================
echo.

echo Checking if Python is installed...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed!
    echo Please install Python 3.8+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

echo ✅ Python is installed
echo.

echo Navigating to AI service directory...
cd backend\ai-service
if %errorlevel% neq 0 (
    echo ❌ Could not find backend\ai-service directory!
    echo Make sure you're running this from the project root.
    pause
    exit /b 1
)

echo ✅ Found AI service directory
echo.

echo Checking if dependencies are installed...
pip show fastapi >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Dependencies not installed. Installing now...
    echo This will take 5-10 minutes...
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies!
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully
) else (
    echo ✅ Dependencies already installed
)

echo.
echo ========================================
echo Starting AI Service on port 8000...
echo ========================================
echo.
echo ⚠️  IMPORTANT: Keep this window open!
echo ⚠️  Press Ctrl+C to stop the service
echo.
echo You should see:
echo   🤖 AI Mentor Backend Starting...
echo   📍 Server: http://127.0.0.1:8000
echo.
echo If you see that, the service is running!
echo.
echo ========================================
echo.

python chatbot_api.py

echo.
echo ========================================
echo AI Service has stopped
echo ========================================
pause
