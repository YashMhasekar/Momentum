@echo off
cd /d "%~dp0.."
echo ========================================
echo   EMOTION DETECTION - START MENU
echo ========================================
echo.
echo Choose your option:
echo.
echo 1. Use DeepFace (Original - Requires TensorFlow)
echo 2. Use FER (Alternative - Lightweight, No TensorFlow)
echo 3. Install FER library
echo 4. Test TensorFlow
echo 5. Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto deepface
if "%choice%"=="2" goto fer
if "%choice%"=="3" goto install
if "%choice%"=="4" goto test
if "%choice%"=="5" goto end

:deepface
echo.
echo ========================================
echo   Starting with DeepFace...
echo ========================================
echo.
cd backend\ai-service
python chatbot_api.py
goto end

:fer
echo.
echo ========================================
echo   Starting with FER (Alternative)...
echo ========================================
echo.
echo Checking if FER is installed...
python -c "import fer" 2>nul
if errorlevel 1 (
    echo.
    echo FER is not installed!
    echo Installing FER...
    pip install fer
    echo.
)
cd backend\ai-service
python chatbot_api_alternative.py
goto end

:install
echo.
echo ========================================
echo   Installing FER Library...
echo ========================================
echo.
pip install fer
echo.
echo Installation complete!
echo Press any key to return to menu...
pause >nul
cls
goto :eof

:test
echo.
echo ========================================
echo   Testing TensorFlow...
echo ========================================
echo.
python -c "import tensorflow as tf; print('TensorFlow version:', tf.__version__); print('SUCCESS: TensorFlow is working!')"
if errorlevel 1 (
    echo.
    echo ========================================
    echo   TensorFlow Test FAILED
    echo ========================================
    echo.
    echo TensorFlow is not working on your system.
    echo.
    echo Solutions:
    echo 1. Install Visual C++ Redistributables
    echo    Download: https://aka.ms/vs/17/release/vc_redist.x64.exe
    echo.
    echo 2. Use FER alternative (Option 2 from menu)
    echo.
) else (
    echo.
    echo ========================================
    echo   TensorFlow Test PASSED
    echo ========================================
    echo.
    echo TensorFlow is working! You can use DeepFace (Option 1)
    echo.
)
echo.
echo Press any key to return to menu...
pause >nul
cls
goto :eof

:end
pause
