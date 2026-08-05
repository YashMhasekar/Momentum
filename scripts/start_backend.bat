@echo off
cd /d "%~dp0..\backend\ai-service"
echo ========================================
echo   AI Mentor Backend Startup
echo ========================================
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo [ERROR] Virtual environment not found!
    echo Please create it first:
    echo   python -m venv venv
    echo   venv\Scripts\activate
    echo   pip install -r requirements.txt
    pause
    exit /b 1
)

REM Activate virtual environment
echo [1/3] Activating virtual environment...
call venv\Scripts\activate.bat

REM Check if .env exists
if not exist ".env" (
    echo.
    echo [WARNING] .env file not found!
    echo Please copy .env.example to .env and add your GROQ_API_KEY
    echo.
    pause
    exit /b 1
)

REM Check if requirements are installed
echo [2/3] Checking dependencies...
python -c "import fastapi" 2>nul
if errorlevel 1 (
    echo [WARNING] Dependencies not installed!
    echo Installing requirements...
    pip install -r requirements.txt
)

REM Start the server
echo [3/3] Starting FastAPI server...
echo.
echo ========================================
echo   Backend running on:
echo   http://127.0.0.1:8000
echo.
echo   Press Ctrl+C to stop
echo ========================================
echo.

python chatbot_api.py

pause
